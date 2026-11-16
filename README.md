# Rent Car AI

AI-assisted vehicle inspection prototype. Operators select matching vehicle views from previous and current inspections; the backend stores photos in Supabase and uses Claude Vision to identify potential new visible damage.

## Repository structure
- `Fronted/`: React + TypeScript + Vite application. The directory name is intentionally `Fronted` as requested.
- `Backend/`: Node.js + TypeScript API and Supabase integration (to be implemented).
- `docs/`: shared architecture and project documentation.
- `.blueprint/`: task definitions and AI-agent project specifications.

## Technology
- Frontend: React + TypeScript + Vite.
- Backend: Node.js + TypeScript.
- Database: Supabase PostgreSQL.
- Image storage: private Supabase Storage bucket.
- AI: Anthropic Claude Vision, called only by the backend.
- Supabase and Anthropic connections: backend environment variables.
- No AWS, Supabase Edge Functions, OpenCV, image enhancement, or queue in the first prototype.

## Run frontend
```bash
cd Fronted
npm install
npm run dev
```

Frontend environment: copy `Fronted/.env.example` to `Fronted/.env` and set `VITE_API_BASE_URL` when the API is available. No server secrets belong in frontend environment variables.

## Backend
Backend source, package manifest, and server-only `.env.example` must live under `Backend/`. Do not place backend source under the frontend directory or at repository root.

## AI agent workflow
Before changing code, read `AGENTS.md`, `PROJECT_CONTEXT.md`, `MEMORY.md`, `docs/architecture/MVP.md`, `TASKS.md`, and the assigned task file. Keep decisions, status, and actual verification evidence updated.
