import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { getSupabaseClient } from "../infrastructure/supabase/client.js";

const BUCKET = "vehicle-inspection-photos";
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_ZONES = new Set([
  "front", "rear", "left_side", "right_side",
  "front_left_corner", "front_right_corner",
  "rear_left_corner", "rear_right_corner",
  "interior", "dashboard", "detail",
]);

type PhotoInput = { zone: string; fileField: string };
type InspectionInput = { inspectedAt?: string; photos: PhotoInput[] };
type SavePayload = {
  vehicle: {
    make?: string;
    model?: string;
    modelYear?: number | null;
    licensePlate?: string;
    vin?: string;
  };
  baseline: InspectionInput;
  current: InspectionInput;
};

type UploadedFile = {
  buffer: Buffer;
  filename: string;
  mimetype: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePayload(value: unknown): SavePayload {
  if (!isRecord(value) || !isRecord(value.vehicle) ||
      !isRecord(value.baseline) || !isRecord(value.current)) {
    throw new Error("El formulario no contiene los datos requeridos.");
  }

  const vehicle = value.vehicle;
  const normalizeInspection = (raw: Record<string, unknown>): InspectionInput => {
    if (!Array.isArray(raw.photos) || raw.photos.length === 0) {
      throw new Error("Cada inspección debe incluir al menos una fotografía.");
    }
    const photos = raw.photos.map((photo) => {
      if (!isRecord(photo) || typeof photo.zone !== "string" ||
          typeof photo.fileField !== "string" || !ALLOWED_ZONES.has(photo.zone)) {
        throw new Error("Una fotografía tiene una zona o referencia de archivo inválida.");
      }
      return { zone: photo.zone, fileField: photo.fileField };
    });
    if (new Set(photos.map((photo) => photo.zone)).size !== photos.length) {
      throw new Error("Solo se permite una fotografía por zona en cada inspección.");
    }
    return {
      inspectedAt: typeof raw.inspectedAt === "string" ? raw.inspectedAt : undefined,
      photos,
    };
  };

  const baseline = normalizeInspection(value.baseline);
  const current = normalizeInspection(value.current);
  const currentZones = new Set(current.photos.map((photo) => photo.zone));
  if (!baseline.photos.some((photo) => currentZones.has(photo.zone))) {
    throw new Error("Debe existir al menos una zona con fotografía en ambas inspecciones.");
  }

  const modelYear = vehicle.modelYear;
  if (modelYear !== undefined && modelYear !== null &&
      (typeof modelYear !== "number" || !Number.isInteger(modelYear) || modelYear < 1886 || modelYear > 2100)) {
    throw new Error("El año del vehículo no es válido.");
  }

  return {
    vehicle: {
      make: typeof vehicle.make === "string" ? vehicle.make.trim() : "",
      model: typeof vehicle.model === "string" ? vehicle.model.trim() : "",
      modelYear: typeof modelYear === "number" ? modelYear : null,
      licensePlate: typeof vehicle.licensePlate === "string" ? vehicle.licensePlate.trim() : "",
      vin: typeof vehicle.vin === "string" ? vehicle.vin.trim() : "",
    },
    baseline,
    current,
  };
}

function extensionFor(mimetype: string): string {
  if (mimetype === "image/jpeg") return "jpg";
  if (mimetype === "image/png") return "png";
  return "webp";
}

export async function registerInspectionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/inspections/:inspectionId", async (request, reply) => {
    const { inspectionId } = request.params as { inspectionId: string };
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(inspectionId)) {
      return reply.code(400).send({ error: "INVALID_INSPECTION_ID", message: "Enter a valid inspection ID." });
    }
    const supabase = getSupabaseClient();
    const { data: selected, error: selectedError } = await supabase
      .from("inspections")
      .select("id, vehicle_id, inspection_type, inspected_at, status, owner_id")
      .eq("id", inspectionId)
      .maybeSingle();
    if (selectedError) {
      request.log.error({ err: selectedError }, "Could not load saved inspection");
      return reply.code(500).send({ error: "INSPECTION_LOOKUP_FAILED", message: "Unable to retrieve the saved inspection." });
    }
    if (!selected) return reply.code(404).send({ error: "INSPECTION_NOT_FOUND", message: "No inspection was found with that ID." });

    const { data: comparison, error: comparisonError } = await supabase
      .from("comparisons")
      .select("id, baseline_inspection_id, current_inspection_id, status, overall_result, summary, model, prompt_version, input_tokens, output_tokens, created_at, completed_at")
      .or(`baseline_inspection_id.eq.${inspectionId},current_inspection_id.eq.${inspectionId}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (comparisonError) {
      request.log.error({ err: comparisonError }, "Could not load saved AI comparison");
      return reply.code(500).send({ error: "COMPARISON_LOOKUP_FAILED", message: "Unable to retrieve the saved AI result." });
    }

    const ids = comparison
      ? [comparison.baseline_inspection_id, comparison.current_inspection_id]
      : [selected.id];
    const [{ data: inspections, error: pairError }, { data: imageRows, error: imagesError }] = await Promise.all([
      supabase.from("inspections").select("id, vehicle_id, inspection_type, inspected_at, status").in("id", ids),
      supabase.from("inspection_images").select("id, inspection_id, zone, storage_bucket, storage_path, original_filename, mime_type, size_bytes").in("inspection_id", ids).order("created_at"),
    ]);
    if (pairError || imagesError) {
      request.log.error({ err: pairError ?? imagesError }, "Could not load inspection pair");
      return reply.code(500).send({ error: "INSPECTION_DETAILS_FAILED", message: "Unable to retrieve the inspection details." });
    }
    const pairRows = inspections ?? [];
    const baselineRow = pairRows.find((item) => item.inspection_type === "BASELINE") ?? (selected.inspection_type === "BASELINE" ? selected : null);
    const currentRow = pairRows.find((item) => item.inspection_type === "CURRENT") ?? null;
    const vehicleId = selected.vehicle_id;
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles").select("id, make, model, model_year, license_plate, vin").eq("id", vehicleId).single();
    if (vehicleError || !vehicle) {
      request.log.error({ err: vehicleError }, "Could not load saved vehicle");
      return reply.code(500).send({ error: "VEHICLE_LOOKUP_FAILED", message: "Unable to retrieve the vehicle details." });
    }

    const photos: Record<string, Array<Record<string, unknown>>> = { baseline: [], current: [] };
    for (const image of imageRows ?? []) {
      if (image.storage_bucket !== BUCKET || !image.storage_path.startsWith(`prototype/${vehicleId}/`)) {
        return reply.code(500).send({ error: "INVALID_STORED_IMAGE", message: "An inspection image has an invalid storage reference." });
      }
      const { data: signed, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(image.storage_path, 3600);
      if (signedError || !signed?.signedUrl) {
        request.log.error({ err: signedError }, "Could not create inspection image URL");
        return reply.code(502).send({ error: "IMAGE_ACCESS_FAILED", message: "Unable to access one of the saved inspection photos." });
      }
      const side = image.inspection_id === baselineRow?.id ? "baseline" : "current";
      photos[side]!.push({
        id: image.id, zone: image.zone, filename: image.original_filename,
        mimeType: image.mime_type, sizeBytes: Number(image.size_bytes), url: signed.signedUrl,
      });
    }

    let aiResult = null;
    if (comparison) {
      const [{ data: zones, error: zonesError }, { data: findings, error: findingsError }] = await Promise.all([
        supabase.from("comparison_zone_results").select("zone, result, summary").eq("comparison_id", comparison.id).order("zone"),
        supabase.from("comparison_findings").select("id, zone, finding_type, location_description, description, severity, confidence, requires_human_review").eq("comparison_id", comparison.id),
      ]);
      if (zonesError || findingsError) {
        request.log.error({ err: zonesError ?? findingsError }, "Could not load saved AI findings");
        return reply.code(500).send({ error: "AI_RESULT_LOOKUP_FAILED", message: "Unable to retrieve the saved AI findings." });
      }
      aiResult = {
        comparisonId: comparison.id,
        status: comparison.status,
        result: comparison.overall_result,
        summary: comparison.summary ?? "",
        model: comparison.model ?? "",
        usage: { inputTokens: comparison.input_tokens ?? 0, outputTokens: comparison.output_tokens ?? 0 },
        zones: zones ?? [],
        findings: findings ?? [],
        requiresHumanReview: true,
        createdAt: comparison.created_at,
        completedAt: comparison.completed_at,
      };
    }
    return reply.send({
      selectedInspectionId: selected.id,
      vehicle: { id: vehicle.id, make: vehicle.make ?? "", model: vehicle.model ?? "", modelYear: vehicle.model_year, licensePlate: vehicle.license_plate ?? "", vin: vehicle.vin ?? "" },
      inspections: {
        baseline: baselineRow ? { id: baselineRow.id, type: baselineRow.inspection_type, inspectedAt: baselineRow.inspected_at, status: baselineRow.status } : null,
        current: currentRow ? { id: currentRow.id, type: currentRow.inspection_type, inspectedAt: currentRow.inspected_at, status: currentRow.status } : null,
      },
      photos,
      comparison: aiResult,
    });
  });

  app.post("/api/inspections/:baselineInspectionId/current", async (request, reply) => {
    const { baselineInspectionId } = request.params as { baselineInspectionId: string };
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(baselineInspectionId)) {
      return reply.code(400).send({ error: "INVALID_INSPECTION_ID", message: "Enter a valid inspection ID." });
    }
    const supabase = getSupabaseClient();
    const files = new Map<string, UploadedFile>();
    let rawPayload: unknown;
    try {
      const parts = request.parts({ limits: { files: 11, fields: 1, parts: 12, fileSize: MAX_FILE_BYTES } });
      for await (const part of parts) {
        if (part.type === "file") {
          if (!ALLOWED_MIME.has(part.mimetype)) return reply.code(415).send({ error: "UNSUPPORTED_MEDIA_TYPE", message: "Only JPG, PNG, or WEBP images are allowed." });
          const buffer = await part.toBuffer();
          if (part.file.truncated || buffer.byteLength > MAX_FILE_BYTES) return reply.code(413).send({ error: "FILE_TOO_LARGE", message: "Each image must be no larger than 12 MB." });
          files.set(part.fieldname, { buffer, filename: part.filename, mimetype: part.mimetype });
        } else if (part.fieldname === "payload") {
          try { rawPayload = JSON.parse(String(part.value)); }
          catch { return reply.code(400).send({ error: "INVALID_PAYLOAD", message: "The submitted data is not valid JSON." }); }
        }
      }
      if (!isRecord(rawPayload) || !isRecord(rawPayload.current) || !Array.isArray(rawPayload.current.photos) || rawPayload.current.photos.length === 0) {
        return reply.code(400).send({ error: "INVALID_CURRENT_INSPECTION", message: "Add at least one photo to the new inspection." });
      }
      const photos = rawPayload.current.photos.map((photo) => {
        if (!isRecord(photo) || typeof photo.zone !== "string" || typeof photo.fileField !== "string" || !ALLOWED_ZONES.has(photo.zone) || !files.has(photo.fileField)) {
          throw new Error("A photo has an invalid zone or missing file.");
        }
        return { zone: photo.zone, fileField: photo.fileField };
      });
      if (new Set(photos.map((photo) => photo.zone)).size !== photos.length) throw new Error("Only one photo per vehicle area is allowed.");
      const { data: baseline, error: baselineError } = await supabase
        .from("inspections").select("id, vehicle_id, owner_id, inspection_type").eq("id", baselineInspectionId).maybeSingle();
      if (baselineError) throw baselineError;
      if (!baseline) return reply.code(404).send({ error: "INSPECTION_NOT_FOUND", message: "The selected baseline inspection was not found." });
      if (baseline.inspection_type !== "BASELINE") return reply.code(400).send({ error: "INVALID_BASELINE_TYPE", message: "Only a BASELINE inspection can be reused as a reference." });
      const { data: baselineImages, error: baselineImagesError } = await supabase
        .from("inspection_images").select("zone").eq("inspection_id", baselineInspectionId);
      if (baselineImagesError) throw baselineImagesError;
      const baselineZones = new Set((baselineImages ?? []).map((image) => image.zone));
      if (!photos.some((photo) => baselineZones.has(photo.zone))) {
        return reply.code(400).send({ error: "NO_MATCHING_ZONES", message: "At least one new photo must match an area in the saved inspection." });
      }
      const { data: current, error: currentError } = await supabase.from("inspections").insert({
        owner_id: baseline.owner_id,
        vehicle_id: baseline.vehicle_id,
        inspection_type: "CURRENT",
        inspected_at: new Date().toISOString(),
        status: "COMPLETED",
      }).select("id").single();
      if (currentError) throw currentError;
      const uploadedPaths: string[] = [];
      try {
        const rows = [];
        for (const photo of photos) {
          const file = files.get(photo.fileField)!;
          const path = `prototype/${baseline.vehicle_id}/${current.id}/${photo.zone}-${randomUUID()}.${extensionFor(file.mimetype)}`;
          const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
          if (error) throw error;
          uploadedPaths.push(path);
          rows.push({ owner_id: baseline.owner_id, inspection_id: current.id, zone: photo.zone, storage_bucket: BUCKET, storage_path: path, original_filename: file.filename.slice(0, 255), mime_type: file.mimetype, size_bytes: file.buffer.byteLength });
        }
        const { data: images, error: imageError } = await supabase.from("inspection_images").insert(rows)
          .select("id, inspection_id, zone, original_filename, mime_type, size_bytes, created_at");
        if (imageError) throw imageError;
        return reply.code(201).send({
          status: "saved",
          vehicleId: baseline.vehicle_id,
          inspections: { baseline: baselineInspectionId, current: current.id },
          images,
          message: "New inspection saved. The original baseline was left unchanged.",
        });
      } catch (error) {
        if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths);
        await supabase.from("inspections").delete().eq("id", current.id);
        throw error;
      }
    } catch (error) {
      request.log.error({ err: error }, "Failed to create a new inspection from saved baseline");
      return reply.code(400).send({ error: "CURRENT_INSPECTION_FAILED", message: error instanceof Error ? error.message : "Unable to save the new inspection." });
    }
  });

  app.post("/api/inspections", async (request, reply) => {
    const supabase = getSupabaseClient();
    const files = new Map<string, UploadedFile>();
    let rawPayload: unknown;

    try {
      const parts = request.parts({ limits: { files: 22, fields: 2, parts: 24, fileSize: MAX_FILE_BYTES } });
      for await (const part of parts) {
        if (part.type === "file") {
          if (!ALLOWED_MIME.has(part.mimetype)) {
            return reply.code(415).send({ error: "UNSUPPORTED_MEDIA_TYPE", message: "Solo se permiten JPG, PNG o WEBP." });
          }
          const buffer = await part.toBuffer();
          if (part.file.truncated || buffer.byteLength > MAX_FILE_BYTES) {
            return reply.code(413).send({ error: "FILE_TOO_LARGE", message: "Cada imagen debe pesar máximo 12 MB." });
          }
          files.set(part.fieldname, { buffer, filename: part.filename, mimetype: part.mimetype });
        } else if (part.fieldname === "payload") {
          try {
            rawPayload = JSON.parse(String(part.value));
          } catch {
            return reply.code(400).send({ error: "INVALID_PAYLOAD", message: "Los datos del formulario no tienen un formato válido." });
          }
        }
      }

      const payload = validatePayload(rawPayload);
      const allPhotos = [
        ...payload.baseline.photos.map((photo) => ({ ...photo, side: "baseline" as const })),
        ...payload.current.photos.map((photo) => ({ ...photo, side: "current" as const })),
      ];
      for (const photo of allPhotos) {
        if (!files.has(photo.fileField)) {
          return reply.code(400).send({ error: "MISSING_FILE", message: "No se recibió uno de los archivos seleccionados." });
        }
      }

      const uploadedPaths: string[] = [];
      let vehicleId: string | undefined;
      try {
        const { data: vehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .insert({
            owner_id: null,
            make: payload.vehicle.make || null,
            model: payload.vehicle.model || null,
            model_year: payload.vehicle.modelYear,
            license_plate: payload.vehicle.licensePlate || null,
            vin: payload.vehicle.vin || null,
          })
          .select("id")
          .single();
        if (vehicleError) throw vehicleError;
        vehicleId = vehicle.id;

        const inspections: Record<"baseline" | "current", string> = {
          baseline: "",
          current: "",
        };
        for (const side of ["baseline", "current"] as const) {
          const input = payload[side];
          const { data, error } = await supabase
            .from("inspections")
            .insert({
              owner_id: null,
              vehicle_id: vehicleId,
              inspection_type: side === "baseline" ? "BASELINE" : "CURRENT",
              inspected_at: input.inspectedAt || new Date().toISOString(),
              status: "COMPLETED",
            })
            .select("id")
            .single();
          if (error) throw error;
          inspections[side] = data.id;
        }

        const imageRows = [];
        for (const photo of allPhotos) {
          const file = files.get(photo.fileField)!;
          const inspectionId = inspections[photo.side];
          const path = `prototype/${vehicleId}/${inspectionId}/${photo.zone}-${randomUUID()}.${extensionFor(file.mimetype)}`;
          const { error: storageError } = await supabase.storage
            .from(BUCKET)
            .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
          if (storageError) throw storageError;
          uploadedPaths.push(path);
          imageRows.push({
            owner_id: null,
            inspection_id: inspectionId,
            zone: photo.zone,
            storage_bucket: BUCKET,
            storage_path: path,
            original_filename: file.filename.slice(0, 255),
            mime_type: file.mimetype,
            size_bytes: file.buffer.byteLength,
          });
        }

        const { data: images, error: imagesError } = await supabase
          .from("inspection_images")
          .insert(imageRows)
          .select("id, inspection_id, zone, original_filename, mime_type, size_bytes, created_at");
        if (imagesError) throw imagesError;

        return reply.code(201).send({
          status: "saved",
          vehicleId,
          inspections,
          images,
          message: "Datos del vehículo e imágenes guardados correctamente.",
        });
      } catch (error) {
        if (uploadedPaths.length) {
          await supabase.storage.from(BUCKET).remove(uploadedPaths);
        }
        if (vehicleId) {
          await supabase.from("vehicles").delete().eq("id", vehicleId);
        }
        request.log.error({ err: error }, "Failed to persist inspection submission");
        return reply.code(502).send({
          error: "PERSISTENCE_FAILED",
          message: "No fue posible guardar la inspección. Verifique la configuración de Supabase e inténtelo nuevamente.",
        });
      }
    } catch (error) {
      request.log.warn({ err: error }, "Invalid inspection submission");
      return reply.code(400).send({
        error: "INVALID_INSPECTION",
        message: error instanceof Error ? error.message : "Los datos enviados no son válidos.",
      });
    }
  });
}
