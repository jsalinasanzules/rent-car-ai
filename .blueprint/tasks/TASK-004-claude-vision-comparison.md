# TASK-004 — Backend AI: Claude Vision Comparison

**Status:** Blocked until TASK-001 and TASK-003 are complete  
**Priority:** High  
**Scope:** Supabase Edge Function + Anthropic Messages API.

## Objective

Compare each matching baseline/current vehicle-zone photo pair with Claude Vision and persist structured potential damage findings.

## Work items

1. Inspect current Supabase Edge Function conventions and repository runtime before implementation.
2. Create a protected Edge Function (suggested name: `compare-inspections`).
3. Require an authenticated user and verify access to the vehicle, both inspections, and every referenced image.
4. Accept an application comparison ID or inspection IDs; never accept arbitrary image URLs or raw image bytes from the browser.
5. Load image object paths from trusted database records and retrieve the private Storage objects server-side.
6. Call Anthropic Messages API using `ANTHROPIC_API_KEY` and configurable `CLAUDE_MODEL`.
7. Send each baseline/current image pair together, with explicit labels and zone metadata.
8. Prompt Claude to identify only visible new changes; ignore lighting, reflections, shadows, dirt, and camera-angle differences; return `INCONCLUSIVE` if the pair cannot be reliably compared.
9. Require structured JSON output and validate it against a strict schema before persistence.
10. Persist overall status, per-zone status, findings, provider model, prompt version, token usage (if available), and timestamps.
11. Handle timeouts, rate limits, malformed output, missing images, and provider failures; do not mark failed/inconclusive requests as completed damage detections.
12. Add idempotency protection so repeated requests do not create duplicate findings or trigger unintended duplicate paid inference.
13. Add unit/integration tests using mocked Anthropic responses and representative image-pair fixtures. Do not require live API calls in the default test suite.
14. Document how to configure `ANTHROPIC_API_KEY` and `CLAUDE_MODEL` as Supabase Edge Function secrets. Never commit actual secret values.

## Prompt requirements

- Image A is always the previous/baseline inspection.
- Image B is always the current inspection.
- Compare the same vehicle zone only.
- Report potential scratches, dents, cracks, broken/missing parts, paint damage, and other clearly visible changes.
- Distinguish pre-existing damage from newly visible damage.
- Do not infer damage from a difference caused only by lighting, reflections, shadows, dirt, focus, or camera position.
- If images differ substantially in framing, angle, quality, or coverage, return `INCONCLUSIVE`.
- Do not invent exact dimensions or pixel-level bounding boxes.
- Treat confidence as an uncalibrated model estimate.
- Every finding must require human review.

## Suggested response contract

```json
{
  "status": "NEW_DAMAGE | NO_CHANGE | INCONCLUSIVE",
  "summary": "Short plain-language summary",
  "zones": [
    {
      "zone": "front_left_corner",
      "status": "NEW_DAMAGE | NO_CHANGE | INCONCLUSIVE",
      "reason": "Why this result was returned",
      "findings": [
        {
          "type": "SCRATCH | DENT | CRACK | BROKEN_PART | MISSING_PART | PAINT_DAMAGE | OTHER",
          "location_description": "Visible location on the vehicle",
          "description": "Description of the difference between the two inspections",
          "severity": "LOW | MEDIUM | HIGH | UNKNOWN",
          "confidence": 0.0,
          "requires_human_review": true
        }
      ]
    }
  ]
}
```

The example is a contract, not a claim that Claude can reliably detect every defect. Validate and normalize the model output before saving.

## Security and cost controls

- Claude API key exists only in Supabase Edge Function secrets.
- The browser never calls Anthropic directly.
- Never make the Storage bucket public for Claude access.
- Use short-lived signed URLs generated server-side or fetch private objects server-side and send base64 image blocks.
- Never log signed URLs, image contents, API keys, or sensitive provider payloads.
- Set explicit maximum images per comparison, image byte size, output tokens, and request timeout.
- Start with synchronous processing for a small number of pairs; document when a queue/background worker becomes necessary.
- Avoid automatic retries of paid inference without idempotency and clear user feedback.

## Acceptance criteria

- [ ] Edge Function requires authentication and validates ownership of both inspections and their images.
- [ ] Only same-vehicle, same-zone baseline/current pairs are sent to Claude.
- [ ] Private Storage images are accessed server-side without public bucket access.
- [ ] Anthropic credentials are stored only as Supabase Edge Function secrets.
- [ ] Claude receives explicit baseline/current labels.
- [ ] Response is schema-validated before persistence.
- [ ] `NEW_DAMAGE`, `NO_CHANGE`, and `INCONCLUSIVE` are represented distinctly.
- [ ] Findings include type, zone, location description, severity, confidence estimate, and human-review flag.
- [ ] Provider errors, timeouts, and rate limits are handled without false success.
- [ ] Idempotency and cost/size limits are implemented.
- [ ] Tests cover valid output, malformed output, inconclusive pairs, provider errors, and access denial.
- [ ] Actual verification evidence and manual Supabase setup steps are documented.

## Verification evidence

_To be completed by the implementing agent._

## Dependencies / blockers

- TASK-001: schema, private bucket, authentication and policies.
- TASK-003: authenticated photo uploads and metadata.
- A Claude API account/key and selected model are required for live inference; mocked tests must work without them.
