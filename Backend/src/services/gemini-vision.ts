import {
  ClaudeVisionError,
  visionResultSchema,
  MAX_AI_IMAGE_BYTES,
  type VisionImage,
  type VisionCallResult,
} from "./claude-vision.js";
import type { AppEnv } from "../config/env.js";

export async function compareZoneImagesWithGemini(
  zone: string,
  baseline: VisionImage,
  current: VisionImage,
  env: AppEnv,
): Promise<VisionCallResult> {
  if (!env.GEMINI_API_KEY) {
    throw new ClaudeVisionError("Configure GEMINI_API_KEY en Backend/.env.", 503, "AI_NOT_CONFIGURED");
  }
  for (const image of [baseline, current]) {
    if (image.buffer.byteLength === 0 || image.buffer.byteLength > MAX_AI_IMAGE_BYTES) {
      throw new ClaudeVisionError("Una imagen supera el límite de 7 MB para el análisis o está vacía.", 413, "AI_IMAGE_SIZE_LIMIT");
    }
  }

  const model = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const prompt = `Compare Image A (BASELINE / earlier inspection) with Image B (CURRENT / later inspection) for the same vehicle zone: "${zone}".
Identify only damage that is visibly new in Image B. Ignore differences caused by lighting, reflections, shadows, dirt, weather, image compression, and camera angle or framing. Do not infer hidden damage, cause, repair cost, or details that cannot be seen. If the views are not sufficiently comparable, visibility is poor, or evidence is ambiguous, return INCONCLUSIVE.
Return only one JSON object with this exact shape:
{"result":"NEW_DAMAGE|NO_CHANGE|INCONCLUSIVE","summary":"short evidence-based summary","findings":[{"type":"SCRATCH|DENT|CRACK|BROKEN_PART|OTHER","locationDescription":"where on the visible vehicle area","description":"what is visibly different in the current image","severity":"LOW|MEDIUM|HIGH|UNKNOWN","confidence":0.0}]}
Use NEW_DAMAGE only when at least one new visible damage is supported by the pair. Use NO_CHANGE only when the images are comparable and no new damage is visible. Use INCONCLUSIVE when uncertain. For NO_CHANGE and INCONCLUSIVE, findings must be an empty array. Confidence is a rough, uncalibrated estimate, not a probability guarantee. Never claim pixel-level localization. Every finding will require human review.`;

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: "Image A — BASELINE (earlier inspection):" },
              { inline_data: { mime_type: baseline.mimeType, data: baseline.buffer.toString("base64") } },
              { text: "Image B — CURRENT (later inspection):" },
              { inline_data: { mime_type: current.mimeType, data: current.buffer.toString("base64") } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 1200,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ClaudeVisionError("Gemini tardó demasiado en responder. No se reintentó automáticamente.", 504, "GEMINI_TIMEOUT");
    }
    throw new ClaudeVisionError("No fue posible conectar con Gemini. No se reintentó automáticamente.", 502, "GEMINI_CONNECTION_ERROR");
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new ClaudeVisionError("Gemini alcanzó el límite de solicitudes de la cuota disponible. Inténtelo más tarde.", 429, "GEMINI_RATE_LIMIT");
    }
    if (response.status === 503 || response.status >= 500) {
      throw new ClaudeVisionError("Gemini no está disponible temporalmente. No se reintentó automáticamente.", 502, "GEMINI_UNAVAILABLE");
    }
    throw new ClaudeVisionError("Gemini rechazó la solicitud. Revise la API key, el modelo y la disponibilidad del nivel gratuito.", 502, "GEMINI_REQUEST_REJECTED");
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  };
  const text = payload.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;
  if (!text) throw new ClaudeVisionError("Gemini devolvió una respuesta vacía.", 502, "GEMINI_EMPTY_RESPONSE");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw new ClaudeVisionError("Gemini devolvió un resultado que no es JSON válido.", 502, "GEMINI_INVALID_JSON");
  }
  const validated = visionResultSchema.safeParse(parsed);
  if (!validated.success) {
    throw new ClaudeVisionError("La respuesta de Gemini no cumple el formato esperado.", 502, "GEMINI_INVALID_OUTPUT");
  }

  return {
    result: validated.data,
    model,
    inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
  };
}
