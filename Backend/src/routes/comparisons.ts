import type { FastifyInstance } from "fastify";
import { getEnv } from "../config/env.js";
import { getSupabaseClient } from "../infrastructure/supabase/client.js";
import { compareZoneImagesWithGemini } from "../services/gemini-vision.js";
import {
  ClaudeVisionError,
  MAX_AI_IMAGE_BYTES,
  PROMPT_VERSION,
  compareZoneImages,
  type VisionImage,
} from "../services/claude-vision.js";

const BUCKET = "vehicle-inspection-photos";
const MAX_ZONE_PAIRS = 5;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

type InspectionRow = {
  id: string;
  vehicle_id: string;
  inspection_type: string;
  owner_id: string | null;
};

type ImageRow = {
  id: string;
  inspection_id: string;
  zone: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function aggregate(results: Array<{ result: string }>): "NEW_DAMAGE" | "NO_CHANGE" | "INCONCLUSIVE" {
  if (results.some((item) => item.result === "NEW_DAMAGE")) return "NEW_DAMAGE";
  if (results.every((item) => item.result === "NO_CHANGE")) return "NO_CHANGE";
  return "INCONCLUSIVE";
}

export async function registerComparisonRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/comparisons", async (request, reply) => {
    const body: unknown = request.body;
    if (!isRecord(body) ||
        typeof body.baselineInspectionId !== "string" ||
        typeof body.currentInspectionId !== "string" ||
        body.baselineInspectionId === body.currentInspectionId) {
      return reply.code(400).send({
        error: "INVALID_COMPARISON_REQUEST",
        message: "Debe proporcionar los identificadores de la inspección anterior y actual.",
      });
    }

    const env = getEnv();
    const providerKey = env.AI_PROVIDER === "gemini" ? env.GEMINI_API_KEY : env.ANTHROPIC_API_KEY;
    if (!providerKey) {
      return reply.code(503).send({
        error: "AI_NOT_CONFIGURED",
        message: env.AI_PROVIDER === "gemini"
          ? "Configure GEMINI_API_KEY en Backend/.env y reinicie el backend."
          : "Configure ANTHROPIC_API_KEY en Backend/.env y reinicie el backend.",
      });
    }

    const supabase = getSupabaseClient();
    const baselineId = body.baselineInspectionId;
    const currentId = body.currentInspectionId;

    const { data: inspections, error: inspectionsError } = await supabase
      .from("inspections")
      .select("id, vehicle_id, inspection_type, owner_id")
      .in("id", [baselineId, currentId]);

    if (inspectionsError) {
      request.log.error({ err: inspectionsError }, "Could not load inspections for comparison");
      return reply.code(500).send({ error: "INSPECTION_LOOKUP_FAILED", message: "No fue posible consultar las inspecciones." });
    }

    const rows = (inspections ?? []) as InspectionRow[];
    const baseline = rows.find((row) => row.id === baselineId);
    const current = rows.find((row) => row.id === currentId);
    if (!baseline || !current ||
        baseline.inspection_type !== "BASELINE" ||
        current.inspection_type !== "CURRENT" ||
        baseline.vehicle_id !== current.vehicle_id ||
        baseline.owner_id !== current.owner_id) {
      return reply.code(400).send({
        error: "INVALID_INSPECTION_PAIR",
        message: "Las inspecciones no pertenecen al mismo vehículo o no son del tipo anterior/actual esperado.",
      });
    }

    const { data: imageRows, error: imagesError } = await supabase
      .from("inspection_images")
      .select("id, inspection_id, zone, storage_bucket, storage_path, mime_type, size_bytes")
      .in("inspection_id", [baselineId, currentId]);

    if (imagesError) {
      request.log.error({ err: imagesError }, "Could not load inspection images");
      return reply.code(500).send({ error: "IMAGE_LOOKUP_FAILED", message: "No fue posible consultar las fotografías." });
    }

    const images = (imageRows ?? []) as ImageRow[];
    const before = new Map(images.filter((image) => image.inspection_id === baselineId).map((image) => [image.zone, image]));
    const after = new Map(images.filter((image) => image.inspection_id === currentId).map((image) => [image.zone, image]));
    const zones = [...before.keys()].filter((zone) => after.has(zone)).sort();

    if (zones.length === 0) {
      return reply.code(400).send({ error: "NO_MATCHING_ZONES", message: "No existen fotografías de la misma zona en ambas inspecciones." });
    }
    if (zones.length > MAX_ZONE_PAIRS) {
      return reply.code(413).send({
        error: "TOO_MANY_ZONE_PAIRS",
        message: `El prototipo permite analizar hasta ${MAX_ZONE_PAIRS} zonas por comparación para controlar el costo. Actualmente hay ${zones.length} zonas coincidentes.`,
      });
    }

    const { data: comparison, error: createError } = await supabase
      .from("comparisons")
      .insert({
        owner_id: baseline.owner_id,
        baseline_inspection_id: baselineId,
        current_inspection_id: currentId,
        status: "PENDING",
        started_at: new Date().toISOString(),
        model: env.AI_PROVIDER === "gemini"
          ? env.GEMINI_MODEL
          : (env.CLAUDE_MODEL || "claude-sonnet-5-5"),
        prompt_version: PROMPT_VERSION,
      })
      .select("id")
      .single();

    if (createError) {
      if (createError.code === "23505") {
        const { data: existing } = await supabase
          .from("comparisons")
          .select("id, status, overall_result, summary, created_at")
          .eq("baseline_inspection_id", baselineId)
          .eq("current_inspection_id", currentId)
          .maybeSingle();
        return reply.code(409).send({
          error: "COMPARISON_ALREADY_EXISTS",
          message: "Este par de inspecciones ya fue procesado o tiene un análisis pendiente. No se repetirá una inferencia pagada automáticamente.",
          comparison: existing,
        });
      }
      request.log.error({ err: createError }, "Could not create comparison record");
      return reply.code(500).send({ error: "COMPARISON_CREATE_FAILED", message: "No fue posible iniciar la comparación." });
    }

    const comparisonId = comparison.id;
    const zoneResults: Array<{ zone: string; result: string; summary: string }> = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let model = env.AI_PROVIDER === "gemini"
      ? env.GEMINI_MODEL
      : (env.CLAUDE_MODEL || "claude-sonnet-5-5");

    try {
      for (const zone of zones) {
        const pair = [before.get(zone)!, after.get(zone)!];
        const downloaded: VisionImage[] = [];

        for (const image of pair) {
          if (image.storage_bucket !== BUCKET ||
              !image.storage_path.startsWith(`prototype/${baseline.vehicle_id}/`) ||
              !ALLOWED_MIME.has(image.mime_type) ||
              Number(image.size_bytes) <= 0 ||
              Number(image.size_bytes) > MAX_AI_IMAGE_BYTES) {
            throw new ClaudeVisionError("Una fotografía tiene una ruta, formato o tamaño no permitido para IA.", 400, "INVALID_STORED_IMAGE");
          }
          const { data, error } = await supabase.storage.from(BUCKET).download(image.storage_path);
          if (error || !data) {
            throw new ClaudeVisionError("No fue posible recuperar una fotografía privada desde Supabase Storage.", 502, "IMAGE_DOWNLOAD_FAILED");
          }
          const buffer = Buffer.from(await data.arrayBuffer());
          if (buffer.byteLength === 0 || buffer.byteLength > MAX_AI_IMAGE_BYTES) {
            throw new ClaudeVisionError("Una fotografía supera el límite de 7 MB para el análisis de IA.", 413, "AI_IMAGE_SIZE_LIMIT");
          }
          downloaded.push({
            buffer,
            mimeType: image.mime_type as VisionImage["mimeType"],
          });
        }

        const vision = env.AI_PROVIDER === "gemini"
          ? await compareZoneImagesWithGemini(zone, downloaded[0]!, downloaded[1]!, env)
          : await compareZoneImages(zone, downloaded[0]!, downloaded[1]!, env);
        model = vision.model;
        totalInputTokens += vision.inputTokens;
        totalOutputTokens += vision.outputTokens;

        const { error: zoneError } = await supabase
          .from("comparison_zone_results")
          .insert({
            comparison_id: comparisonId,
            zone,
            result: vision.result.result,
            summary: vision.result.summary,
          });
        if (zoneError) throw new ClaudeVisionError("No fue posible guardar el resultado de una zona.", 500, "ZONE_RESULT_PERSISTENCE_FAILED");

        if (vision.result.findings.length > 0) {
          const findingRows = vision.result.findings.map((finding) => ({
            owner_id: baseline.owner_id,
            comparison_id: comparisonId,
            zone,
            finding_type: finding.type,
            location_description: finding.locationDescription,
            description: finding.description,
            severity: finding.severity,
            confidence: finding.confidence,
            requires_human_review: true,
          }));
          const { error: findingsError } = await supabase.from("comparison_findings").insert(findingRows);
          if (findingsError) throw new ClaudeVisionError("No fue posible guardar los hallazgos detectados.", 500, "FINDINGS_PERSISTENCE_FAILED");
        }

        zoneResults.push({ zone, result: vision.result.result, summary: vision.result.summary });
      }

      const overallResult = aggregate(zoneResults);
      const summary = zoneResults.map((item) => `${item.zone}: ${item.summary}`).join("\n");
      const { error: completeError } = await supabase
        .from("comparisons")
        .update({
          status: "COMPLETED",
          overall_result: overallResult,
          summary,
          model,
          prompt_version: PROMPT_VERSION,
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          completed_at: new Date().toISOString(),
          error_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", comparisonId);
      if (completeError) throw new ClaudeVisionError("No fue posible finalizar el registro de comparación.", 500, "COMPARISON_PERSISTENCE_FAILED");

      const { data: findings } = await supabase
        .from("comparison_findings")
        .select("id, zone, finding_type, location_description, description, severity, confidence, requires_human_review")
        .eq("comparison_id", comparisonId);

      return reply.code(201).send({
        comparisonId,
        status: "COMPLETED",
        result: overallResult,
        summary,
        model,
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
        zones: zoneResults,
        findings: findings ?? [],
        requiresHumanReview: true,
      });
    } catch (error) {
      const providerError = error instanceof ClaudeVisionError
        ? error
        : new ClaudeVisionError("Ocurrió un error al procesar la comparación.", 502, "COMPARISON_FAILED");
      await supabase
        .from("comparisons")
        .update({
          status: "FAILED",
          error_code: providerError.code,
          model,
          prompt_version: PROMPT_VERSION,
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          updated_at: new Date().toISOString(),
        })
        .eq("id", comparisonId);
      request.log.error({ code: providerError.code, comparisonId }, "AI Vision comparison failed");
      return reply.code(providerError.statusCode).send({
        error: providerError.code,
        message: providerError.message,
        comparisonId,
        partialZones: zoneResults,
        retryAutomatically: false,
      });
    }
  });
}
