import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const migration = readFileSync(resolve(process.cwd(), '../../supabase/migrations/0001_initial_schema.sql'), 'utf8');

test('company select RLS requires explicit company access for non-admin members', () => {
  assert.match(
    migration,
    /on companies for select\s+using \(current_user_can_access_company\(id\)\);/s
  );
  assert.doesNotMatch(
    migration,
    /create policy "members can read companies in their cabinet"[\s\S]*?using \(current_user_is_org_member\(organization_id\)\);/
  );
});

test('entry mutations are blocked when the organization subscription is suspended or terminated', () => {
  assert.match(migration, /current_organization_accepts_mutations\(organization_id\)/);
  assert.match(
    migration,
    /create policy "authorized users can create draft entries"[\s\S]*?current_organization_accepts_mutations\(organization_id\)[\s\S]*?current_user_has_company_permission\(company_id, 'entry:create'\)/
  );
});

test('entry mutations require explicit company permissions, not read-only assignment', () => {
  assert.match(
    migration,
    /create or replace function current_user_has_company_permission\(target_company_id uuid, target_permission text\)/
  );
  assert.match(
    migration,
    /create policy "authorized users can update draft entries"[\s\S]*?current_user_has_company_permission\(company_id, 'entry:update'\)/
  );
  assert.match(
    migration,
    /create policy "authorized users can manage draft entry lines"[\s\S]*?current_user_has_company_permission\(entry.company_id, 'entry:update'\)/
  );
});

test('company assignment visibility does not expose every assignment in the cabinet', () => {
  assert.match(
    migration,
    /create policy "users can read their own company assignments"[\s\S]*?user_id = auth\.uid\(\)/
  );
  assert.doesNotMatch(
    migration,
    /create policy "members can read company assignments"[\s\S]*?using \(current_user_is_org_member\(organization_id\)\);/
  );
});
