import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const migration = readFileSync(resolve(process.cwd(), '../../supabase/migrations/0001_initial_schema.sql'), 'utf8');

test('attachment metadata and audit tables are protected by RLS', () => {
  assert.match(migration, /create table if not exists entry_attachments/);
  assert.match(migration, /create table if not exists attachment_audit_events/);
  assert.match(migration, /alter table entry_attachments enable row level security;/);
  assert.match(migration, /alter table attachment_audit_events enable row level security;/);
});

test('attachment policies require entry access and explicit attachment permissions', () => {
  assert.match(
    migration,
    /create policy "authorized users can read entry attachments"[\s\S]*?current_user_can_access_company\(entry\.company_id\)/
  );
  assert.match(
    migration,
    /create policy "authorized users can create draft entry attachments"[\s\S]*?current_user_has_company_permission\(entry\.company_id, 'attachment:create'\)/
  );
  assert.match(
    migration,
    /create policy "authorized users can delete draft entry attachments"[\s\S]*?current_user_has_company_permission\(entry\.company_id, 'attachment:delete'\)/
  );
});

test('storage bucket and storage object policies keep entry attachments private', () => {
  assert.match(migration, /insert into storage\.buckets[\s\S]*?'entry-attachments'[\s\S]*?false/);
  assert.match(migration, /create policy "authorized users can read entry attachment objects"[\s\S]*?on storage\.objects for select/);
  assert.match(migration, /create policy "authorized users can upload entry attachment objects"[\s\S]*?on storage\.objects for insert/);
  assert.doesNotMatch(migration, /on storage\.objects[\s\S]*?using \(true\)/);
});
