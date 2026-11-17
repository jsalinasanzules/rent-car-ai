# Project Memory — Rent Car AI

Last updated: 2026-11-16

## Confirmed decisions
- Frontend: React + TypeScript + Vite, all files under `Fronted/` (exact spelling).
- Backend: separate Node.js + TypeScript HTTP API, all files under `Backend/`.
- Backend framework: Fastify 5; environment validation: Zod; tests: Vitest.
- Database: Supabase PostgreSQL; files: private Supabase Storage.
- Backend connects to Supabase through server-side environment variables.
- Claude Vision is called only by the Node.js backend using server-side ANTHROPIC_API_KEY and configurable CLAUDE_MODEL.
- Frontend exposes VITE_API_BASE_URL only.
- No AWS, Supabase Edge Functions, OpenCV, image enhancement, or queues in first prototype.
- One screen compares previous/baseline and current inspection photos.
- One image per zone per inspection; confirm before replacing.
- Comparison outcomes: NEW_DAMAGE, NO_CHANGE, INCONCLUSIVE.
- AI findings require human review; confidence is not calibrated.

## Directory-specific rules
- Fronted/: React source, public assets, package.json, Vite/TypeScript config, frontend tests and .env.example.
- Backend/: Node source, package.json, Node/TypeScript config, Supabase migrations/seeds, backend tests and server-only .env.example.
- Never store server secrets in Fronted/.env or VITE_ variables.
- Root README documents how to run each app. Keep shared agent docs at root.

## Security constraints
- Never expose SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY to browser code.
- Keep Storage bucket private.
- Reject arbitrary external image URLs.
- Preserve original photos.
- Do not fake upload or analysis success while backend is absent.
- The Supabase service-role client bypasses RLS; every backend data route must authenticate callers and enforce owner/tenant checks independently.
- Do not enable real-user routes until the authentication and tenant/owner model is agreed and cross-owner access tests pass.

## Current progress
- TASK-002 frontend photo selector is marked Done based on the user's confirmation that the verification item is resolved; individual command output was not captured in this session.
- TASK-001 backend scaffold created under Backend/: Fastify API, Zod config validation, Supabase server client, initial migration, private Storage bucket definition, health endpoint, error handler, lint/typecheck/test/build scripts and starter tests.
- TASK-001 remains In Progress: migration still needs applying to the actual Supabase project; RLS/Storage boundaries and API owner checks need integration testing; authentication/tenant model needs confirmation; backend checks need execution in a local checkout.
- TASK-003 remains blocked pending TASK-001 security gates.
- Compare button remains deliberately disabled until backend integration exists.

## Next steps
1. Complete TASK-001 security and environment verification.
2. Implement TASK-003 upload/metadata API with authenticated ownership enforcement and connect UI.
3. Implement TASK-004 Claude Vision comparison endpoint; render results in Fronted/.
