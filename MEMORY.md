# Project Memory — Rent Car AI

Last updated: 2026-11-16

## Confirmed decisions
- Frontend: React + TypeScript + Vite.
- Backend: Node.js + TypeScript, separate HTTP API.
- Supabase PostgreSQL and private Supabase Storage.
- Backend connects to Supabase through server-side environment variables.
- Claude Vision is called only by the Node.js backend using server-side ANTHROPIC_API_KEY and configurable CLAUDE_MODEL.
- Frontend exposes only VITE_API_BASE_URL.
- No AWS, Supabase Edge Functions, OpenCV, image enhancement, or queues in first prototype.
- One screen compares previous/baseline and current inspection photos.
- One image per zone per inspection for deterministic matching; confirm before replacing.
- Comparison outcomes: NEW_DAMAGE, NO_CHANGE, INCONCLUSIVE.
- AI findings require human review; confidence is not calibrated.

## Security constraints
- Never expose SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY to browser code.
- Keep Storage bucket private.
- Reject arbitrary external image URLs.
- Preserve original photos.
- Do not fake upload or analysis success while backend is absent.

## Current progress
- Project instructions, context, architecture, and backend/frontend task definitions aligned to confirmed stack.
- TASK-002 frontend is being implemented as a local-only React prototype.
- Backend upload, persistence, and AI comparison are not implemented yet.

## Next steps
1. Finish TASK-002 and run actual frontend checks.
2. Implement TASK-001 Node.js backend and Supabase schema/private bucket.
3. Implement TASK-003 upload/metadata API and connect UI.
4. Implement TASK-004 Claude Vision comparison endpoint and result rendering.
