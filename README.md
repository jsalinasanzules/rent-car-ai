# Rent Car AI

AI-assisted vehicle inspection prototype. Operators select matching vehicle views from a previous and current inspection; the backend stores photos in Supabase and uses Claude Vision to identify potential new visible damage.

## Technology stack
- Frontend: React + TypeScript + Vite.
- Backend: Node.js + TypeScript (separate API application).
- Database: Supabase PostgreSQL.
- Image storage: private Supabase Storage bucket.
- AI: Anthropic Claude Vision, called only by the Node.js backend.
- Supabase and Anthropic connections: backend environment variables.
- No AWS, Supabase Edge Functions, OpenCV, image enhancement, or queue in the first prototype.

## Frontend
Run npm install, then npm run dev. The initial screen supports local photo selection and preview for baseline/current inspections. Upload and comparison remain disabled until backend integration exists.

## AI agent workflow
Before changing code, read AGENTS.md, PROJECT_CONTEXT.md, MEMORY.md, docs/architecture/MVP.md, TASKS.md, and the assigned task file. Keep decisions, status, and actual verification evidence updated.
