# Backend — Rent Car AI

Node.js 22+ and TypeScript HTTP API. All backend implementation, package manifests, configuration, Supabase migrations, tests, and server-only environment examples remain in this directory.

## Technology decisions

- **Fastify 5** is the HTTP framework: lightweight, TypeScript-friendly, supports schema-oriented request handling, and provides an injectable server for tests.
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

The health endpoint is `GET http://localhost:3000/api/health`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Supabase migration

Apply `supabase/migrations/001_initial_schema.sql` to the target Supabase project using the Supabase CLI or SQL editor. The migration creates the initial relational model, enables row-level security, and provisions the private `vehicle-inspection-photos` bucket.

**Security boundary:** the service-role client bypasses RLS. No business-data routes are exposed yet. Before adding those routes, implement caller authentication and enforce owner checks in the API on every resource operation. The migration's authenticated-user policies are defense-in-depth for direct authenticated access; they do not replace backend authorization. Do not deploy this API for real users until the authentication and tenant/owner model is confirmed and tested.

## Environment

See `.env.example`. Supabase and Anthropic credentials are server-only. Anthropic variables are reserved for TASK-004 and are optional until that task is implemented. The frontend receives only `VITE_API_BASE_URL`.

Planned responsibilities:
- Supabase PostgreSQL connection and migrations.
- Private Supabase Storage integration.
- Inspection and photo metadata API (TASK-003).
- Claude Vision comparison service (TASK-004).
- Validation, authorization, ownership checks, and normalized results.

Never expose Supabase service-role or Anthropic credentials to the frontend.
