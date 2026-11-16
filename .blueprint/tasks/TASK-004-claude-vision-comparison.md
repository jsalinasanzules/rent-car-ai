# TASK-004 — Backend AI: Claude Vision Comparison (Node.js + TypeScript)

**Status:** Blocked until TASK-001 and TASK-003 are complete  
**Priority:** High  
**Scope:** Node.js backend service + Anthropic Messages API.

## Objective
Compare matching baseline/current image pairs with Claude Vision and persist structured potential damage findings.

## Work items
1. Implement AI comparison service inside Node.js + TypeScript backend.
2. Load ANTHROPIC_API_KEY and CLAUDE_MODEL from validated server-side environment variables.
3. Expose protected API endpoint accepting application comparison/inspection IDs only.
4. Validate authorization and ownership of vehicle, inspections, and referenced images.
5. Load private image objects from Supabase Storage using server-side credentials.
6. Send each same-zone pair to Anthropic Messages API; label Image A baseline and Image B current.
7. Prompt for visible new damage only; ignore lighting, reflections, shadows, dirt, and camera-angle differences.
8. Return INCONCLUSIVE if the pair cannot be reliably compared.
9. Validate structured model output against a strict schema before persistence.
10. Persist overall/per-zone status, findings, model, prompt version, token usage if available, and timestamps.
11. Handle timeout, rate limit, malformed output, missing images, and provider errors.
12. Add idempotency and cost/size limits; do not blindly retry paid inference.
13. Add mocked tests; live API calls are not required by default tests.
14. Document environment setup without committing secrets.

Statuses: NEW_DAMAGE, NO_CHANGE, INCONCLUSIVE.
Each finding: type, zone, location description, description, severity, confidence estimate (0–1, not calibrated), requires_human_review=true.

## Security
Anthropic key stays in Node.js backend environment. Frontend never calls Anthropic. Keep Storage private. Reject arbitrary URLs. Never log secrets, signed URLs, or image contents. Every finding requires human review.

## Acceptance criteria
- [ ] Claude is called only from Node.js backend.
- [ ] Same-vehicle/same-zone pairing is enforced.
- [ ] Private images are loaded securely from Supabase.
- [ ] Response is schema-validated before persistence.
- [ ] Inconclusive and provider-error states are distinct from success.
- [ ] Idempotency, cost limits, and mocked tests exist.
- [ ] Actual verification evidence is recorded.
