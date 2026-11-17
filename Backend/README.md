# Backend — Rent Car AI

Node.js 22+ and TypeScript HTTP API. All backend implementation, package manifests, configuration, Supabase migrations, tests, and server-only environment examples remain in this directory.

## Technology decisions

- **Fastify 5** is the HTTP framework: lightweight, TypeScript-friendly, and supports injectable HTTP tests.
- **@fastify/multipart** receives vehicle metadata and multiple image files in one request.
- **Zod** validates server environment configuration at startup.
- **Supabase JS** is used only from the trusted backend with the service-role key.
- **Vitest** runs backend unit and HTTP-level tests.
- **ESLint** and TypeScript provide static checks.

## Local setup

```bash
cd Backend
npm install
cp .env.example .env
# Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
npm run dev
```

Health endpoint: `GET http://localhost:3000/api/health`.

## Persist vehicle and inspection photos

The frontend submits one multipart request to `POST /api/inspections` containing:
- Vehicle data (make, model, year, license plate, VIN).
- Baseline and current inspection photo-zone metadata.
- Original image files.

The API creates the vehicle and both inspections, uploads originals to the private `vehicle-inspection-photos` bucket, and inserts image metadata into `inspection_images`. If persistence fails, it attempts to remove uploaded objects and the newly created vehicle (cascading its inspections). Response status is 201 only after the metadata insert succeeds.

Each photo is limited to 12 MB; the endpoint accepts up to 22 files. At least one zone must be present in both inspections. The current endpoint is intended for the single-operator prototype and is not production-authenticated.

## Supabase migrations

Apply in order using the Supabase SQL Editor or Supabase CLI:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_prototype_single_operator.sql`

Migration 002 relaxes `owner_id` nullability for this unauthenticated prototype and retains simple foreign keys so related records remain valid. RLS remains enabled and anonymous direct table access is not granted. The Node API uses the service-role key and bypasses RLS; keep the API limited to the trusted prototype environment. Authentication and authorization must be added before exposing it to real users.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## AI Vision comparison (TASK-004)

Apply the next migration after 001 and 002:

3. `supabase/migrations/003_claude_vision_comparisons.sql`

Gemini is the default provider for low-cost prototype testing. Create an API key in [Google AI Studio](https://aistudio.google.com/) and set these server-only values in `.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your-google-ai-studio-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
```

To use the existing paid Claude integration instead, set `AI_PROVIDER=claude` and configure `ANTHROPIC_API_KEY` plus `CLAUDE_MODEL`.

Restart the backend after changing environment variables. Never put either provider key in `Fronted/.env` or any `VITE_` variable. Free-tier availability, model access, rate limits and quotas are controlled by Google and may change. Google AI Studio's free tier may use submitted content to improve its products; use only non-sensitive test photos until the data terms have been reviewed.

After saving a vehicle and both inspections, call `POST /api/comparisons` with JSON:

```json
{
  "baselineInspectionId": "uuid-from-save-response",
  "currentInspectionId": "uuid-from-save-response"
}
```

The backend verifies that the inspections are a baseline/current pair for the same vehicle, matches zones, downloads the original images from the private Storage bucket, and sends each pair to the configured provider (Gemini by default, Claude optionally). The prototype currently limits a request to five matching zones and 7 MB per image to control cost. The API stores per-zone results, findings, model/prompt metadata and token usage. A baseline/current pair is processed only once; failures are not retried automatically because inference is paid.

Overall outcomes: `NEW_DAMAGE`, `NO_CHANGE`, or `INCONCLUSIVE`. All findings require human review; confidence is an uncalibrated estimate.

**Prototype security boundary:** this endpoint has no user authentication. Keep the API local/private and do not expose it publicly. Add authentication and per-resource authorization before production use.

## Environment

See `.env.example`. Supabase and Anthropic credentials are server-only. The frontend receives only `VITE_API_BASE_URL`.
