async function unwrap(resultPromise) {
  const { data, error } = await resultPromise;
  if (error) throw new Error(error.message ?? 'Supabase query failed');
  return data ?? [];
}

export function listVisibleCompanies(client, filters = {}) {
  let query = client
    .from('companies')
    .select('id, organization_id, name, country_code, currency, archived_at, created_at')
    .is('archived_at', null);

  if (filters.organizationId) query = query.eq('organization_id', filters.organizationId);

  return unwrap(query.order('name', { ascending: true }));
}

export function listCompanyFiscalYears(client, companyId) {
  return unwrap(
    client
      .from('fiscal_years')
      .select('id, organization_id, company_id, year, status, closed_at')
      .eq('company_id', companyId)
      .order('year', { ascending: false })
  );
}

export function listCompanyJournals(client, companyId) {
  return unwrap(
    client
      .from('journals')
      .select('id, organization_id, company_id, code, name')
      .eq('company_id', companyId)
      .order('code', { ascending: true })
  );
}

export function listEntriesWithLines(client, filters) {
  let query = client
    .from('entries')
    .select('id, organization_id, company_id, fiscal_year_id, journal_id, piece_number, label, status, validated_at, reversal_of_entry_id, created_at, entry_lines(id, entry_id, account_id, label, debit, credit)')
    .eq('company_id', filters.companyId);

  if (filters.fiscalYearId) query = query.eq('fiscal_year_id', filters.fiscalYearId);
  if (filters.status) query = query.eq('status', filters.status);

  return unwrap(query.order('created_at', { ascending: false }));
}
