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
