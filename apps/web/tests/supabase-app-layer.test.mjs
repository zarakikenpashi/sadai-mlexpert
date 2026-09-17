import assert from 'node:assert/strict';
import test from 'node:test';

import { validatePublicSupabaseEnv, validateServerSupabaseEnv } from '../lib/supabase-config.mjs';
import { listCompanyFiscalYears, listCompanyJournals, listEntriesWithLines, listVisibleCompanies } from '../lib/supabase-repositories.mjs';

function createQueryMock(result = { data: [], error: null }) {
  const calls = [];
  const query = {
    calls,
    select(columns) {
      calls.push(['select', columns]);
      return this;
    },
    eq(column, value) {
      calls.push(['eq', column, value]);
      return this;
    },
    is(column, value) {
      calls.push(['is', column, value]);
      return this;
    },
    order(column, options) {
      calls.push(['order', column, options]);
      return Promise.resolve(result);
    }
  };
  const client = {
    from(table) {
      calls.push(['from', table]);
      return query;
    }
  };
  return { client, calls };
}

test('public Supabase env exposes only browser-safe values', () => {
  const env = validatePublicSupabaseEnv({
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.test',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret'
  });

  assert.deepEqual(env, {
    url: 'https://supabase.example.test',
    anonKey: 'anon-key'
  });
  assert.equal(Object.hasOwn(env, 'serviceRoleKey'), false);
});

test('server Supabase env requires service role key and never accepts browser fallback', () => {
  assert.throws(
    () => validateServerSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.test',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key'
    }),
    /SUPABASE_SERVICE_ROLE_KEY/
  );

  const env = validateServerSupabaseEnv({
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.test',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret'
  });

  assert.deepEqual(env, {
    url: 'https://supabase.example.test',
    serviceRoleKey: 'service-role-secret'
  });
});

test('company repository reads non-archived visible companies ordered by name', async () => {
  const { client, calls } = createQueryMock({ data: [{ id: 'company-1', name: 'Alpha' }], error: null });

  const rows = await listVisibleCompanies(client, { organizationId: 'org-1' });

  assert.deepEqual(rows, [{ id: 'company-1', name: 'Alpha' }]);
  assert.deepEqual(calls, [
    ['from', 'companies'],
    ['select', 'id, organization_id, name, country_code, currency, archived_at, created_at'],
    ['is', 'archived_at', null],
    ['eq', 'organization_id', 'org-1'],
    ['order', 'name', { ascending: true }]
  ]);
});

test('fiscal year and journal repositories scope queries to a company', async () => {
  const years = createQueryMock({ data: [{ year: 2026, status: 'open' }], error: null });
  const journals = createQueryMock({ data: [{ code: 'VT', name: 'Ventes' }], error: null });

  assert.deepEqual(await listCompanyFiscalYears(years.client, 'company-1'), [{ year: 2026, status: 'open' }]);
  assert.deepEqual(await listCompanyJournals(journals.client, 'company-1'), [{ code: 'VT', name: 'Ventes' }]);

  assert.deepEqual(years.calls, [
    ['from', 'fiscal_years'],
    ['select', 'id, organization_id, company_id, year, status, closed_at'],
    ['eq', 'company_id', 'company-1'],
    ['order', 'year', { ascending: false }]
  ]);
  assert.deepEqual(journals.calls, [
    ['from', 'journals'],
    ['select', 'id, organization_id, company_id, code, name'],
    ['eq', 'company_id', 'company-1'],
    ['order', 'code', { ascending: true }]
  ]);
});

test('entries repository can filter by fiscal year and status and includes lines', async () => {
  const { client, calls } = createQueryMock({ data: [{ id: 'entry-1', entry_lines: [] }], error: null });

  assert.deepEqual(
    await listEntriesWithLines(client, { companyId: 'company-1', fiscalYearId: 'fy-1', status: 'draft' }),
    [{ id: 'entry-1', entry_lines: [] }]
  );

  assert.deepEqual(calls, [
    ['from', 'entries'],
    ['select', 'id, organization_id, company_id, fiscal_year_id, journal_id, piece_number, label, status, validated_at, reversal_of_entry_id, created_at, entry_lines(id, entry_id, account_id, label, debit, credit)'],
    ['eq', 'company_id', 'company-1'],
    ['eq', 'fiscal_year_id', 'fy-1'],
    ['eq', 'status', 'draft'],
    ['order', 'created_at', { ascending: false }]
  ]);
});

test('repositories throw explicit errors when Supabase returns an error', async () => {
  const { client } = createQueryMock({ data: null, error: { message: 'RLS denied' } });

  await assert.rejects(() => listVisibleCompanies(client), /RLS denied/);
});
