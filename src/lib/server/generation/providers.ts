import { styleLabels, type ChibiStyle, type SourceType } from "@/lib/server/config/app";
import { serverEnv } from "@/lib/server/config/env";

export class ChibiProviderError extends Error {}

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

export function generateMockSvg(jobId: number, prompt: string, style: ChibiStyle, sourceType: SourceType) {
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
    const encoded = typeof btoa === "function" ? btoa(svg) : Buffer.from(svg, "utf8").toString("base64");
    return `data:image/svg+xml;base64,${encoded}`;
}

export async function generateWithProvider(input: {
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

    const response = await fetch(`${serverEnv.aiContentServiceUrl.replace(/\/$/, "")}/v1/images/generate-form`, {
        method: "POST",
        headers: serverEnv.aiContentServiceToken
            ? {
                  Authorization: `Bearer ${serverEnv.aiContentServiceToken}`,
              }
            : undefined,
        body,
    });

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
