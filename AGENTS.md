# Agent Instructions

These instructions apply to every AI coding agent working in this repository, including OpenCode and GitHub Copilot.

## Required context

At the start of a task:

1. Read `PROJECT_CONTEXT.md`.
2. Read `docs/architecture/MVP.md`.
3. Read `TASKS.md` and the specific task file assigned.
4. Inspect the current repository and its actual framework, scripts, dependencies, and conventions before proposing or changing implementation.

Do not assume a framework, runtime, folder structure, authentication system, or deployment provider that is not present in the repository.

## Project boundaries

- The current milestone is a vehicle photo-selection prototype.
- Supabase is the selected provider for PostgreSQL and object storage.
- Do not add AWS services or AWS dependencies.
- Do not implement Claude/LLM calls, damage detection, OpenCV, image enhancement, queues, webhooks, PDF reports, or comparison algorithms in this milestone.
- Preserve original uploaded images. Do not apply destructive transformations.
- A user must be able to select multiple vehicle shots in one inspection workflow.
- Use a controlled catalogue of shot types; avoid free-form labels where a predefined option is appropriate.

## Engineering rules

- Prefer small, reviewable changes that follow existing project conventions.
- Do not add dependencies when platform or existing project functionality is sufficient.
- Never commit secrets, service-role keys, API keys, access tokens, or populated environment files.
- Use environment variable examples with placeholders only.
- The Supabase service-role key must never be exposed to browser code.
- Use a private Storage bucket and enforce access through Supabase policies. Never make inspection images public merely to simplify development.
- Validate file type and size on the client for usability and enforce security-sensitive validation at the trusted boundary.
- Do not accept arbitrary external image URLs from clients. Use storage object paths/IDs owned by the application.
- Avoid logging image contents, credentials, signed URLs, or personal data.
- Do not invent successful test results. Run checks and report their actual outcome.

## Task workflow

- Work only on the requested task and its dependencies.
- Read the full acceptance criteria before coding.
- If a required product or architecture decision is missing, document the uncertainty and ask before making a costly or hard-to-reverse choice.
- Update the task file and `TASKS.md` when work is completed or blocked.
- Record implementation notes, commands executed, test results, and remaining limitations.
- Do not mark a task complete while acceptance criteria remain unmet.
- Do not commit or push unless the user explicitly asks.

## Definition of done

A task is complete only when:
- Its acceptance criteria are met.
- Relevant tests, linting, type checks, or build checks have been run where available.
- Any required Supabase SQL/migrations are included in version control.
- Documentation and task status reflect the actual implementation.
- Remaining risks or manual setup steps are documented.