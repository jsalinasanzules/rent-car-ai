# Agent Instructions

These instructions apply to every AI coding agent working in this repository, including OpenCode and GitHub Copilot.

## Required context

At the start of a task, read:
1. `PROJECT_CONTEXT.md`
2. `docs/architecture/MVP.md`
3. `TASKS.md`
4. The assigned task file and its dependencies.

Inspect the actual repository, framework, scripts, dependencies, and conventions before changing implementation. Do not assume a framework or runtime that is not present.

## Product scope

- The MVP has one vehicle inspection comparison screen.
- The operator selects multiple vehicle shots for a previous (baseline) inspection and a current inspection.
- Compare only photos representing the same vehicle zone/shot type.
- The first AI implementation uses Anthropic Claude Vision through the Messages API.
- Supabase PostgreSQL stores metadata and results; Supabase Storage stores original images in a private bucket.
- Supabase Edge Functions are the trusted server-side boundary for Claude API calls.
- Do not use AWS.
- Do not add OpenCV, image enhancement, queues, PDF generation, partner webhooks, or a production multi-tenant billing system in this MVP.

## AI analysis rules

- Claude API calls must run server-side, never from browser code.
- Keep `ANTHROPIC_API_KEY` in Supabase Edge Function secrets. Never commit real secrets or expose them to the frontend.
- The browser sends application-owned image IDs/object references, never arbitrary external image URLs.
- The Edge Function validates the authenticated user's access to both inspections and all referenced images before generating short-lived access to private images.
- Use the configured Claude model via environment/configuration; do not scatter model identifiers through the codebase.
- Ask Claude to compare previous vs current photos of the same zone, ignore lighting/reflections/shadows/camera differences, and return `INCONCLUSIVE` when comparison is unreliable.
- Treat model confidence as an estimate, not a calibrated probability.
- Findings are suggestions for human review, not definitive insurance, safety, or repair decisions.
- Do not claim precise pixel-level localization or bounding boxes unless separately validated.
- Validate and parse model output against a strict application schema before storing or returning it.
- Handle provider timeouts, rate limits, malformed output, and errors without marking the comparison successful.

## Supabase and security rules

- Use a private Storage bucket.
- Use Row Level Security for database records and Storage policies.
- Never expose Supabase secret/service-role keys in browser bundles.
- Keep `ANTHROPIC_API_KEY` only in Edge Function secrets.
- Do not accept arbitrary external URLs from clients (avoid SSRF).
- Use application-owned IDs and object paths, and verify ownership on the server.
- Generate short-lived signed image URLs server-side only if using URL image sources with Claude.
- Validate MIME type, file size, image count, inspection ownership, and zone pairing.
- Preserve originals; do not destructively transform uploaded images.
- Avoid logging image data, secrets, signed URLs, or personal data.

## Engineering workflow

- Make small, reviewable changes and follow existing conventions.
- Work only on the assigned task and its dependencies.
- Do not add dependencies when existing platform functionality is sufficient.
- Ask before making costly or hard-to-reverse decisions.
- Update task files and `TASKS.md` as work progresses.
- Record commands run, actual test/build results, setup steps, and limitations.
- Do not commit or push unless the user explicitly asks.

## Definition of done

A task is complete only when its acceptance criteria are met, relevant checks have been run, security requirements are verified, and documentation reflects the actual implementation.
