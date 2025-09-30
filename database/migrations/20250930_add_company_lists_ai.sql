-- Lists a user can create and edit
create table if not exists company_lists (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Items inside a list
create table if not exists company_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references company_lists(id) on delete cascade,
  org_number text not null,
  note text,
  created_at timestamptz default now(),
  unique(list_id, org_number)
);

-- AI run metadata
create table if not exists company_ai_runs (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references company_lists(id) on delete cascade,
  analysis_kind text not null,
  params jsonb,
  status text not null default 'queued',
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid not null,
  created_at timestamptz default now()
);

-- Per-company findings for a run
create table if not exists company_ai_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references company_ai_runs(id) on delete cascade,
  org_number text not null,
  summary jsonb not null,
  sources jsonb not null,
  scores jsonb,
  created_at timestamptz default now(),
  unique(run_id, org_number)
);

