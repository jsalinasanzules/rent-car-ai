# Task Board

Current milestone: **Vehicle photo comparison prototype with Claude Vision**.

## Ready / blocked tasks

- [ ] **TASK-001 — Backend: Supabase data model, private Storage, and access policies** — Ready  
  Define inspections, vehicles, image metadata, comparisons, findings, private bucket, migrations, and security prerequisites.  
  Details: `.blueprint/tasks/TASK-001-backend-supabase.md`

- [ ] **TASK-002 — Frontend: one-screen baseline/current multi-photo selector** — Ready  
  Build one screen with previous/current inspection sections, multi-photo selection, zone assignment, previews, and comparison action.  
  Details: `.blueprint/tasks/TASK-002-frontend-photo-selector.md`

- [ ] **TASK-003 — Integration: authenticated Supabase uploads and metadata persistence** — Blocked until TASK-001 security prerequisites are approved  
  Upload original photos to private Storage and persist image/inspection metadata.  
  Details: `.blueprint/tasks/TASK-003-supabase-integration.md`

- [ ] **TASK-004 — Backend AI: Claude Vision comparison and structured findings** — Blocked until TASK-001 and TASK-003 are complete  
  Implement protected Supabase Edge Function, call Claude Vision for matching image pairs, validate and persist findings, and return comparison status.  
  Details: `.blueprint/tasks/TASK-004-claude-vision-comparison.md`

## Suggested execution order

1. Inspect repository and establish the minimal app structure/framework.
2. Implement TASK-002 as a local UI, using sample state before persistence.
3. Complete TASK-001 schema and private Storage/security design.
4. Complete TASK-003 authenticated upload and metadata persistence.
5. Complete TASK-004 Claude Vision comparison for matching baseline/current zone pairs.
6. Validate with a small labeled set of before/after images and document false positives/false negatives.

## Status rules

- Keep task status synchronized between this file and each individual task file.
- Use `Ready`, `In Progress`, `Blocked`, or `Done`.
- A task is not Done until acceptance criteria and verification evidence are recorded.
