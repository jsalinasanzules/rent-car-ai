-- Rent Car AI initial schema.
-- RLS is enabled on every application table. Authenticated users can access
-- only rows whose owner_id matches auth.uid(); anon has no table policies.
-- Composite foreign keys prevent linking a row to another owner's parent.
-- The Node API uses the service role, which bypasses RLS, so every API
-- operation MUST independently authenticate the caller and enforce ownership.

create extension if not exists pgcrypto;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  make text,
  model text,
  model_year integer check (model_year is null or model_year between 1886 and 2100),
  license_plate text,
  vin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null,
  inspection_type text not null check (inspection_type in ('BASELINE', 'CURRENT')),
  inspected_at timestamptz not null default now(),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'COMPLETED')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (vehicle_id, owner_id)
    references public.vehicles(id, owner_id) on delete cascade
);

create table if not exists public.inspection_images (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  inspection_id uuid not null,
  zone text not null check (zone in (
    'front', 'rear', 'left-side', 'right-side',
    'front-left-corner', 'front-right-corner',
    'rear-left-corner', 'rear-right-corner',
    'interior', 'dashboard-odometer', 'other-detail'
  )),
  storage_bucket text not null default 'vehicle-inspection-photos',
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 12582912),
  created_at timestamptz not null default now(),
  unique (inspection_id, zone),
  foreign key (inspection_id, owner_id)
    references public.inspections(id, owner_id) on delete cascade
);

create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  baseline_inspection_id uuid not null,
  current_inspection_id uuid not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'COMPLETED', 'FAILED')),
  overall_result text check (overall_result is null or overall_result in ('NEW_DAMAGE', 'NO_CHANGE', 'INCONCLUSIVE')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (id, owner_id),
  check (baseline_inspection_id <> current_inspection_id),
  foreign key (baseline_inspection_id, owner_id)
    references public.inspections(id, owner_id) on delete cascade,
  foreign key (current_inspection_id, owner_id)
    references public.inspections(id, owner_id) on delete cascade
);

create table if not exists public.comparison_findings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  comparison_id uuid not null,
  zone text not null,
  finding_type text not null,
  location_description text,
  description text not null,
  severity text not null default 'UNKNOWN' check (severity in ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN')),
  confidence numeric(4,3) check (confidence is null or confidence between 0 and 1),
  requires_human_review boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (comparison_id, owner_id)
    references public.comparisons(id, owner_id) on delete cascade
);

create index if not exists idx_vehicles_owner on public.vehicles(owner_id);
create index if not exists idx_inspections_owner_vehicle on public.inspections(owner_id, vehicle_id);
create index if not exists idx_images_owner_inspection on public.inspection_images(owner_id, inspection_id);
create index if not exists idx_comparisons_owner on public.comparisons(owner_id);
create index if not exists idx_findings_owner_comparison on public.comparison_findings(owner_id, comparison_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at before update on public.vehicles
for each row execute function public.set_updated_at();

drop trigger if exists set_inspections_updated_at on public.inspections;
create trigger set_inspections_updated_at before update on public.inspections
for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;
alter table public.inspections enable row level security;
alter table public.inspection_images enable row level security;
alter table public.comparisons enable row level security;
alter table public.comparison_findings enable row level security;

drop policy if exists "owners manage vehicles" on public.vehicles;
create policy "owners manage vehicles" on public.vehicles
for all to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "owners manage inspections" on public.inspections;
create policy "owners manage inspections" on public.inspections
for all to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "owners manage inspection images" on public.inspection_images;
create policy "owners manage inspection images" on public.inspection_images
for all to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "owners manage comparisons" on public.comparisons;
create policy "owners manage comparisons" on public.comparisons
for all to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "owners manage comparison findings" on public.comparison_findings;
create policy "owners manage comparison findings" on public.comparison_findings
for all to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

-- Private bucket. Files are accessed through the trusted Node API using
-- service credentials; there are no anonymous storage policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-inspection-photos',
  'vehicle-inspection-photos',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 12582912,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "authenticated owners read own vehicle photos" on storage.objects;
create policy "authenticated owners read own vehicle photos" on storage.objects
for select to authenticated
using (
  bucket_id = 'vehicle-inspection-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "authenticated owners upload own vehicle photos" on storage.objects;
create policy "authenticated owners upload own vehicle photos" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'vehicle-inspection-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "authenticated owners update own vehicle photos" on storage.objects;
create policy "authenticated owners update own vehicle photos" on storage.objects
for update to authenticated
using (
  bucket_id = 'vehicle-inspection-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'vehicle-inspection-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "authenticated owners delete own vehicle photos" on storage.objects;
create policy "authenticated owners delete own vehicle photos" on storage.objects
for delete to authenticated
using (
  bucket_id = 'vehicle-inspection-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
