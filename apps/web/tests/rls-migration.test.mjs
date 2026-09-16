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
    /create policy "authorized users can create draft entries"[\s\S]*?current_organization_accepts_mutations\(organization_id\)[\s\S]*?current_user_can_access_company\(company_id\)/
  );
});
