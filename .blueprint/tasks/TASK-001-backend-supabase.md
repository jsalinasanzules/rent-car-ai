# TASK-001 — Backend: Supabase Data Model, Private Storage, and Access Policies

**Status:** Ready  
**Priority:** High  
**Scope:** Supabase PostgreSQL + Supabase Storage; no AWS.

## Objective

Prepare secure persistence for vehicles, baseline/current inspections, inspection photos, comparisons, and AI findings.

## Work items

1. Inspect the actual repository and choose the minimal Supabase project structure.
2. Define the authentication/tenant ownership assumptions; request confirmation if still unspecified.
3. Add migrations for:
   - vehicles (only fields needed by prototype, VIN optional)
   - inspections (vehicle, inspection type/date, owner/tenant, status)
   - inspection_images (inspection, zone, bucket/object path, original filename, MIME type, size, dimensions)
   - comparisons (baseline inspection, current inspection, processing status, overall result, timestamps)
   - comparison_findings (comparison, zone, type, location description, description, severity, confidence estimate, human-review flag)
4. Add private Storage bucket `vehicle-inspection-photos`.
5. Define RLS policies and Storage policies based on the approved ownership model.
6. Add constraints/indexes for valid inspection types, zones, result/status values, unique image per zone per inspection for MVP, and lookup paths where justified.
7. Document local Supabase setup, migrations, upload limits, and cleanup of abandoned uploads.
8. Add tests or reproducible verification steps for schema, RLS, and Storage access.

## Suggested values

Inspection type: `BASELINE`, `CURRENT`.

Zone values: `front`, `rear`, `left_side`, `right_side`, `front_left_corner`, `front_right_corner`, `rear_left_corner`, `rear_right_corner`, `interior`, `dashboard`, `detail`.

Processing status: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.

Overall result: `NEW_DAMAGE`, `NO_CHANGE`, `INCONCLUSIVE`.

Finding severity: `LOW`, `MEDIUM`, `HIGH`, `UNKNOWN`.

## Security requirements

- Bucket must be private.
- Never expose Supabase secret/service-role keys to browser code.
- Do not create unrestricted anonymous policies.
- Do not treat client-provided inspection IDs or Storage paths as proof of ownership.
- Enforce ownership in RLS and revalidate it in privileged Edge Functions.
- If auth/tenant requirements remain unknown, keep real-user upload policies blocked rather than weakening security.

## Acceptance criteria

- [ ] Migrations define the minimum entities and constraints.
- [ ] Storage bucket is private.
- [ ] RLS and Storage policies enforce the approved ownership model.
- [ ] Metadata stores object paths, not image binaries or public URLs.
- [ ] One-image-per-zone pairing rule is enforced for the MVP.
- [ ] Environment examples contain placeholders only.
- [ ] No AWS dependency is introduced.
- [ ] Verification commands and actual results are recorded.

## Verification evidence

_To be completed by the implementing agent._

## Blockers

Authentication provider/user model and tenant isolation are not yet specified. Do not invent permissive access policies.
