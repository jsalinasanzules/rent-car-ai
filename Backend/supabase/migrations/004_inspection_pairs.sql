-- Preserve the baseline/current relationship independently of AI analysis.
-- This allows the application to restore both inspections even when no AI
-- comparison has been run yet.
create table if not exists public.inspection_pairs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid null,
  baseline_inspection_id uuid not null references public.inspections(id) on delete cascade,
  current_inspection_id uuid not null unique references public.inspections(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint inspection_pairs_distinct_inspections check (baseline_inspection_id <> current_inspection_id)
);

create index if not exists idx_inspection_pairs_baseline
  on public.inspection_pairs(baseline_inspection_id, created_at desc);

create unique index if not exists uq_inspection_pairs_current
  on public.inspection_pairs(current_inspection_id);

create index if not exists idx_inspection_pairs_current
  on public.inspection_pairs(current_inspection_id);

alter table public.inspection_pairs enable row level security;
-- Access remains through the trusted backend service role.

-- Backfill pairs for historical records that already have an AI comparison.
insert into public.inspection_pairs (owner_id, baseline_inspection_id, current_inspection_id)
select owner_id, baseline_inspection_id, current_inspection_id
from public.comparisons
on conflict (current_inspection_id) do nothing;
