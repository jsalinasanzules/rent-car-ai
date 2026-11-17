-- Claude Vision comparison metadata and per-zone results.
alter table public.comparisons
  add column if not exists summary text,
  add column if not exists model text,
  add column if not exists prompt_version text,
  add column if not exists input_tokens integer not null default 0 check (input_tokens >= 0),
  add column if not exists output_tokens integer not null default 0 check (output_tokens >= 0),
  add column if not exists error_code text,
  add column if not exists started_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- A baseline/current pair is analyzed at most once. Failed comparisons are
-- intentionally not retried automatically because each inference is paid.
create unique index if not exists uq_comparisons_inspection_pair
  on public.comparisons (baseline_inspection_id, current_inspection_id);

create table if not exists public.comparison_zone_results (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  zone text not null,
  result text not null check (result in ('NEW_DAMAGE', 'NO_CHANGE', 'INCONCLUSIVE')),
  summary text not null,
  created_at timestamptz not null default now(),
  unique (comparison_id, zone)
);

create index if not exists idx_comparison_zone_results_comparison
  on public.comparison_zone_results(comparison_id);

alter table public.comparison_zone_results enable row level security;
-- No anon/authenticated policies: access remains through trusted service role.
