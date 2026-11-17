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

## Environment

See `.env.example`. Supabase and Anthropic credentials are server-only. Anthropic variables are reserved for TASK-004 and are optional until that task is implemented. The frontend receives only `VITE_API_BASE_URL`.
