# TASK-005 — Reuse a saved inspection as a baseline

## Goal
Allow an operator to load a previously saved BASELINE inspection by its exact Inspection ID, then create a new CURRENT inspection for the same vehicle and compare the pair with the configured AI provider.

## API
- `GET /api/inspections/:inspectionId`: restore the exact saved baseline/current pair, all photo metadata with short-lived signed URLs, and persisted AI comparison results/findings when available. Accept either ID from the pair.
- `inspection_pairs` persists the baseline/current relationship independently of AI execution; migration 004 backfills pairs already represented in the comparisons table.
- `POST /api/inspections/:baselineInspectionId/current`: validate that the referenced inspection is BASELINE, create a new CURRENT inspection for its vehicle, upload only new photos, and return the two IDs for the existing baseline and new current inspection.
- Validate UUID format, photo MIME/size/zone, unique zones, and at least one zone shared with the baseline.
- Do not update, replace, or delete the baseline inspection, its image rows, or Storage objects.
- Never return service-role credentials or raw Storage paths to the browser.

## Frontend
- Add a Load Saved Inspection field using Inspection ID (not license plate).
- Load saved vehicle details and baseline photos; keep loaded photos and vehicle metadata read-only.
- Operator adds new CURRENT photos and saves them as a separate inspection.
- Reuse existing POST /api/comparisons with the baseline ID and newly created current ID.
- Display the baseline ID so the operator can confirm the selected reference.

## Acceptance criteria
- A valid ID from either side restores all photos from both inspections in its saved pair.
- A completed AI result, zone results, and findings are restored without another AI call; if no result exists, the operator can explicitly run the comparison.
- Invalid or missing IDs produce clear errors.
- A CURRENT inspection ID is rejected as a baseline.
- New CURRENT inspection is saved without changing any original baseline row or object.
- Only matching zones are compared.
- Existing new-inspection workflow remains available.
- Relevant frontend/backend builds and tests pass; record actual verification output before marking Done.

## Status
In Progress — implementation committed to `feature/gemini-vision-provider`. Runtime/build/test verification and Supabase endpoint testing remain pending.
