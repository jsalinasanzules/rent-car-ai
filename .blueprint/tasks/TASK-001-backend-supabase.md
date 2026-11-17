# TASK-001 — Backend: Node.js + TypeScript and Supabase Foundation

**Status:** In Progress  
**Priority:** High  
**Scope:** Node.js + TypeScript API, Supabase PostgreSQL, private Supabase Storage.

## Objective
Create the backend foundation and connect to Supabase using server-side environment variables.

## Implemented
- Separate Node.js 22+ and TypeScript application under `Backend/`.
- Fastify 5 selected as the HTTP framework; rationale documented in `Backend/README.md`.
- Zod environment validation, loaded at application startup.
- Lazily initialized Supabase server client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; credentials remain server-only.
- Server-only `.env.example`; Anthropic variables are optional until TASK-004.
- Initial SQL migration for vehicles, inspections, inspection_images, comparisons, and comparison_findings.
- RLS enabled on all application tables; authenticated owner-scoped policies and no anonymous table policies.
- Private `vehicle-inspection-photos` bucket with JPEG/PNG/WebP and 12 MB restrictions.
- Fastify health endpoint and centralized error response handling.
- Initial Vitest tests for environment parsing and health endpoint.
- ESLint and TypeScript check scripts.
- Migration 002 adds prototype-mode nullable owner IDs while retaining simple foreign keys and private Storage.

## Remaining verification
- [ ] Apply migrations 001 and 002 in order and verify schema and private bucket in the target Supabase project.
- [ ] Run and record actual lint, type-check, tests, and production build results in a local checkout.
- [ ] Verify a real save through TASK-003 and inspect database/storage results.

## Deferred by user for this prototype
Authentication and multi-tenant ownership are explicitly out of current scope. Migration 002 supports a single trusted operator by allowing null owner IDs. The API uses the service-role key and bypasses RLS, so it must remain a local/trusted prototype and must not be exposed as a public production service. Add authentication and per-resource authorization before production deployment.

## Expected backend variables
`NODE_ENV`, `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`; `ANTHROPIC_API_KEY` and `CLAUDE_MODEL` are reserved for TASK-004 and optional until then. Frontend may use `VITE_API_BASE_URL` only. Never expose service-role or Anthropic keys through Vite variables.

## Acceptance criteria
- [x] Node.js + TypeScript backend scaffold and validated startup configuration are implemented.
- [x] Backend Supabase client is configured using server-side environment variables.
- [ ] Migrations 001 and 002 are applied and verified against the target Supabase project.
- [x] Prototype mode supports persistence without login while keeping RLS enabled and Storage private.
- [x] No secrets are committed or sent to browser; only placeholders are committed.
- [x] No AWS or Supabase Edge Functions.
- [ ] Actual verification results are documented after running the checks.
