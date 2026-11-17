# Task Board

Current milestone: Vehicle photo comparison prototype.

- [ ] TASK-001 — Backend: Node.js + TypeScript, Supabase data model and private Storage — In Progress. Details: .blueprint/tasks/TASK-001-backend-supabase.md
- [x] TASK-002 — Frontend: React + TypeScript multi-photo selector — Done (verification confirmed by user). Details: .blueprint/tasks/TASK-002-frontend-photo-selector.md
- [ ] TASK-003 — Backend integration: Node.js API for photo upload and metadata — Blocked until TASK-001 security gates are complete. Details: .blueprint/tasks/TASK-003-supabase-integration.md
- [ ] TASK-004 — Backend AI: Claude Vision comparison — Blocked until TASK-001 and TASK-003. Details: .blueprint/tasks/TASK-004-claude-vision-comparison.md

## Directory rules
- Frontend implementation and configuration: `Fronted/`.
- Backend implementation and configuration: `Backend/`.
- Shared docs: `docs/`; task specifications: `.blueprint/tasks/`.
- No frontend/backend implementation files at repository root.

## Execution order
1. TASK-002 local frontend — complete.
2. TASK-001 Node.js backend foundation, Supabase schema, private Storage — in progress.
3. TASK-003 upload and metadata API — starts after TASK-001 security gates.
4. TASK-004 Claude Vision comparison API.
5. End-to-end validation with labeled before/after photo pairs.

Keep this board synchronized with individual tasks and MEMORY.md. Status values: Ready, In Progress, Blocked, Done. A task is Done only when acceptance criteria and verification evidence are recorded.
