# Project Memory — Rent Car AI

Last updated: 2026-11-16

## Confirmed decisions
- Frontend: React + TypeScript + Vite, all files under `Fronted/` (exact spelling).
- Backend: separate Node.js + TypeScript HTTP API, all files under `Backend/`.
- Shared docs at `docs/`; AI tasks under `.blueprint/tasks/`; project-level instructions and memory at root.
- Do not place frontend/backend implementation files at repository root.
- Supabase PostgreSQL and private Supabase Storage.
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

## Current progress
- Project instructions, architecture, task board, and task files updated to enforce Fronted/ and Backend/ boundaries.
- Initial React frontend implementation is being relocated from root into Fronted/.
- Frontend supports baseline/current multi-file selection, local previews, zone assignment, replace confirmation, remove, validation, matching-zone indicators, and responsive layout.
- Compare button is deliberately disabled until backend integration exists.
- Automated build/type-check/tests have not been run; verify in a local checkout before marking TASK-002 Done.
- Backend upload, persistence, and Claude analysis are not implemented yet.

## Next steps
1. Verify Fronted app with npm install and npm run build.
2. Complete TASK-002 with actual verification evidence.
3. Implement TASK-001 under Backend/: Node.js backend and Supabase schema/private bucket.
4. Implement TASK-003 under Backend/: upload/metadata API and connect UI.
5. Implement TASK-004 under Backend/: Claude Vision comparison endpoint; render results in Fronted/.
