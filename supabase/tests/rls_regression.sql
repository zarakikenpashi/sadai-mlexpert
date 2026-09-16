\set ON_ERROR_STOP on

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated noinherit;
  end if;
end
$$;

\i supabase/migrations/0001_initial_schema.sql

grant usage on schema public, auth to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
grant execute on function auth.uid() to authenticated;

insert into organizations (id, name) values
  ('00000000-0000-0000-0000-00000000000a', 'Cabinet A'),
  ('00000000-0000-0000-0000-00000000000b', 'Cabinet B');

insert into organization_members (organization_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000002', 'accountant'),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000003', 'reader'),
  ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000004', 'owner');

insert into subscriptions (id, organization_id, status) values
  ('30000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'suspended'),
  ('30000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'active');

insert into companies (id, organization_id, name, country_code, currency) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Alpha SA', 'CI', 'XOF'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'Beta SARL', 'CI', 'XOF'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000b', 'Gamma SARL', 'SN', 'XOF');

insert into company_members (organization_id, company_id, user_id, permissions) values
  (
    '00000000-0000-0000-0000-00000000000a',
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    array['entry:create', 'entry:validate', 'state:read', 'export:create']
  );

insert into fiscal_years (id, organization_id, company_id, year, status) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001', 2026, 'open');

insert into journals (id, organization_id, company_id, code, name) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001', 'OD', 'Opérations diverses');

set role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', false);

do $$
declare
  visible_companies text[];
begin
  select coalesce(array_agg(name order by name), array[]::text[])
    into visible_companies
    from companies;

  if visible_companies <> array['Alpha SA'] then
    raise exception 'RLS leak: accountant saw %, expected only Alpha SA', visible_companies;
  end if;
end
$$;

do $$
begin
  begin
    insert into entries (
      organization_id,
      company_id,
      fiscal_year_id,
      journal_id,
      piece_number,
      label,
      status
    ) values (
      '00000000-0000-0000-0000-00000000000a',
      '20000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      '50000000-0000-0000-0000-000000000001',
      'SUSP-001',
      'Should be blocked while subscription is suspended',
      'draft'
    );

    raise exception 'RLS leak: suspended subscription accepted an entry insert';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;

reset role;
