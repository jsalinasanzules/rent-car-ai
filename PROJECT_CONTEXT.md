# Project Context

## Product goal
Compare photos of the same vehicle across previous and current inspections and identify potential new visible damage.

## MVP screen
One React + TypeScript screen contains two photo collections: Previous inspection (baseline) and Current inspection. The operator selects multiple photos, assigns each to a predefined zone, previews, removes, and replaces them.

Zones: front, rear, left side, right side, front-left corner, front-right corner, rear-left corner, rear-right corner, interior, dashboard/odometer, other detail.

Allow one photo per zone per inspection for deterministic pairing. Ask before replacing an occupied zone. A zone is comparable only when both inspections contain a photo for it.

## Fixed technology decisions
- Frontend: React + TypeScript + Vite.
- Backend: Node.js + TypeScript, separate HTTP API.
- Database: Supabase PostgreSQL.
- Files: private Supabase Storage bucket vehicle-inspection-photos.
- AI: Anthropic Claude Vision via Messages API.
- Supabase and Anthropic integrations are configured in the Node.js backend using environment variables.
- Frontend calls the Node.js API only. It does not call Anthropic or use privileged Supabase credentials.
- No AWS, Supabase Edge Functions, OpenCV, Sharp/image enhancement, or queue in the first prototype.

## Environment configuration
Backend-only: PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL, CORS_ORIGIN.
Frontend: VITE_API_BASE_URL only.
Never place secrets in VITE_ variables or commit real credentials.

## Comparison workflow
1. Operator selects baseline/current photos for matching zones.
2. Frontend sends files and metadata to Node.js API.
3. Backend validates, stores originals in private Supabase Storage, and persists metadata in PostgreSQL.
4. Backend retrieves authorized images and calls Claude Vision.
5. Backend validates Claude's structured response, persists findings, and returns results.
6. Frontend displays potential findings for human review.

## Expected result
Overall status: NEW_DAMAGE, NO_CHANGE, or INCONCLUSIVE. Each finding includes type, zone, location description, description, severity (LOW/MEDIUM/HIGH/UNKNOWN), confidence estimate (0–1, not calibrated), and requires_human_review=true.

## Current implementation boundary
First frontend increment is local-only: selection, zone assignment, previews, remove/replace, and matching-zone indicators. Upload and comparison remain unavailable until Node.js backend integration exists. Do not fake successful uploads or AI results.

Authentication/tenant ownership, file limits, and final API contract must be confirmed before secure persistence.
