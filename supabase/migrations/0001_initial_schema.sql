-- MLexpert initial schema draft.
-- RLS is enabled on tenant-owned tables. Policies are intentionally strict and must be expanded with authenticated role claims during implementation.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner', 'admin', 'accountant', 'reader')),
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

create table if not exists subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  max_companies integer not null,
  max_users integer not null
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  plan_id uuid references subscription_plans(id),
  status text not null check (status in ('trial', 'active', 'grace', 'suspended', 'terminated')),
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists subscription_status_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid,
  reason text not null,
  effective_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  country_code text not null,
  currency text not null check (currency in ('XOF', 'XAF')),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists company_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null,
  permissions text[] not null default array['state:read'],
  created_at timestamptz not null default now(),
  unique(company_id, user_id)
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
alter table organization_members enable row level security;
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;
alter table subscription_status_history enable row level security;
alter table companies enable row level security;
alter table company_members enable row level security;
alter table fiscal_years enable row level security;
alter table journals enable row level security;
alter table accounts enable row level security;
alter table entries enable row level security;
alter table entry_lines enable row level security;

create or replace function current_user_is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.disabled_at is null
  );
$$;

create or replace function current_user_is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
      and membership.disabled_at is null
  );
$$;

create or replace function current_user_can_access_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from companies company
    join organization_members membership
      on membership.organization_id = company.organization_id
     and membership.user_id = auth.uid()
     and membership.disabled_at is null
    where company.id = target_company_id
      and (
        membership.role in ('owner', 'admin')
        or exists (
          select 1
          from company_members access
          where access.company_id = company.id
            and access.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function current_organization_accepts_mutations(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select subscription.status in ('trial', 'active', 'grace')
      from subscriptions subscription
      where subscription.organization_id = target_organization_id
      order by subscription.effective_at desc, subscription.created_at desc
      limit 1
    ),
    false
  );
$$;

create policy "members can read their organizations"
  on organizations for select
  using (current_user_is_org_member(id));

create policy "members can read organization memberships"
  on organization_members for select
  using (current_user_is_org_member(organization_id));

create policy "admins can manage organization memberships"
  on organization_members for all
  using (current_user_is_org_admin(organization_id))
  with check (current_user_is_org_admin(organization_id));

create policy "authenticated users can read subscription plans"
  on subscription_plans for select
  to authenticated
  using (true);

create policy "members can read their subscriptions"
  on subscriptions for select
  using (current_user_is_org_member(organization_id));

create policy "admins can manage their subscriptions"
  on subscriptions for all
  using (current_user_is_org_admin(organization_id))
  with check (current_user_is_org_admin(organization_id));

create policy "members can read subscription status history"
  on subscription_status_history for select
  using (
    exists (
      select 1
      from subscriptions subscription
      where subscription.id = subscription_status_history.subscription_id
        and current_user_is_org_member(subscription.organization_id)
    )
  );

create policy "authorized users can read assigned companies"
  on companies for select
  using (current_user_can_access_company(id));

create policy "admins can manage companies in their cabinet"
  on companies for all
  using (
    current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  )
  with check (
    current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  );

create policy "members can read company assignments"
  on company_members for select
  using (current_user_is_org_member(organization_id));

create policy "admins can manage company assignments"
  on company_members for all
  using (
    current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  )
  with check (
    current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  );

create policy "authorized users can read fiscal years"
  on fiscal_years for select
  using (current_user_can_access_company(company_id));

create policy "admins can manage fiscal years"
  on fiscal_years for all
  using (
    current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  )
  with check (
    current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  );

create policy "authorized users can read journals"
  on journals for select
  using (current_user_can_access_company(company_id));

create policy "admins can manage journals"
  on journals for all
  using (
    current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  )
  with check (
    current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  );

create policy "members can read accounts in their cabinet"
  on accounts for select
  using (organization_id is null or current_user_is_org_member(organization_id));

create policy "admins can manage accounts in their cabinet"
  on accounts for all
  using (
    organization_id is not null
    and current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  )
  with check (
    organization_id is not null
    and current_user_is_org_admin(organization_id)
    and current_organization_accepts_mutations(organization_id)
  );

create policy "authorized users can read entries"
  on entries for select
  using (current_user_can_access_company(company_id));

create policy "authorized users can create draft entries"
  on entries for insert
  with check (
    status = 'draft'
    and current_organization_accepts_mutations(organization_id)
    and current_user_can_access_company(company_id)
  );

create policy "authorized users can update draft entries"
  on entries for update
  using (
    status = 'draft'
    and current_organization_accepts_mutations(organization_id)
    and current_user_can_access_company(company_id)
  )
  with check (
    status = 'draft'
    and current_organization_accepts_mutations(organization_id)
    and current_user_can_access_company(company_id)
  );

create policy "authorized users can read entry lines"
  on entry_lines for select
  using (
    exists (
      select 1
      from entries entry
      where entry.id = entry_lines.entry_id
        and current_user_can_access_company(entry.company_id)
    )
  );

create policy "authorized users can manage draft entry lines"
  on entry_lines for all
  using (
    exists (
      select 1
      from entries entry
      where entry.id = entry_lines.entry_id
        and entry.status = 'draft'
        and current_organization_accepts_mutations(entry.organization_id)
        and current_user_can_access_company(entry.company_id)
    )
  )
  with check (
    exists (
      select 1
      from entries entry
      where entry.id = entry_lines.entry_id
        and entry.status = 'draft'
        and current_organization_accepts_mutations(entry.organization_id)
        and current_user_can_access_company(entry.company_id)
    )
  );
