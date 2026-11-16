# TASK-003 — Backend Integration: Node.js Photo Upload API

**Status:** Blocked until TASK-001 is complete  
**Priority:** High  
**Scope:** React frontend → Node.js API → Supabase.

## Objective
Upload baseline/current photos through the Node.js backend and persist metadata in Supabase PostgreSQL and Storage.

## Work items
1. Define typed API contracts for inspections and photo uploads.
2. Configure frontend VITE_API_BASE_URL; no privileged Supabase or Anthropic credentials in frontend.
3. Implement Node.js upload endpoints (multipart or backend-authorized upload design).
4. Backend connects to Supabase using SUPABASE_URL and server-only credentials from environment variables.
5. Validate authorization, inspection ownership, zone, MIME type, size, and one-image-per-zone rule.
6. Store originals in private Storage and metadata in PostgreSQL.
7. Handle partial failures, replacement, retries, and orphan cleanup.
8. Return stable image IDs and typed API responses.
9. Connect React UI with loading, success, and error states.
10. Test access boundaries and failure scenarios.

## Acceptance criteria
- [ ] Uploads use Node.js API or a backend-authorized upload flow.
- [ ] Originals are stored in private Supabase Storage.
- [ ] Metadata references inspection, zone, object path, MIME type, size, and timestamps.
- [ ] Frontend contains only public API configuration.
- [ ] Service-role and Anthropic keys never reach browser.
- [ ] Retry and replacement are safe.
- [ ] Tests and actual verification results are documented.
