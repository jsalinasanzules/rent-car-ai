# MVP Architecture — React + Node.js + Supabase + Claude Vision

## Repository boundaries
- `Fronted/`: all React + TypeScript + Vite application code and frontend configuration.
- `Backend/`: all Node.js + TypeScript API code, Supabase integration, migrations, backend tests, and server configuration.
- `docs/`: shared architecture documentation.
- Root and `.blueprint/`: shared AI-agent instructions, task board, and project memory.
Never place app implementation files at repository root. Preserve exact folder names `Fronted` and `Backend`.

## Components
- Frontend: React + TypeScript + Vite in `Fronted/`.
- Backend: Node.js + TypeScript HTTP API in `Backend/`.
- Database: Supabase PostgreSQL.
- Files: private Supabase Storage bucket vehicle-inspection-photos.
- Vision: Anthropic Claude Messages API.

Supabase and Anthropic connections are made from the backend using server-side environment variables. The frontend communicates only with the Node.js API. Do not use Supabase Edge Functions for application backend logic.

## Flow
1. Operator selects baseline/current photos in React.
2. Each photo is assigned to a predefined vehicle zone.
3. Frontend validates type and size for user feedback.
4. Frontend sends files and metadata to Node.js API.
5. Backend validates, uploads originals to private Supabase Storage, and persists metadata.
6. Frontend requests comparison using application IDs.
7. Backend retrieves private images and calls Claude Vision.
8. Backend validates the model response, persists results, and returns normalized JSON.
9. Frontend displays findings and human-review warnings.

## Environment variables
- Backend-only in `Backend/.env.example`: PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL, CORS_ORIGIN.
- Frontend in `Fronted/.env.example`: VITE_API_BASE_URL.
Supabase service-role and Anthropic keys must never be exposed to browser code or VITE_ variables. Use placeholder examples only.

## Supabase
Use PostgreSQL for vehicles, inspections, image metadata, comparisons, and findings. Use private Storage. Store object paths and metadata, not image binaries in rows. Enforce ownership in Node.js API and database policies. Reject arbitrary external URLs.

## Claude Vision
Invoke Anthropic only from Node.js backend. Label image A as baseline and image B as current. Compare same-zone pairs, ignore lighting/reflections/shadows/dirt/camera differences, and return INCONCLUSIVE when unreliable. Validate output before persistence. Confidence is uncalibrated; findings require human review. No bounding boxes in MVP.

## Execution
Start synchronously for a small number of pairs. Add a queue only if measured latency/volume justify it. Use idempotency and cost limits.

## Out of scope
AWS, Supabase Edge Functions, OpenCV, image enhancement, queues, PDF reports, partner webhooks, automatic repair/insurance decisions.
