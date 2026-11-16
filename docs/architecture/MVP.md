# MVP Architecture — Vehicle Inspection Comparison with Claude Vision

## Goal

Deliver one screen where an operator selects multiple vehicle photographs for a previous inspection and a current inspection. Store originals in private Supabase Storage, compare matching vehicle zones with Claude Vision, and display structured potential changes.

## High-level flow

1. User selects baseline and current inspections (or creates the two inspection records for the prototype).
2. User selects multiple images for each inspection and assigns a predefined vehicle zone.
3. Frontend validates supported image formats and configurable file-size/count limits.
4. Original images are uploaded to a private Supabase Storage bucket.
5. Image metadata and Storage object paths are saved in PostgreSQL.
6. User starts comparison.
7. Frontend calls a protected Supabase Edge Function using application IDs only.
8. Edge Function validates user access and pairs images by the same zone.
9. Edge Function obtains short-lived access to the private images and calls Anthropic Claude Messages API.
10. Function validates the response against the application schema, persists results, and returns status/findings.
11. Frontend displays findings and marks uncertain comparisons as inconclusive.

## Image pairing

- Compare baseline and current images only when they refer to the same vehicle and same zone.
- For the first iteration, support one image per zone per inspection to keep pairing deterministic.
- If one side is missing a matching zone, do not ask Claude to infer a comparison; mark that zone as `INCONCLUSIVE` or omit it with an explicit reason.
- Similar camera angle, distance, framing, and lighting improve reliability.
- Do not compare images of different vehicle zones.
- Do not claim exact image registration or pixel-level localization.

## Supabase responsibilities

### Storage

- Private bucket: `vehicle-inspection-photos`.
- Upload original image files; do not store base64 in PostgreSQL.
- Object paths must be unique and scoped to inspection IDs.
- Do not use public object URLs.
- Browser uploads only through authenticated Supabase client and approved policies.

### Database

Store:
- vehicle and inspection records
- image metadata and object paths
- comparison records and processing status
- normalized findings returned by Claude

Suggested statuses:
- Processing: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- Result: `NEW_DAMAGE`, `NO_CHANGE`, `INCONCLUSIVE`

Use RLS and Storage policies aligned with the confirmed authentication/tenant model.

## Claude Vision integration

- Use Anthropic Messages API with vision-capable Claude model.
- Call it only from a Supabase Edge Function.
- Store `ANTHROPIC_API_KEY` in Supabase Edge Function secrets; configure the model through `CLAUDE_MODEL`.
- The frontend sends IDs, not arbitrary URLs or raw Anthropic credentials.
- Function verifies that both images belong to the authorized vehicle/inspections and matching zone.
- Function generates short-lived signed URLs or fetches the private objects server-side for base64 encoding.
- Label image roles explicitly: **Image A = previous/baseline**, **Image B = current**.
- Prompt Claude to report only visible changes that may be new damage, ignore lighting/reflections/shadows/camera differences, and return `INCONCLUSIVE` if comparison is unreliable.
- Parse and validate structured JSON before persistence. Never trust unvalidated model output.
- Record model identifier and prompt version for reproducibility; avoid storing unnecessary raw image data or sensitive provider payloads.

### Expected analysis contract

Overall result:
- `NEW_DAMAGE`
- `NO_CHANGE`
- `INCONCLUSIVE`

Finding:
- `type`
- `zone`
- `location_description`
- `description`
- `severity`: `LOW` | `MEDIUM` | `HIGH` | `UNKNOWN`
- `confidence`: number from 0 to 1 (model estimate, not calibrated)
- `requires_human_review`: boolean (true by default)

Do not include bounding boxes in the first MVP unless a separate validation task establishes their reliability. Do not produce an automatic insurance/repair decision.

## Error handling and execution model

- Start with synchronous Edge Function execution for a small number of photo pairs.
- Limit number and size of images per request to stay within provider and Edge Function limits.
- Persist `PROCESSING` before inference and set `COMPLETED` or `FAILED` after validated processing.
- Handle provider timeout, rate limit, invalid response, missing image, and storage errors.
- Do not blindly retry paid inference requests; use idempotency and clear retry behavior.
- Keep the analysis service modular so a queue/worker can be added later if real usage requires it.

## Security

- Private Storage bucket and RLS.
- Validate user access to both inspections and every image in the Edge Function.
- Never expose service-role/secret keys or Anthropic key in browser code.
- Never accept client-supplied arbitrary external URLs.
- Generate short-lived signed URLs server-side only.
- Enforce upload MIME type, size, count, and zone rules.
- Do not log secrets, signed URLs, or image contents.

## Explicitly out of scope

- AWS.
- OpenCV, Sharp, image enhancement, image registration, or destructive image transforms.
- Background queues and distributed workers.
- PDF reports, partner webhooks, multi-tenant API-key products, and production billing.
- Automatic repair estimates, insurance decisions, or vehicle safety certification.

## Open decisions

1. Authentication and tenant ownership model.
2. Maximum number of images and maximum file size.
3. Confirm one image per zone per inspection for deterministic MVP pairing.
4. Select Claude model and cost ceiling.
5. Define a small labeled test set and human-review procedure.
