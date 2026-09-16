-- MLexpert initial schema draft.
-- RLS is enabled on tenant-owned tables. Policies are intentionally strict and must be expanded with authenticated role claims during implementation.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  country_code text not null,
  currency text not null check (currency in ('XOF', 'XAF')),
  created_at timestamptz not null default now()
);

create table if not exists fiscal_years (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  year integer not null,
  status text not null check (status in ('future', 'open', 'closed')),
  closed_at timestamptz,
  unique(company_id, year)
);

create table if not exists journals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  name text not null,
  unique(company_id, code)
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  code text not null,
  label text not null,
  is_standard boolean not null default false,
  parent_code text,
  unique(organization_id, code)
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  fiscal_year_id uuid not null references fiscal_years(id) on delete restrict,
  journal_id uuid not null references journals(id) on delete restrict,
  piece_number text not null,
  label text not null,
  status text not null check (status in ('draft', 'validated', 'reversed')) default 'draft',
  validated_at timestamptz,
  reversal_of_entry_id uuid references entries(id),
  created_at timestamptz not null default now(),
  unique(company_id, fiscal_year_id, journal_id, piece_number)
);

create table if not exists entry_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete restrict,
  label text not null,
  debit numeric(18,2) not null default 0 check (debit >= 0),
  credit numeric(18,2) not null default 0 check (credit >= 0),
  check ((debit > 0 and credit = 0) or (credit > 0 and debit = 0))
);

alter table organizations enable row level security;
alter table companies enable row level security;
alter table fiscal_years enable row level security;
alter table journals enable row level security;
alter table accounts enable row level security;
alter table entries enable row level security;
alter table entry_lines enable row level security;
