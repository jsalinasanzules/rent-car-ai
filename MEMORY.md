# Project Memory — Rent Car AI

Last updated: 2026-11-16

## Confirmed decisions
- Frontend: React + TypeScript + Vite.
- Backend: separate Node.js + TypeScript HTTP API.
- Supabase PostgreSQL and private Supabase Storage.
- Backend connects to Supabase through server-side environment variables.
- Claude Vision is called only by the Node.js backend using server-side ANTHROPIC_API_KEY and configurable CLAUDE_MODEL.
- Frontend exposes VITE_API_BASE_URL only.
- No AWS, Supabase Edge Functions, OpenCV, image enhancement, or queues in first prototype.
- One screen compares previous/baseline and current inspection photos.
- One image per zone per inspection; confirm before replacing.
- Comparison outcomes: NEW_DAMAGE, NO_CHANGE, INCONCLUSIVE.
- AI findings require human review; confidence is not calibrated.

## Security constraints
- Never expose SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY to browser code.
- Keep Storage bucket private.
- Reject arbitrary external image URLs.
- Preserve original photos.
- Do not fake upload or analysis success while backend is absent.

## Current progress
- README, AGENTS, PROJECT_CONTEXT, architecture, task board, and task files aligned to the confirmed stack.
- MEMORY.md is the persistent project decision and handoff record for OpenCode/Copilot.
- React + TypeScript + Vite scaffold and initial photo selector committed.
- UI supports baseline/current multi-file selection, local previews, zone assignment, replace confirmation, remove, validation, matching-zone indicators, and responsive layout.
- Compare button is deliberately disabled until backend integration exists.
- TASK-002 remains In Progress. Automated build/type-check/tests have not been run because the session could not reach GitHub from a local runtime; verify in a local checkout before marking Done.
- Backend upload, persistence, and Claude analysis are not implemented yet.

## Next steps
1. Check out the repository locally; run npm install and npm run build; fix any issues found.
2. Complete TASK-002 with actual verification evidence.
3. Implement TASK-001 Node.js backend and Supabase schema/private bucket.
4. Implement TASK-003 upload/metadata API and connect UI.
5. Implement TASK-004 Claude Vision comparison endpoint and result rendering.
