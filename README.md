# Rent Car AI

An AI-assisted vehicle inspection prototype. The MVP captures multiple vehicle views for a previous and a current inspection, stores the original photos in Supabase, and uses Claude Vision to identify visible changes between matching views.

## MVP scope

- One screen to select multiple vehicle shots for both the baseline (previous) and current inspection.
- Associate each photo with a predefined vehicle zone/shot type.
- Preview, remove, and replace selected photos.
- Store original images in a private Supabase Storage bucket.
- Store inspection, image, comparison, and analysis metadata in Supabase PostgreSQL.
- Compare matching baseline/current photos with Claude Vision.
- Return structured findings: new damage, no visible change, or inconclusive.
- Display findings with type, location description, severity, and confidence, with human review required.

## Technology direction

- Supabase PostgreSQL and private Supabase Storage.
- Supabase Edge Functions as the trusted server-side integration layer.
- Anthropic Claude Messages API with vision.
- No AWS services.
- No OpenCV or image enhancement in the first prototype.
- No background queue in the first synchronous proof of concept.

## AI agent workflow

Before changing code, read:

1. `AGENTS.md`
2. `PROJECT_CONTEXT.md`
3. `docs/architecture/MVP.md`
4. `TASKS.md` and the assigned task file.

Keep decisions, task status, verification evidence, and known limitations updated. Do not claim completion without running relevant checks.
