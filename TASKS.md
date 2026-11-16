# Task Board

Current milestone: Vehicle photo comparison prototype.

- [ ] TASK-001 — Backend: Node.js + TypeScript, Supabase data model and private Storage — Ready. Details: .blueprint/tasks/TASK-001-backend-supabase.md
- [ ] TASK-002 — Frontend: React + TypeScript multi-photo selector — In Progress. Details: .blueprint/tasks/TASK-002-frontend-photo-selector.md
- [ ] TASK-003 — Backend integration: Node.js API for photo upload and metadata — Blocked until TASK-001. Details: .blueprint/tasks/TASK-003-supabase-integration.md
- [ ] TASK-004 — Backend AI: Claude Vision comparison — Blocked until TASK-001 and TASK-003. Details: .blueprint/tasks/TASK-004-claude-vision-comparison.md

## Execution order
1. TASK-002 local frontend (in progress).
2. TASK-001 Node.js backend foundation, Supabase schema, private Storage.
3. TASK-003 upload and metadata API.
4. TASK-004 Claude Vision comparison API.
5. End-to-end validation with labeled before/after photo pairs.

Keep this board synchronized with individual tasks and MEMORY.md. Status values: Ready, In Progress, Blocked, Done. A task is Done only when acceptance criteria and verification evidence are recorded.
