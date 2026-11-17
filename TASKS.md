# Task Board

Current milestone: Vehicle photo comparison prototype.

- [x] TASK-001 — Backend: Node.js + TypeScript, Supabase data model and private Storage — Done (user confirmed end-to-end save and photo persistence). Details: .blueprint/tasks/TASK-001-backend-supabase.md
- [x] TASK-002 — Frontend: React + TypeScript multi-photo selector — Done (verification confirmed by user). Details: .blueprint/tasks/TASK-002-frontend-photo-selector.md
- [x] TASK-003 — Backend integration: persist vehicle details, inspections and photo uploads — Done (user confirmed records and photos are saved). Details: .blueprint/tasks/TASK-003-supabase-integration.md
- [ ] TASK-004 — Backend AI: Vision comparison (Gemini default, Claude optional) — In Progress (provider integration committed to feature branch; migration 003 and live verification pending). Details: .blueprint/tasks/TASK-004-claude-vision-comparison.md

## Directory rules
- Frontend implementation and configuration: `Fronted/`.
- Backend implementation and configuration: `Backend/`.
- Shared docs: `docs/`; task specifications: `.blueprint/tasks/`.
- No frontend/backend implementation files at repository root.

## Execution order
1. TASK-002 local frontend — complete.
2. TASK-001 backend foundation and ordered Supabase migrations — complete; save flow verified by user.
3. TASK-003 save vehicle details, both inspections, photos and metadata — complete; save flow verified by user.
4. TASK-004 AI Vision comparison API — Gemini is the default free-tier test provider; Claude remains optional; apply migration 003 and run a live test.
5. End-to-end validation with labeled before/after photo pairs.

Keep this board synchronized with individual tasks and MEMORY.md. Status values: Ready, In Progress, Blocked, Done. A task is Done only when acceptance criteria and verification evidence are recorded.
