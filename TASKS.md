# Task Board

Current milestone: **Photo-selection prototype**.

## In progress / ready

- [ ] **TASK-001 — Backend: Supabase foundation and photo metadata**  
  Define the minimal database/storage foundation, private bucket, migrations, and access-policy requirements. Resolve authentication/tenant assumptions before enabling real uploads.  
  Details: `.blueprint/tasks/TASK-001-backend-supabase.md`

- [ ] **TASK-002 — Frontend: multi-photo vehicle shot selector**  
  Build one simple screen with a predefined shot selector, multi-file selection, previews, and remove/replace interactions.  
  Details: `.blueprint/tasks/TASK-002-frontend-photo-selector.md`

- [ ] **TASK-003 — Integration: connect selector to Supabase**  
  Upload originals to private Storage and persist metadata only after TASK-001 security prerequisites are satisfied.  
  Details: `.blueprint/tasks/TASK-003-supabase-integration.md`

## Suggested execution order

1. Start TASK-002 for a local UI prototype; it does not need credentials or a database.
2. In parallel or next, complete the schema and security design in TASK-001.
3. Complete TASK-003 only after the authentication/tenant model and RLS/Storage policies are approved and tested.

## Status rules

- Keep task status synchronized between this file and the individual task file.
- Use `Ready`, `In Progress`, `Blocked`, or `Done`.
- A task is not Done until its acceptance criteria and verification evidence are recorded.