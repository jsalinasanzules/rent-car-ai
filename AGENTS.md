# Agent Instructions

These instructions apply to OpenCode, GitHub Copilot, and other coding agents.

## Required context
At task start, read PROJECT_CONTEXT.md, MEMORY.md, docs/architecture/MVP.md, TASKS.md, and the assigned task. Inspect actual code and conventions before changes.

## Fixed architecture
- Frontend: React + TypeScript + Vite.
- Backend: separate Node.js + TypeScript HTTP API.
- Database: Supabase PostgreSQL.
- Files: private Supabase Storage.
- AI: Anthropic Claude Vision.
- Supabase and Anthropic connections are made from the Node.js backend using environment variables.
- Browser communicates with the Node.js API. It must not use privileged Supabase credentials or call Anthropic directly.
- No AWS, Supabase Edge Functions, OpenCV, image enhancement, or queues in the first prototype.

## Backend environment and security
Expected server-only variables: PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL, CORS_ORIGIN. Validate required values at startup.
Frontend may expose VITE_API_BASE_URL only. Never prefix secrets with VITE_ or expose them in browser bundles. Commit placeholders only, never credentials.
Backend validates authorization, inspection ownership, image IDs, object paths, MIME type, size, and zone pairing. Use private Storage; reject arbitrary external URLs. Preserve originals. Never log credentials, signed URLs, image contents, or sensitive data.

## AI rules
Claude calls run only in Node.js. Compare baseline/current photos of the same vehicle zone. Ignore lighting, reflections, shadows, dirt, and camera differences. Return INCONCLUSIVE when comparison is unreliable. Validate model output against a strict schema. Confidence is not calibrated; findings require human review. Do not claim pixel-level localization or bounding boxes unless validated. Handle timeouts, rate limits, malformed output, and paid retries safely.

## Workflow
Make small reviewable changes. Work only on assigned tasks. Ask before costly decisions. Update TASKS.md, task files, and MEMORY.md. Record actual commands and test results; never invent verification. Do not commit or push unless explicitly asked.

## Definition of done
Acceptance criteria met, relevant checks actually run, security constraints verified, and documentation updated.
