# TASK-003 — Backend Integration: Node.js Photo Upload API

**Status:** In Progress  
**Priority:** High  
**Scope:** React frontend → Node.js API → Supabase.

## Objective
Save vehicle details, baseline/current inspection records, original photos, and photo metadata before invoking AI.

## Implemented
- Typed multipart contract from React to `POST /api/inspections`.
- Frontend reads only `VITE_API_BASE_URL`.
- Fastify multipart support and per-file 12 MB / up to 22-file limits.
- Vehicle row and baseline/current inspection rows are created in Supabase PostgreSQL.
- Original files are uploaded to private `vehicle-inspection-photos` Storage.
- Image metadata includes inspection ID, zone, bucket/path, original filename, MIME type, size, and timestamp.
- Zone identifiers are aligned between frontend and database.
- At least one shared photo zone is required before saving.
- Failed persistence attempts clean up uploaded objects and the created vehicle/inspection records.
- Frontend includes vehicle fields and an explicit save button with loading, success and error states. The save button prevents accidental duplicate submissions until the form is changed.
- AI comparison remains disabled until TASK-004.

## Prototype migration required
After applying migration 001, apply `Backend/supabase/migrations/002_prototype_single_operator.sql`. It permits null owner IDs for the current single-operator prototype, retains simple foreign keys, and keeps RLS enabled. This is not a production authentication model.

## Remaining verification
- [ ] Run backend lint, type-check, tests, and production build in local checkout.
- [ ] Start backend and verify `GET /api/health`.
- [ ] Save one vehicle with at least one matching photo zone and verify vehicle, two inspections, image metadata, and private Storage objects in Supabase.
- [ ] Verify invalid MIME, oversized file, missing file, and nonmatching zones are rejected.
- [ ] Verify a failed Storage/DB operation does not leave partial records or orphaned objects.
- [ ] Implement safe idempotent retries and editing/replacement of an existing inspection set (currently each new submission after editing creates a new vehicle and inspection set).
- [ ] Record actual command output and Supabase verification evidence.

## Acceptance criteria
- [x] Uploads use Node.js API.
- [x] Originals are stored in private Storage.
- [x] Metadata references inspection, zone, object path, MIME type, size, and timestamp.
- [x] Frontend contains only public API configuration.
- [x] Service-role and Anthropic keys never reach browser.
- [ ] Safe retries and updates/replacement of existing records.
- [ ] Tests and actual verification results are documented.

## Current scope boundary
This is a prototype persistence step. It does not call Claude Vision, update existing inspections, or implement user authentication. The API must not be exposed as a production public service.
