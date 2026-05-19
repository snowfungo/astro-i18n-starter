import type { APIContext } from "astro";

import {
  styleLabels,
  stylePrompts,
  type ChibiStyle,
  type SourceType,
} from "@/lib/server/config/app";
import { serverEnv } from "@/lib/server/config/env";
import { ensureSubscription } from "@/lib/server/auth/subscriptions";
import {
  deductCredits,
  ensureSignupCredits,
  getAvailableCredits,
  getCostForSourceType,
  refundCredits,
} from "@/lib/server/credits/service";
import { all, get, run } from "@/lib/server/db/client";
import { nowIso, stringifyJson } from "@/lib/server/db/utils";
import { refundAnonymousQuota, reserveAnonymousQuota } from "@/lib/server/quota/service";

export class ChibiProviderError extends Error {}

function buildPrompt(prompt: string, style: ChibiStyle, sourceType: SourceType) {
  const stylePrompt = stylePrompts[style] ?? stylePrompts.classic;
  const base = prompt.trim() || "a cute original anime character";
  if (sourceType === "image") {
    return `Convert the uploaded reference into a cute chibi anime character. Keep recognizable hairstyle, outfit, and personality. Style: ${stylePrompt}. User note: ${base}.`;
  }
  return `Create a cute chibi anime character. Style: ${stylePrompt}. User prompt: ${base}.`;
}

function wrapText(text: string, width = 34) {
  const normalized = (text || "Cute chibi character").trim().replace(/\s+/g, " ");
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.slice(0, 4);
}

function generateMockSvg(jobId: number, prompt: string, style: ChibiStyle, sourceType: SourceType) {
  const palettes: Record<ChibiStyle, [string, string, string]> = {
    classic: ["#ffd6e7", "#ff6fae", "#7c3aed"],
    kawaii: ["#fce7f3", "#f9a8d4", "#60a5fa"],
    avatar: ["#e0f2fe", "#38bdf8", "#2563eb"],
    emoji: ["#fef3c7", "#f59e0b", "#ef4444"],
  };
  const [bg, accent, ink] = palettes[style] ?? palettes.classic;
  const lines = wrapText(prompt);
  const textNodes = lines
    .map(
      (line, index) =>
        `<text x="512" y="${760 + index * 42}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#475569">${line}</text>`,
    )
    .join("");
  const label = styleLabels[style] ?? "Chibi";
  const source = sourceType === "image" ? "Photo to Chibi" : "Text to Chibi";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}" /><stop offset="1" stop-color="#ffffff" /></linearGradient></defs><rect width="1024" height="1024" rx="56" fill="url(#bg)" /><g><circle cx="512" cy="396" r="230" fill="#fff7ed" stroke="${ink}" stroke-width="16" /><path d="M336 340 C370 210, 470 180, 512 248 C560 178, 666 220, 690 344 C620 294, 430 294, 336 340Z" fill="${accent}" stroke="${ink}" stroke-width="14" stroke-linejoin="round" /><circle cx="420" cy="410" r="34" fill="${ink}" /><circle cx="604" cy="410" r="34" fill="${ink}" /><path d="M462 504 Q512 548 562 504" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round" /><path d="M376 638 Q512 720 648 638 L696 852 Q512 932 328 852 Z" fill="#ffffff" stroke="${ink}" stroke-width="14" stroke-linejoin="round" /></g><rect x="272" y="92" width="480" height="68" rx="34" fill="#ffffff" opacity="0.78" /><text x="512" y="136" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="${ink}">${label} · ${source}</text>${textNodes}<text x="512" y="948" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#64748b">Mock preview · connect a real image API when ready</text></svg>`;
  const encoded = typeof btoa === "function"
    ? btoa(svg)
    : Buffer.from(svg, "utf8").toString("base64");
  return `data:image/svg+xml;base64,${encoded}`;
}

async function generateWithProvider(input: {
  finalPrompt: string;
  imageBytes?: Uint8Array | null;
  imageName?: string | null;
  imageType?: string | null;
}) {
  if (serverEnv.aiGenerationProvider !== "ai_content_service") {
    throw new ChibiProviderError("Provider disabled");
  }

  const body = new FormData();
  body.set("model", serverEnv.aiImageModel);
  body.set("prompt", input.finalPrompt);
  body.set("size", serverEnv.aiImageSize);
  body.set("wait", "true");
  body.set("archive", "true");
  body.set("timeout", String(serverEnv.aiGenerationTimeout));

  if (input.imageBytes) {
    const blob = new Blob([input.imageBytes], {
      type: input.imageType ?? "application/octet-stream",
    });
    body.set("image", blob, input.imageName ?? "reference.png");
  }

  const response = await fetch(
    `${serverEnv.aiContentServiceUrl.replace(/\/$/, "")}/v1/images/generate-form`,
    {
      method: "POST",
      headers: serverEnv.aiContentServiceToken
        ? {
            Authorization: `Bearer ${serverEnv.aiContentServiceToken}`,
          }
        : undefined,
      body,
    },
  );

  if (!response.ok) {
    throw new ChibiProviderError(`AI content service failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    image_url?: string;
    model?: string;
    task_id?: string;
    archive_path?: string;
  };
  if (!payload.image_url) {
    throw new ChibiProviderError("AI content service response missing image_url");
  }
  return payload;
}

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
    styles: Object.fromEntries(
      styles.map((row) => [styleLabels[row.style as ChibiStyle] ?? row.style, Number(row.count)]),
    ),
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
  const cost = getCostForSourceType(sourceType);
  const prompt = input.prompt.trim();
  if (!prompt && !input.imageBytes) {
    throw new Error("Enter a prompt or upload an image");
  }

  let quotaReserved = false;
  let creditsDeducted = false;
  if (input.session.userId) {
    await ensureSubscription(input.session.userId);
    await ensureSignupCredits(input.session.userId);
    const available = await getAvailableCredits(input.session.userId);
    if (available < cost) {
      return {
        status: 429,
        body: {
          error: "Insufficient credits",
          required: cost,
          available,
          source_type: sourceType,
        },
      };
    }
    const deducted = await deductCredits(input.session.userId, cost, {
      source_type: sourceType,
      action: "pre_deduct",
    });
    if (!deducted.success) {
      return {
        status: 429,
        body: {
          error: "Insufficient credits",
          required: cost,
          available: deducted.available,
          source_type: sourceType,
        },
      };
    }
    creditsDeducted = true;
  } else {
    const quota = await reserveAnonymousQuota(input.context);
    if (!quota.allowed) {
      return {
        status: 429,
        body: {
          error: "Daily free image limit reached",
          limit: quota.limit,
          used: quota.used,
          remaining: quota.remaining,
          reset_at: quota.reset_at,
        },
      };
    }
    quotaReserved = true;
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
      cost,
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
        outputUrl = archivePath
          ? `/api/images/archive/${archivePath}`
          : (remoteUrl ?? "");
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

    if (quotaReserved && serverEnv.anonRefundOnProviderError) {
      await refundAnonymousQuota(input.context);
    }
    if (creditsDeducted && input.session.userId) {
      await refundCredits(input.session.userId, cost, {
        source_type: sourceType,
        reason: "provider_error",
      });
    }

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
