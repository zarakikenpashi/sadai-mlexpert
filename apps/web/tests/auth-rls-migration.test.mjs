import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const migration = readFileSync(resolve(process.cwd(), '../../supabase/migrations/0001_initial_schema.sql'), 'utf8');

test('organization invitations exist and are protected by RLS', () => {
  assert.match(migration, /create table if not exists organization_invitations/);
  assert.match(migration, /alter table organization_invitations enable row level security;/);
});

test('only organization admins can manage invitations', () => {
  assert.match(
    migration,
    /create policy "admins can manage organization invitations"[\s\S]*?current_user_is_org_admin\(organization_id\)/
  );
});

test('disabled organization members lose organization and company access', () => {
  assert.match(migration, /disabled_at is null/);
  assert.match(
    migration,
    /current_user_can_access_company[\s\S]*?membership\.disabled_at is null/
  );
});
