import { stylePrompts, type ChibiStyle, type SourceType } from "@/lib/server/config/app";

export function buildPrompt(prompt: string, style: ChibiStyle, sourceType: SourceType) {
    const stylePrompt = stylePrompts[style] ?? stylePrompts.classic;
    const base = prompt.trim() || "a cute original anime character";
    if (sourceType === "image") {
        return `Convert the uploaded reference into a cute chibi anime character. Keep recognizable hairstyle, outfit, and personality. Style: ${stylePrompt}. User note: ${base}.`;
    }
    return `Create a cute chibi anime character. Style: ${stylePrompt}. User prompt: ${base}.`;
}
