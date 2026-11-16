# TASK-003 — Integration: Authenticated Supabase Uploads and Metadata Persistence

**Status:** Blocked until TASK-001 security prerequisites are approved  
**Priority:** High  
**Scope:** Supabase client, private Storage, PostgreSQL.

## Objective

Persist both baseline and current inspection photographs and their metadata using Supabase, while preserving the original files and enforcing ownership.

## Work items

1. Configure the browser Supabase client with project URL and publishable/anon key only.
2. Create or associate the baseline and current inspection records.
3. Upload original files to the private `vehicle-inspection-photos` bucket.
4. Use unique object paths scoped to the authorized inspection; never trust arbitrary client paths.
5. Persist metadata including inspection ID, zone, bucket/object path, original filename, MIME type, size, and dimensions.
6. Enforce one photo per zone per inspection for the MVP; handle replacement as a controlled delete/replace flow.
7. Handle partial failures safely and avoid duplicate metadata on retry.
8. Provide upload progress, success, and actionable error states.
9. Verify users cannot read, overwrite, or delete another user's/tenant's files.
10. Document local setup and migration commands.

## Acceptance criteria

- [ ] TASK-001 schema, RLS, and Storage policies are complete and tested.
- [ ] Baseline and current images upload to the private bucket.
- [ ] Metadata records reference correct inspection, zone, bucket, and object path.
- [ ] Originals are preserved.
- [ ] Browser code contains no secret/service-role key or Anthropic key.
- [ ] Retry/replacement does not create duplicate records or untracked orphan files.
- [ ] Ownership boundaries are tested.
- [ ] Actual verification results are recorded.

## Verification evidence

_To be completed by the implementing agent._
