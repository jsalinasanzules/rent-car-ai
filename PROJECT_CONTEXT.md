# Project Context

## Product goal
Compare photos of the same vehicle across previous and current inspections and identify potential new visible damage.

## Mandatory repository layout
- `Fronted/`: React + TypeScript + Vite frontend only.
- `Backend/`: Node.js + TypeScript backend only.
- `docs/`: shared architecture and product documentation.
- `.blueprint/`: AI task specifications.
- Root: shared agent instructions, README, project context, memory, and task board.
Never put frontend or backend implementation files at repository root. Preserve the requested spelling `Fronted`.

## MVP screen
One React + TypeScript screen contains two photo collections: Previous inspection (baseline) and Current inspection. The operator selects multiple photos, assigns each to a predefined zone, previews, removes, and replaces them.

Zones: front, rear, left side, right side, front-left corner, front-right corner, rear-left corner, rear-right corner, interior, dashboard/odometer, other detail.

Allow one photo per zone per inspection for deterministic pairing. Ask before replacing an occupied zone. A zone is comparable only when both inspections contain a photo for it.

## Fixed technology decisions
- Frontend: React + TypeScript + Vite in `Fronted/`.
- Backend: Node.js + TypeScript, separate HTTP API in `Backend/`.
- Database: Supabase PostgreSQL.
- Files: private Supabase Storage bucket vehicle-inspection-photos.
- AI: Anthropic Claude Vision via Messages API.
- Supabase and Anthropic connections are made from the Node.js backend using environment variables.
- Frontend calls the Node.js API only. It does not call Anthropic or use privileged Supabase credentials.
- No AWS, Supabase Edge Functions, OpenCV, Sharp/image enhancement, or queue in the first prototype.

## Environment configuration
Backend-only in `Backend/.env.example`: PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL, CORS_ORIGIN.
Frontend in `Fronted/.env.example`: VITE_API_BASE_URL only.
Never place secrets in VITE_ variables or commit real credentials.

## Comparison workflow
1. Operator selects baseline/current photos for matching zones.
2. Frontend sends files and metadata to Node.js API.
3. Backend validates, stores originals in private Supabase Storage, and persists metadata in PostgreSQL.
4. Backend retrieves authorized images and calls Claude Vision.
5. Backend validates Claude's structured response, persists findings, and returns results.
6. Frontend displays potential findings for human review.

## Reusing a saved baseline
The operator can load a saved BASELINE inspection by its exact UUID. The API returns vehicle details and private photo previews via short-lived signed URLs. The baseline is read-only. The operator adds new CURRENT photos; the API creates a separate CURRENT inspection for the same vehicle and uploads only those new images. The existing comparison endpoint analyzes the original baseline against the new current inspection. Never mutate baseline records or Storage objects.

## Expected result
Overall status: NEW_DAMAGE, NO_CHANGE, or INCONCLUSIVE. Each finding includes type, zone, location description, description, severity (LOW/MEDIUM/HIGH/UNKNOWN), confidence estimate (0–1, not calibrated), and requires_human_review=true.

## Current implementation boundary
First frontend increment is local-only: selection, zone assignment, previews, remove/replace, and matching-zone indicators. Upload and comparison remain unavailable until Node.js backend integration exists. Do not fake successful uploads or AI results.

Authentication/tenant ownership, file limits, and final API contract must be confirmed before secure persistence.
