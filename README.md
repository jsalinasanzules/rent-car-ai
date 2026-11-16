# Rent Car AI

An AI-assisted vehicle inspection platform. The first milestone is a focused photo-selection prototype; AI damage analysis is explicitly out of scope until the photo workflow is validated.

## MVP scope

- Provide a simple screen to select multiple photos of a vehicle.
- Classify each selected photo by a predefined vehicle view/shot.
- Preview selected photos and allow users to remove or replace them.
- Use Supabase PostgreSQL for metadata and Supabase Storage for image files.
- Keep the original image files unchanged.
- Do not use AWS for this MVP.

## Current technical direction

- Supabase Database (PostgreSQL)
- Supabase Storage (private bucket)
- Frontend framework and backend execution model: to be confirmed after inspecting the repository setup (the repository is currently empty).
- Claude Vision, image processing, background queues, and automated damage detection: later milestones, not part of the current implementation.

## Working with AI coding agents

Before changing code, read:

1. `AGENTS.md` — shared instructions for all coding agents.
2. `PROJECT_CONTEXT.md` — product scope and technical decisions.
3. `TASKS.md` and the linked task file — current work and acceptance criteria.

Keep these documents updated when decisions or task status change. Do not claim a task is complete without running the relevant checks and recording the evidence.