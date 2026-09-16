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

  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon noinherit;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role noinherit bypassrls;
  end if;
end
$$;

\i supabase/migrations/0001_initial_schema.sql

grant usage on schema public, auth, storage to authenticated, anon, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, anon, service_role;
grant select, insert, update, delete on all tables in schema storage to authenticated, anon, service_role;
grant execute on all functions in schema public to authenticated, anon, service_role;
grant execute on function auth.uid() to authenticated, anon, service_role;

insert into organizations (id, name) values
  ('00000000-0000-0000-0000-00000000000a', 'Cabinet A'),
  ('00000000-0000-0000-0000-00000000000b', 'Cabinet B');

insert into organization_members (organization_id, user_id, role) values
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000002', 'accountant'),
  ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000003', 'reader'),
  ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000004', 'owner'),
  ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000005', 'reader'),
  ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000006', 'accountant');

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
  ),
  (
    '00000000-0000-0000-0000-00000000000b',
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000005',
    array['state:read', 'export:create']
  ),
  (
    '00000000-0000-0000-0000-00000000000b',
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000006',
    array['entry:create', 'entry:update', 'entry:validate', 'attachment:create', 'attachment:delete', 'attachment:read', 'state:read', 'export:create']
  );

insert into fiscal_years (id, organization_id, company_id, year, status) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001', 2026, 'open'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000003', 2026, 'open');

insert into journals (id, organization_id, company_id, code, name) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001', 'OD', 'Opérations diverses'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000003', 'OD', 'Opérations diverses');

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

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', false);

do $$
declare
  visible_companies text[];
  visible_assignments int;
begin
  select coalesce(array_agg(name order by name), array[]::text[])
    into visible_companies
    from companies;

  if visible_companies <> array['Gamma SARL'] then
    raise exception 'RLS leak: reader saw %, expected only Gamma SARL', visible_companies;
  end if;

  select count(*) into visible_assignments from company_members;

  if visible_assignments <> 1 then
    raise exception 'RLS leak: reader saw % company assignments, expected only their own assignment', visible_assignments;
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
      '00000000-0000-0000-0000-00000000000b',
      '20000000-0000-0000-0000-000000000003',
      '40000000-0000-0000-0000-000000000002',
      '50000000-0000-0000-0000-000000000002',
      'READ-001',
      'Reader should not create entries',
      'draft'
    );

    raise exception 'RLS leak: reader read-only assignment accepted an entry insert';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;


select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000006', false);

insert into entries (
  id,
  organization_id,
  company_id,
  fiscal_year_id,
  journal_id,
  piece_number,
  label,
  status
) values (
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-00000000000b',
  '20000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000002',
  '50000000-0000-0000-0000-000000000002',
  'ATT-001',
  'Entry with private attachment',
  'draft'
);

insert into storage.objects (bucket_id, name, owner_id, metadata) values (
  'entry-attachments',
  '00000000-0000-0000-0000-00000000000b/20000000-0000-0000-0000-000000000003/60000000-0000-0000-0000-000000000001/70000000-0000-0000-0000-000000000001/facture.pdf',
  '10000000-0000-0000-0000-000000000006',
  '{"mimetype":"application/pdf"}'::jsonb
);

insert into entry_attachments (
  id,
  organization_id,
  company_id,
  entry_id,
  storage_path,
  original_filename,
  mime_type,
  size_bytes,
  uploaded_by
) values (
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-00000000000b',
  '20000000-0000-0000-0000-000000000003',
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-00000000000b/20000000-0000-0000-0000-000000000003/60000000-0000-0000-0000-000000000001/70000000-0000-0000-0000-000000000001/facture.pdf',
  'facture.pdf',
  'application/pdf',
  2048,
  '10000000-0000-0000-0000-000000000006'
);

insert into attachment_audit_events (
  organization_id,
  company_id,
  entry_id,
  attachment_id,
  actor_user_id,
  action
) values (
  '00000000-0000-0000-0000-00000000000b',
  '20000000-0000-0000-0000-000000000003',
  '60000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000006',
  'uploaded'
);

insert into imports (
  id,
  organization_id,
  company_id,
  source_filename,
  status,
  rows_total,
  rows_imported,
  imported_by
) values (
  '80000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-00000000000b',
  '20000000-0000-0000-0000-000000000003',
  'brouillard.xlsx',
  'imported',
  12,
  12,
  '10000000-0000-0000-0000-000000000006'
);

insert into audit_logs (
  id,
  organization_id,
  company_id,
  actor_user_id,
  action,
  entity_type,
  entity_id
) values (
  '90000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-00000000000b',
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000006',
  'import.created',
  'import',
  '80000000-0000-0000-0000-000000000001'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', false);

do $$
declare
  visible_attachments int;
  visible_objects int;
  visible_imports int;
  visible_audit_logs int;
begin
  select count(*) into visible_attachments from entry_attachments;
  select count(*) into visible_objects from storage.objects where bucket_id = 'entry-attachments';
  select count(*) into visible_imports from imports;
  select count(*) into visible_audit_logs from audit_logs;

  if visible_attachments <> 1 or visible_objects <> 1 then
    raise exception 'RLS leak: reader expected one attachment/object, saw attachments %, objects %', visible_attachments, visible_objects;
  end if;

  if visible_imports <> 1 or visible_audit_logs <> 1 then
    raise exception 'RLS leak: reader expected one import/audit log, saw imports %, audit logs %', visible_imports, visible_audit_logs;
  end if;

  begin
    insert into entry_attachments (
      organization_id,
      company_id,
      entry_id,
      storage_path,
      original_filename,
      mime_type,
      size_bytes,
      uploaded_by
    ) values (
      '00000000-0000-0000-0000-00000000000b',
      '20000000-0000-0000-0000-000000000003',
      '60000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-00000000000b/20000000-0000-0000-0000-000000000003/60000000-0000-0000-0000-000000000001/70000000-0000-0000-0000-000000000099/blocked.pdf',
      'blocked.pdf',
      'application/pdf',
      2048,
      '10000000-0000-0000-0000-000000000005'
    );

    raise exception 'RLS leak: reader created an attachment without attachment:create';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;

reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);

do $$
declare
  visible_companies int;
begin
  select count(*) into visible_companies from companies;

  if visible_companies <> 0 then
    raise exception 'RLS leak: anon saw % companies, expected 0', visible_companies;
  end if;

  begin
    insert into organizations (name) values ('Anon Cabinet');
    raise exception 'RLS leak: anon inserted an organization';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;

reset role;
set role service_role;

do $$
declare
  visible_companies int;
begin
  select count(*) into visible_companies from companies;

  if visible_companies <> 3 then
    raise exception 'Service role expected to bypass RLS and see 3 companies, saw %', visible_companies;
  end if;
end
$$;

reset role;
