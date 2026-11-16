# Agent Instructions

These instructions apply to OpenCode, GitHub Copilot, and other coding agents.

## Required context
At task start, read PROJECT_CONTEXT.md, MEMORY.md, docs/architecture/MVP.md, TASKS.md, and the assigned task. Inspect actual code and conventions before changes.

## Mandatory repository layout
- All frontend source, package manifests, Vite/TypeScript configuration, frontend assets, and frontend environment examples belong under `Fronted/` (exact spelling).
- All backend source, package manifests, Node/TypeScript configuration, backend migrations/seeds, backend tests, and backend environment examples belong under `Backend/`.
- Shared architecture/product documentation belongs under `docs/`.
- AI-agent instructions and persistent project context belong at repository root and under `.blueprint/`.
- Do not create frontend or backend implementation files at repository root.
- Do not move shared project documentation into either application directory.
- Preserve the exact folder names `Fronted` and `Backend`; do not silently rename them.

## Fixed architecture
- Frontend: React + TypeScript + Vite in `Fronted/`.
- Backend: separate Node.js + TypeScript HTTP API in `Backend/`.
- Database: Supabase PostgreSQL.
- Files: private Supabase Storage.
- AI: Anthropic Claude Vision.
- Supabase and Anthropic integrations are configured in the Node.js backend using environment variables.
- Browser communicates with the Node.js API. It must not use privileged Supabase credentials or call Anthropic directly.
- No AWS, Supabase Edge Functions, OpenCV, image enhancement, or queues in the first prototype.

## Environment and security
- Frontend variables: `Fronted/.env.example`; only public `VITE_API_BASE_URL`.
- Backend variables: `Backend/.env.example`; server-only PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL, CORS_ORIGIN.
- Never prefix secrets with VITE_ or expose them in browser bundles. Commit placeholders only, never credentials.
- Backend validates authorization, inspection ownership, image IDs, object paths, MIME type, size, and zone pairing. Use private Storage; reject arbitrary external URLs. Preserve originals. Never log credentials, signed URLs, image contents, or sensitive data.

## AI rules
Claude calls run only in Backend/. Compare baseline/current photos of the same vehicle zone. Ignore lighting, reflections, shadows, dirt, and camera differences. Return INCONCLUSIVE when comparison is unreliable. Validate model output against a strict schema. Confidence is not calibrated; findings require human review. Do not claim pixel-level localization or bounding boxes unless validated. Handle timeouts, rate limits, malformed output, and paid retries safely.

## Workflow
Make small reviewable changes. Work only on assigned tasks. Ask before costly decisions. Update TASKS.md, task files, and MEMORY.md. Record actual commands and test results; never invent verification. Do not commit or push unless explicitly asked.

## Definition of done
Acceptance criteria met, relevant checks actually run, security constraints verified, and documentation updated.
