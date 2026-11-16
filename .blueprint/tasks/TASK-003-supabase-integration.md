# TASK-003 — Integration: Photo Selector with Supabase

**Status:** Blocked until TASK-001 security prerequisites are approved  
**Priority:** High  
**Scope:** Upload selected originals to Supabase Storage and persist metadata.

## Objective

Connect the photo-selection screen to Supabase after the schema, authentication model, and access policies are ready.

## Work items

1. Configure the Supabase client using the project's public URL and publishable/anon key only.
2. Upload selected original image files to the private Storage bucket using the authenticated client.
3. Use unique, inspection-scoped object paths; do not trust arbitrary client-supplied paths.
4. Persist the corresponding metadata records in PostgreSQL.
5. Handle partial failures safely: report which files succeeded/failed and avoid duplicate metadata rows on retry.
6. Provide loading, success, and actionable error states.
7. Verify that users cannot read, overwrite, or delete another user's/tenant's files.
8. Document how to configure local development and run the migrations.

## Acceptance criteria

- [ ] TASK-001 schema and security prerequisites are complete.
- [ ] Uploads use the private Supabase Storage bucket.
- [ ] Metadata rows reference the correct bucket and object path.
- [ ] Service-role credentials are not present in browser bundles or frontend environment variables.
- [ ] Retry behavior does not create duplicate records or orphaned files without a documented cleanup path.
- [ ] Access-control tests verify ownership boundaries.
- [ ] Actual verification results are recorded.

## Verification evidence

_To be completed by the implementing agent._