# TASK-001 — Backend: Node.js + TypeScript and Supabase Foundation

**Status:** In Progress  
**Priority:** High  
**Scope:** Node.js + TypeScript API, Supabase PostgreSQL, private Supabase Storage.

## Objective
Create the trusted backend foundation and connect to Supabase using server-side environment variables.

## Implemented
- Separate Node.js 22+ and TypeScript application under `Backend/`.
- Fastify 5 selected as the HTTP framework; rationale documented in `Backend/README.md`.
- Zod environment validation, loaded at application startup.
- Supabase server client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; credentials remain server-only.
- Server-only `.env.example`; Anthropic variables are optional until TASK-004.
- Initial SQL migration for vehicles, inspections, inspection_images, comparisons, and comparison_findings.
- RLS enabled on all application tables; authenticated owner-scoped policies and no anonymous table policies.
- Private `vehicle-inspection-photos` bucket with JPEG/PNG/WebP and 12 MB restrictions.
- Fastify health endpoint and centralized error response handling.
- Initial Vitest tests for environment parsing and health endpoint.
- ESLint and TypeScript check scripts.

## Remaining work / security gates
- Apply the migration to a Supabase project and verify the schema and private bucket in that environment.
- Add automated integration tests for RLS, Storage policies, and cross-owner access boundaries.
- Confirm the product authentication and tenant/owner model before enabling real-user API access.
- Implement authenticated request handling and explicit owner checks before exposing any data or Storage routes. The service-role key bypasses RLS, so database policies alone do not secure the Node API.
- Run and record actual lint, type-check, test, and production build results in a local checkout.

## Expected backend variables
`NODE_ENV`, `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`; `ANTHROPIC_API_KEY` and `CLAUDE_MODEL` are reserved for TASK-004 and optional until then. Frontend may use `VITE_API_BASE_URL` only. Never expose service-role or Anthropic keys through Vite variables.

## Acceptance criteria
- [x] Node.js + TypeScript backend scaffold and validated startup configuration are implemented.
- [x] Backend Supabase client is configured using server-side environment variables.
- [ ] Migrations and private bucket are applied and verified against the target Supabase project.
- [ ] Ownership/security model is confirmed and access boundaries are integration-tested.
- [x] No secrets are committed or sent to browser; only placeholders are committed.
- [x] No AWS or Supabase Edge Functions.
- [ ] Actual verification results are documented after running the checks.

Authentication and tenant ownership must be agreed before real-user access policies are enabled. The current migration is a secure-by-default foundation, not authorization proof for service-role API operations.
