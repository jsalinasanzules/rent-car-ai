# TASK-004 — Backend AI: Vision Comparison (Gemini + Claude)

**Status:** In Progress — Gemini and Claude provider adapters committed to feature branch; requires migration 003, Gemini key configuration and end-to-end verification  
**Priority:** High  
**Scope:** Node.js backend service + Google Gemini API (default) and optional Anthropic Messages API.

## Objective
Compare matching baseline/current image pairs with Claude Vision and persist structured potential damage findings.

## Work items
1. Implement AI comparison service inside Node.js + TypeScript backend.
2. Load AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL and optional Anthropic settings from validated server-side environment variables.
3. Expose protected API endpoint accepting application comparison/inspection IDs only.
4. Validate authorization and ownership of vehicle, inspections, and referenced images.
5. Load private image objects from Supabase Storage using server-side credentials.
6. Send each same-zone pair to the configured provider; Gemini is the default test provider and Claude remains optional. Label Image A baseline and Image B current.
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
- [x] Claude is called only from Node.js backend.
- [x] Same-vehicle/same-zone pairing is enforced.
- [x] Private images are loaded securely from Supabase.
- [x] Response is schema-validated before persistence.
- [x] Inconclusive and provider-error states are distinct from success.
- [x] Idempotency, cost limits, and schema tests exist.
- [ ] Actual verification evidence is recorded.

## Implementation notes
- `POST /api/comparisons` accepts only baseline/current inspection IDs; it never accepts arbitrary image URLs.
- `AI_PROVIDER=gemini` selects Gemini (default); `AI_PROVIDER=claude` selects the existing Anthropic adapter.
- Gemini model defaults to `gemini-2.5-flash-lite`; free-tier access and quotas are subject to Google's current terms. Do not send sensitive customer/vehicle images through the free tier without reviewing Google's data-use terms.
- The API checks same vehicle, inspection types, owner scope, matching zones, private bucket and expected object path.
- Up to five matching zones are analyzed per request; each image is limited to 7 MB for Claude.
- A unique baseline/current pair prevents paid duplicate inference. Failed runs are not automatically retried.
- Migration `003_claude_vision_comparisons.sql` adds model, prompt, token, error and per-zone result persistence.
- No live Anthropic request or local test/build command has been executed from this session. Apply migration 003, configure `GEMINI_API_KEY` for the default free-tier test (or Anthropic credentials for Claude), then run the documented checks and a real comparison.
