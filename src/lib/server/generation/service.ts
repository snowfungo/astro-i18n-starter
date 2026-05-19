import type { APIContext } from "astro";

import { styleLabels, type ChibiStyle, type SourceType } from "@/lib/server/config/app";
import { serverEnv } from "@/lib/server/config/env";
import { all, get, run } from "@/lib/server/db/client";
import { nowIso, stringifyJson } from "@/lib/server/db/utils";
import { buildPrompt } from "@/lib/server/generation/prompt";
import { ChibiProviderError, generateMockSvg, generateWithProvider } from "@/lib/server/generation/providers";
import { reserveGenerationAllowance, rollbackGenerationAllowance } from "@/lib/server/generation/settlement";

export { ChibiProviderError } from "@/lib/server/generation/providers";

export async function getHistory(session: { userId?: number | null; sessionId?: string | null }) {
    if (session.userId) {
        return await all(
            `SELECT id, status, prompt, style, source_type, output_url, created_at
             FROM image_generations WHERE user_id = ? ORDER BY created_at DESC LIMIT 24`,
            [session.userId],
        );
    }
    if (session.sessionId) {
        return await all(
            `SELECT id, status, prompt, style, source_type, output_url, created_at
             FROM image_generations WHERE session_id = ? ORDER BY created_at DESC LIMIT 24`,
            [session.sessionId],
        );
    }
    return [];
}

export async function getStats() {
    const total = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM image_generations WHERE status = 'completed'`,
    );
    const today = await get<{ count: number }>(
        `SELECT COUNT(*) as count FROM image_generations WHERE status = 'completed' AND created_at::date = CURRENT_DATE`,
    );
    const styles = await all<{ style: string; count: number }>(
        `SELECT style, COUNT(*) as count FROM image_generations
         WHERE status = 'completed'
         GROUP BY style ORDER BY count DESC`,
    );

    return {
        total: Number(total?.count ?? 0),
        today: Number(today?.count ?? 0),
        styles: Object.fromEntries(styles.map((row) => [styleLabels[row.style as ChibiStyle] ?? row.style, Number(row.count)])),
    };
}

export async function generateChibi(input: {
    context: APIContext;
    session: { userId?: number | null; sessionId: string };
    prompt: string;
    style: ChibiStyle;
    imageBytes?: Uint8Array | null;
    imageName?: string | null;
    imageType?: string | null;
}) {
    const sourceType: SourceType = input.imageBytes ? "image" : "text";
    const prompt = input.prompt.trim();
    if (!prompt && !input.imageBytes) {
        throw new Error("Enter a prompt or upload an image");
    }

    const allowance = await reserveGenerationAllowance({
        context: input.context,
        session: input.session,
        sourceType,
    });
    if (!allowance.ok) {
        return allowance.response;
    }

    const finalPrompt = buildPrompt(prompt, input.style, sourceType);
    const startedAt = performance.now();
    const insert = await run(
        `INSERT INTO image_generations (
          user_id, session_id, status, prompt, final_prompt, style, source_type,
          input_filename, input_size_bytes, input_content_type, model_provider, model,
          credits_cost, created_at, started_at
         ) VALUES (?, ?, 'processing', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
        [
            input.session.userId ?? null,
            input.session.sessionId,
            prompt,
            finalPrompt,
            input.style,
            sourceType,
            input.imageName ?? null,
            input.imageBytes?.byteLength ?? null,
            input.imageType ?? null,
            serverEnv.aiGenerationProvider,
            serverEnv.aiImageModel,
            allowance.cost,
            nowIso(),
            nowIso(),
        ],
    );
    const jobId = Number(insert.lastInsertRowid);

    try {
        let outputUrl = "";
        let provider = "mock";
        let model = "mock";
        let providerTaskId: string | null = null;
        let remoteUrl: string | null = null;
        let archivePath: string | null = null;
        let providerPayload: unknown = null;

        if (serverEnv.aiGenerationProvider === "ai_content_service") {
            try {
                const result = await generateWithProvider({
                    finalPrompt,
                    imageBytes: input.imageBytes,
                    imageName: input.imageName,
                    imageType: input.imageType,
                });
                provider = "ai_content_service";
                model = result.model ?? serverEnv.aiImageModel;
                providerTaskId = result.task_id ?? null;
                remoteUrl = result.image_url ?? null;
                archivePath = result.archive_path ?? null;
                providerPayload = result;
                outputUrl = archivePath ? `/api/images/archive/${archivePath}` : remoteUrl ?? "";
            } catch (error) {
                if (!serverEnv.allowMockFallback) {
                    throw error;
                }
                provider = "mock_fallback";
                outputUrl = generateMockSvg(jobId, finalPrompt, input.style, sourceType);
            }
        } else {
            outputUrl = generateMockSvg(jobId, finalPrompt, input.style, sourceType);
        }

        const latencyMs = Math.round(performance.now() - startedAt);
        await run(
            `UPDATE image_generations
             SET status = 'completed', output_url = ?, latency_ms = ?, completed_at = ?,
                 model_provider = ?, model = ?, provider_task_id = ?, remote_url = ?, archive_path = ?, provider_raw_json = ?
             WHERE id = ?`,
            [
                outputUrl,
                latencyMs,
                nowIso(),
                provider,
                model,
                providerTaskId,
                remoteUrl,
                archivePath,
                providerPayload ? stringifyJson(providerPayload) : null,
                jobId,
            ],
        );

        return {
            status: 200,
            body: {
                id: jobId,
                status: "completed",
                output_url: outputUrl,
                style: input.style,
                source_type: sourceType,
                model_provider: provider,
                latency_ms: latencyMs,
            },
        };
    } catch (error) {
        await run(
            `UPDATE image_generations SET status = 'failed', error = ?, completed_at = ? WHERE id = ?`,
            [error instanceof Error ? error.message : "Generation failed", nowIso(), jobId],
        );

        await rollbackGenerationAllowance({
            context: input.context,
            session: input.session,
            sourceType,
            cost: allowance.cost,
            quotaReserved: allowance.quotaReserved,
            creditsDeducted: allowance.creditsDeducted,
        });

        return {
            status: error instanceof ChibiProviderError ? 502 : 500,
            body: {
                error:
                    error instanceof ChibiProviderError
                        ? "Image generation service is temporarily unavailable. Please try again."
                        : error instanceof Error
                          ? error.message
                          : "Generation failed",
            },
        };
    }
}
