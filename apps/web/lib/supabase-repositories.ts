type QueryResult<T> = PromiseLike<{ data: T[] | null; error: { message?: string } | null }>;

type QueryBuilder<T> = {
  select(columns: string): QueryBuilder<T>;
  eq(column: string, value: string): QueryBuilder<T>;
  is(column: string, value: null): QueryBuilder<T>;
  order(column: string, options: { ascending: boolean }): QueryResult<T>;
};

type SupabaseLike = {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T>;
};

async function unwrap<T>(resultPromise: QueryResult<T>): Promise<T[]> {
  const { data, error } = await resultPromise;
  if (error) throw new Error(error.message ?? 'Supabase query failed');
  return data ?? [];
}

export type CompanyRow = {
  id: string;
  organization_id: string;
  name: string;
  country_code: string;
  currency: 'XOF' | 'XAF';
  archived_at: string | null;
  created_at: string;
};

export type FiscalYearRow = {
  id: string;
  organization_id: string;
  company_id: string;
  year: number;
  status: 'future' | 'open' | 'closed';
  closed_at: string | null;
};

export type JournalRow = {
  id: string;
  organization_id: string;
  company_id: string;
  code: string;
  name: string;
};

export type EntryStatus = 'draft' | 'validated' | 'reversed';

export type EntryLineRow = {
  id: string;
  entry_id: string;
  account_id: string;
  label: string;
  debit: string;
  credit: string;
};

export type EntryWithLinesRow = {
  id: string;
  organization_id: string;
  company_id: string;
  fiscal_year_id: string;
  journal_id: string;
  piece_number: string;
  label: string;
  status: EntryStatus;
  validated_at: string | null;
  reversal_of_entry_id: string | null;
  created_at: string;
  entry_lines: EntryLineRow[];
};

export function listVisibleCompanies(client: SupabaseLike, filters: { organizationId?: string } = {}): Promise<CompanyRow[]> {
  let query = client
    .from<CompanyRow>('companies')
    .select('id, organization_id, name, country_code, currency, archived_at, created_at')
    .is('archived_at', null);

  if (filters.organizationId) query = query.eq('organization_id', filters.organizationId);

  return unwrap(query.order('name', { ascending: true }));
}

export function listCompanyFiscalYears(client: SupabaseLike, companyId: string): Promise<FiscalYearRow[]> {
  return unwrap(
    client
      .from<FiscalYearRow>('fiscal_years')
      .select('id, organization_id, company_id, year, status, closed_at')
      .eq('company_id', companyId)
      .order('year', { ascending: false })
  );
}

export function listCompanyJournals(client: SupabaseLike, companyId: string): Promise<JournalRow[]> {
  return unwrap(
    client
      .from<JournalRow>('journals')
      .select('id, organization_id, company_id, code, name')
      .eq('company_id', companyId)
      .order('code', { ascending: true })
  );
}

export function listEntriesWithLines(
  client: SupabaseLike,
  filters: { companyId: string; fiscalYearId?: string; status?: EntryStatus }
): Promise<EntryWithLinesRow[]> {
  let query = client
    .from<EntryWithLinesRow>('entries')
    .select('id, organization_id, company_id, fiscal_year_id, journal_id, piece_number, label, status, validated_at, reversal_of_entry_id, created_at, entry_lines(id, entry_id, account_id, label, debit, credit)')
    .eq('company_id', filters.companyId);

  if (filters.fiscalYearId) query = query.eq('fiscal_year_id', filters.fiscalYearId);
  if (filters.status) query = query.eq('status', filters.status);

  return unwrap(query.order('created_at', { ascending: false }));
}
