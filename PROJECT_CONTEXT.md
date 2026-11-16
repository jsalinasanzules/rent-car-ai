# Project Context

## Product goal

Build a vehicle inspection prototype that compares photographs of the same vehicle across two inspections and identifies visible new damage or other changes.

## Current MVP experience

Build one focused screen with two clearly separated inspection sets:
- **Previous inspection (baseline):** the reference photographs.
- **Current inspection:** the photographs taken during the new inspection.

For each set, the operator can select multiple photographs and assign each to a predefined vehicle zone. The application matches photos by zone and compares each available baseline/current pair.

Initial shot catalogue:
- Front
- Rear
- Left side
- Right side
- Front-left corner
- Front-right corner
- Rear-left corner
- Rear-right corner
- Interior
- Dashboard / odometer
- Other detail

A zone is comparable only when both inspections have a photo assigned to the same zone. Do not compare unrelated zones. The user may leave zones empty. Multiple images per same zone are not required for the first iteration; if multiple are selected, either allow them only after defining a deterministic pairing rule or ask before implementing that behavior.

## Expected comparison result

Each comparison returns one overall status:
- `NEW_DAMAGE`: one or more potential new visible damages are detected.
- `NO_CHANGE`: no relevant visible difference is detected.
- `INCONCLUSIVE`: photos are missing, mismatched, poor quality, or cannot be reliably compared.

Each finding should include:
- damage type (e.g. scratch, dent, crack, broken/missing part, paint damage, other)
- vehicle zone
- plain-language location description
- short description of the visible change
- severity (`LOW`, `MEDIUM`, `HIGH`, or `UNKNOWN`)
- confidence estimate between 0 and 1
- `requires_human_review` (true by default)

Confidence is model-estimated and must not be presented as a statistically calibrated probability. Results are decision support only and must be reviewed by a person. Do not infer damage hidden from view.

## Architecture decisions

- Database: Supabase PostgreSQL.
- Image storage: Supabase Storage, private bucket (suggested name: `vehicle-inspection-photos`).
- Server-side integration: Supabase Edge Function(s).
- Vision provider: Anthropic Claude Messages API (Claude Vision).
- The Anthropic API key is stored as an Edge Function secret named `ANTHROPIC_API_KEY`.
- Claude model is configured through an environment variable (e.g. `CLAUDE_MODEL`) and not hard-coded across the application.
- Browser uploads original files to Supabase Storage using the authenticated Supabase client, subject to approved RLS/Storage policies.
- Browser calls an Edge Function with inspection/image IDs; it never calls Anthropic directly.
- Edge Function verifies ownership, retrieves/creates short-lived access to private images, invokes Claude, validates structured output, and stores the result.
- No AWS services.
- No OpenCV, Sharp processing, or other image transformations initially.
- No queue for the first synchronous prototype. Keep the analysis boundary modular so a queue can be introduced if latency, retries, or volume require it.
- Store image metadata and Storage object paths in PostgreSQL; never store image binaries in database rows.

## Initial comparison workflow

1. User selects baseline and current photos for corresponding vehicle zones.
2. Files are uploaded unchanged to the private Supabase Storage bucket.
3. Metadata records link each image to its inspection and zone.
4. User starts comparison.
5. Frontend calls a protected Supabase Edge Function with the comparison/inspection ID (not external URLs).
6. Function validates access and matching zones, obtains temporary access to the private objects, and sends each matching image pair to Claude Vision.
7. Function parses and validates the response, persists findings and processing status, and returns a comparison ID/result.
8. Frontend displays findings and highlights inconclusive pairs for manual review.

Claude's Vision API supports multiple images in one Messages API request and image sources such as base64 or URL. For this prototype, prefer short-lived signed URLs generated server-side or base64 fetched server-side; never make the bucket public.

## Data model direction

Minimum entities:
- `vehicles`: vehicle identity and VIN (when available).
- `inspections`: vehicle, inspection date/type, owner/tenant, status.
- `inspection_images`: inspection, zone, bucket/object path, original filename, MIME type, size, dimensions, timestamp.
- `comparisons`: baseline inspection, current inspection, processing status, overall result, timestamps.
- `comparison_findings`: comparison, zone, finding type, description, severity, confidence estimate, human-review flag, raw/normalized provider metadata where justified.

Use UUIDs, foreign keys, indexes, RLS, and Storage policies consistent with the confirmed authentication/tenant model. Do not invent permissive policies.

## Open decisions / constraints

- Inspect the actual repository and choose the smallest suitable frontend/backend structure; do not assume a framework.
- Authentication and tenant ownership are not yet specified. Confirm before enabling real-user access policies.
- Confirm maximum photo count, maximum file size, and whether the same zone may contain multiple photos.
- Choose a Claude model based on current availability and cost; configure it rather than hard-coding.
- Establish a small labeled test set of before/after photo pairs before treating results as reliable.
- The prototype must show `INCONCLUSIVE` when image angle, zone, quality, or visual evidence is insufficient.
