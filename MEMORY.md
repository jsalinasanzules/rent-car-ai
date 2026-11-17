# Project Memory — Rent Car AI

Last updated: 2026-11-16

## Confirmed decisions
- Frontend: React + TypeScript + Vite, all files under `Fronted/` (exact spelling).
- Backend: separate Node.js + TypeScript HTTP API under `Backend/`, using Fastify 5.
- Environment validation: Zod; multipart: @fastify/multipart; tests: Vitest.
- Database: Supabase PostgreSQL; files: private Supabase Storage.
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

## Security and prototype constraints
- Never expose SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY to browser code.
- Keep Storage bucket private.
- Reject arbitrary external image URLs; preserve original photos.
- The Supabase service-role client bypasses RLS.
- User explicitly deferred authentication for the current prototype. Migration 002 allows null owner_id values; the API is for trusted local/prototype use only and must not be deployed as a public production service.
- Add authentication and per-resource authorization before production exposure.

## Current progress
- TASK-002 frontend photo selector marked Done based on user's confirmation that verification is resolved; individual command output was not captured in this session.
- TASK-001 backend scaffold created: Fastify, Zod config, Supabase server client, SQL model, private bucket, health endpoint and starter tests. Runtime checks and ordered migration application still need confirmation.
- TASK-003 implemented: vehicle data form, explicit save action, multipart POST /api/inspections, two inspection records, private image uploads, metadata persistence, success/error/loading UI.
- User reports migration 001 already applied. Must now apply migration 002 after 001 before testing the new no-auth prototype persistence flow.
- User confirmed vehicle records and photos now persist successfully in Supabase; TASK-001 and TASK-003 can be marked Done based on that end-to-end confirmation.
- TASK-004 Claude Vision implementation added: backend service calling Anthropic Messages API, strict Zod output validation, POST /api/comparisons, private Storage downloads, same-vehicle baseline/current matching, max 5 zone pairs and 7 MB/image limits, unique pair idempotency, persisted per-zone results/findings/model/prompt/token usage, and frontend result display.
- Migration 003_claude_vision_comparisons.sql is required before running comparison. Configure ANTHROPIC_API_KEY and optional CLAUDE_MODEL in Backend/.env. No live Claude call or local tests/build has been run yet. Keep the unauthenticated API local/private.
- Frontend and backend automated checks have not been run in this session; record only actual local results.

## Next steps
1. User applies migration 002 in Supabase and runs backend/frontend.
2. Verify one complete vehicle + baseline/current photo submission and inspect rows/Storage objects.
3. Fix any runtime or SQL errors based on actual logs.
4. Implement TASK-004 Claude Vision comparison endpoint after persistence is confirmed.
