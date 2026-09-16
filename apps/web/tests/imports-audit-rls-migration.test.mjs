import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const migration = readFileSync(resolve(process.cwd(), '../../supabase/migrations/0001_initial_schema.sql'), 'utf8');

test('imports and generic audit logs are tenant-owned and protected by RLS', () => {
  for (const table of ['imports', 'audit_logs']) {
    assert.match(migration, new RegExp(`create table if not exists ${table}`));
    assert.match(migration, new RegExp(`alter table ${table} enable row level security`));
  }

  assert.match(migration, /organization_id uuid not null references organizations\(id\) on delete cascade/);
  assert.match(migration, /company_id uuid references companies\(id\) on delete set null/);
  assert.match(migration, /imported_by uuid not null/);
  assert.match(migration, /actor_user_id uuid not null/);
});

test('import and audit policies never expose another cabinet', () => {
  assert.match(migration, /create policy "authorized users can read company imports"/);
  assert.match(migration, /current_user_can_access_company\(company_id\)/);
  assert.match(migration, /create policy "members can read organization audit logs"/);
  assert.match(migration, /current_user_is_org_member\(organization_id\)/);
  assert.doesNotMatch(migration, /on imports[\s\S]*using \(true\)/);
  assert.doesNotMatch(migration, /on audit_logs[\s\S]*using \(true\)/);
});
