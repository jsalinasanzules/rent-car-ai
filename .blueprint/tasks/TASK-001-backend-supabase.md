# TASK-001 — Backend: Node.js + TypeScript and Supabase Foundation

**Status:** Ready  
**Priority:** High  
**Scope:** Node.js + TypeScript API, Supabase PostgreSQL, private Supabase Storage.

## Objective
Create the trusted backend foundation and connect to Supabase using server-side environment variables.

## Work items
1. Scaffold a separate Node.js + TypeScript backend application.
2. Select a minimal HTTP framework after reviewing needs; document the decision.
3. Load and validate environment variables at startup.
4. Configure Supabase server client using SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY; keep the key server-only.
5. Add .env.example with placeholders; never commit credentials.
6. Add migrations for vehicles, inspections, inspection_images, comparisons, and comparison_findings.
7. Create private Storage bucket vehicle-inspection-photos.
8. Define authorization, ownership, RLS, and Storage rules; no permissive anonymous access.
9. Add health endpoint and basic error handling.
10. Add tests for configuration, schema, and access boundaries.

## Expected backend variables
PORT, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, CLAUDE_MODEL, CORS_ORIGIN.
Frontend may use VITE_API_BASE_URL only. Never expose service-role or Anthropic keys through Vite variables.

## Acceptance criteria
- [ ] Node.js + TypeScript backend starts with validated environment configuration.
- [ ] Backend connects to Supabase using environment variables.
- [ ] Migrations and private bucket setup are reproducible.
- [ ] Ownership/security model is explicit and tested.
- [ ] No secrets are committed or sent to browser.
- [ ] No AWS or Supabase Edge Functions.
- [ ] Actual verification results are documented.

Authentication and tenant ownership must be agreed before real-user access policies are enabled.
