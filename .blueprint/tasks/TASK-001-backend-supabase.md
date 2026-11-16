# TASK-001 — Backend: Supabase Foundation and Photo Metadata

**Status:** Ready  
**Priority:** High  
**Scope:** Supabase PostgreSQL + Supabase Storage only.

## Objective

Prepare the backend data/storage foundation for vehicle inspection photos without introducing AWS or AI processing.

## Work items

1. Inspect the repository and confirm the selected application/runtime structure before adding backend code.
2. Document the required Supabase project configuration and environment variables using placeholders only.
3. Design a minimal migration for inspection sessions and photo metadata. Keep the schema small and aligned with the current photo-selector workflow.
4. Add a private Storage bucket migration or reproducible setup instructions for `vehicle-inspection-photos`.
5. Define RLS policies for database records and Storage objects.
6. Ensure object paths are scoped to the owning inspection and authenticated principal/tenant, once the auth model is known.
7. Document upload constraints and cleanup behavior for failed or abandoned uploads.
8. Add tests or verification steps for schema, RLS, and Storage access.

## Suggested metadata

A photo record may include:
- `id`
- `inspection_id`
- `shot_type`
- `bucket_id`
- `object_path`
- `original_filename`
- `mime_type`
- `file_size_bytes`
- `created_at`

Use foreign keys, constraints, and indexes only where justified. Store object paths, not public URLs or image binaries.

## Security requirements

- Bucket must be private.
- Never expose Supabase service-role credentials to frontend code.
- Do not create unrestricted anonymous insert/select/update/delete policies.
- Do not treat a client-provided inspection ID or Storage path as proof of ownership.
- Policies must enforce the approved user/tenant ownership model.
- If authentication/tenant requirements are still unknown, implement the schema in a way that can be reviewed, document the missing decision, and leave real-user upload policies blocked rather than weakening security.

## Acceptance criteria

- [ ] Supabase migration(s) or reproducible setup documentation are committed.
- [ ] Database schema stores metadata and Storage object paths, not binary images.
- [ ] Storage bucket is private.
- [ ] RLS and Storage policy design is documented and tested against the confirmed auth model.
- [ ] Environment variable example contains placeholders only.
- [ ] No AWS dependency or Claude API integration is introduced.
- [ ] Verification commands and actual results are recorded below.

## Verification evidence

_To be completed by the implementing agent._

## Notes / blockers

Authentication provider, tenant model, maximum file size, and maximum photos per inspection are not yet specified. Do not invent production access policies.