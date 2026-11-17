import { z } from "zod";
import type { AppEnv } from "../config/env.js";

export const PROMPT_VERSION = "vehicle-damage-comparison-v1";
export const MAX_AI_IMAGE_BYTES = 7 * 1024 * 1024;

const findingSchema = z.object({
  type: z.string().trim().min(1).max(80),
  locationDescription: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(1200),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  confidence: z.number().min(0).max(1),
}).strict();

export const visionResultSchema = z.object({
  result: z.enum(["NEW_DAMAGE", "NO_CHANGE", "INCONCLUSIVE"]),
  summary: z.string().trim().min(1).max(1600),
  findings: z.array(findingSchema).max(5),
}).strict().superRefine((value, context) => {
  if (value.result === "NEW_DAMAGE" && value.findings.length === 0) {
    context.addIssue({ code: "custom", message: "NEW_DAMAGE requires at least one finding." });
  }
  if (value.result !== "NEW_DAMAGE" && value.findings.length > 0) {
    context.addIssue({ code: "custom", message: "Only NEW_DAMAGE may contain findings." });
  }
});

export type VisionResult = z.infer<typeof visionResultSchema>;
export type VisionImage = { buffer: Buffer; mimeType: "image/jpeg" | "image/png" | "image/webp" };
export type VisionCallResult = { result: VisionResult; model: string; inputTokens: number; outputTokens: number };

export class ClaudeVisionError extends Error {
  constructor(message: string, public readonly statusCode = 502, public readonly code = "CLAUDE_PROVIDER_ERROR") {
    super(message);
    this.name = "ClaudeVisionError";
  }
}

export async function compareZoneImages(
  zone: string,
  baseline: VisionImage,
  current: VisionImage,
  env: AppEnv,
): Promise<VisionCallResult> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new ClaudeVisionError("Configure ANTHROPIC_API_KEY en Backend/.env.", 503, "AI_NOT_CONFIGURED");
  }
  for (const image of [baseline, current]) {
    if (image.buffer.byteLength === 0 || image.buffer.byteLength > MAX_AI_IMAGE_BYTES) {
      throw new ClaudeVisionError("Una imagen supera el límite de 7 MB para el análisis o está vacía.", 413, "AI_IMAGE_SIZE_LIMIT");
    }
  }

  const model = env.CLAUDE_MODEL || "claude-sonnet-4-5";
  const prompt = `Compare Image A (BASELINE / earlier inspection) with Image B (CURRENT / later inspection) for the same vehicle zone: "${zone}".
Identify only damage that is visibly new in Image B. Ignore differences caused by lighting, reflections, shadows, dirt, weather, image compression, and camera angle or framing. Do not infer hidden damage, cause, repair cost, or details that cannot be seen. If the views are not sufficiently comparable, visibility is poor, or evidence is ambiguous, return INCONCLUSIVE.
Return only one JSON object with this exact shape:
{"result":"NEW_DAMAGE|NO_CHANGE|INCONCLUSIVE","summary":"short evidence-based summary","findings":[{"type":"SCRATCH|DENT|CRACK|BROKEN_PART|OTHER","locationDescription":"where on the visible vehicle area","description":"what is visibly different in the current image","severity":"LOW|MEDIUM|HIGH|UNKNOWN","confidence":0.0}]}
Use NEW_DAMAGE only when at least one new visible damage is supported by the pair. Use NO_CHANGE only when the images are comparable and no new damage is visible. Use INCONCLUSIVE when uncertain. For NO_CHANGE and INCONCLUSIVE, findings must be an empty array. Confidence is a rough, uncalibrated estimate, not a probability guarantee. Never claim pixel-level localization. Every finding will require human review.`;

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        temperature: 0,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Image A — BASELINE:" },
            { type: "image", source: { type: "base64", media_type: baseline.mimeType, data: baseline.buffer.toString("base64") } },
            { type: "text", text: "Image B — CURRENT:" },
            { type: "image", source: { type: "base64", media_type: current.mimeType, data: current.buffer.toString("base64") } },
            { type: "text", text: prompt },
          ],
        }],
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ClaudeVisionError("Claude tardó demasiado en responder. No se reintentó automáticamente.", 504, "CLAUDE_TIMEOUT");
    }
    throw new ClaudeVisionError("No fue posible conectar con Claude. No se reintentó automáticamente.", 502, "CLAUDE_CONNECTION_ERROR");
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new ClaudeVisionError("Claude alcanzó el límite de solicitudes. Inténtelo más tarde; no se reintentó.", 429, "CLAUDE_RATE_LIMIT");
    }
    if (response.status === 529 || response.status >= 500) {
      throw new ClaudeVisionError("Claude no está disponible temporalmente. No se reintentó automáticamente.", 502, "CLAUDE_UNAVAILABLE");
    }
    throw new ClaudeVisionError("Claude rechazó la solicitud. Revise el modelo y la configuración de Anthropic.", 502, "CLAUDE_REQUEST_REJECTED");
  }

  const payload = await response.json() as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = payload.content?.find((block) => block.type === "text")?.text;
  if (!text) throw new ClaudeVisionError("Claude devolvió una respuesta vacía.", 502, "CLAUDE_EMPTY_RESPONSE");

  let parsed: unknown;
  try {
    const cleaned = text.trim().replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/i, "");
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ClaudeVisionError("Claude devolvió un resultado que no es JSON válido.", 502, "CLAUDE_INVALID_JSON");
  }
  const validated = visionResultSchema.safeParse(parsed);
  if (!validated.success) {
    throw new ClaudeVisionError("La respuesta de Claude no cumple el formato esperado.", 502, "CLAUDE_INVALID_OUTPUT");
  }

  return {
    result: validated.data,
    model,
    inputTokens: payload.usage?.input_tokens ?? 0,
    outputTokens: payload.usage?.output_tokens ?? 0,
  };
}
