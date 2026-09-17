import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(process.cwd(), '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('Docker assets include production hardening, healthcheck and CI image build', () => {
  const dockerfile = read('Dockerfile');
  const compose = read('docker-compose.yml');
  const ci = read('.github/workflows/ci.yml');

  assert.match(dockerfile, /USER\s+nextjs/);
  assert.match(dockerfile, /HEALTHCHECK/);
  assert.doesNotMatch(dockerfile, /apps\/web\/node_modules/);
  assert.match(compose, /healthcheck:/);
  assert.match(compose, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(ci, /docker build -t sadai-mlexpert:ci-check \./);
});

test('env example is complete and contains no real secrets', () => {
  const env = read('.env.example');
  for (const key of [
    'NEXT_PUBLIC_SUPABASE_URL=',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY=',
    'SUPABASE_SERVICE_ROLE_KEY=',
    'DATABASE_URL=',
    'APP_URL=',
    'STORAGE_BUCKET_ATTACHMENTS=entry-attachments',
    'EXPORT_SIGNED_URL_TTL_SECONDS=300',
    'MAX_ATTACHMENT_SIZE_MB=10'
  ]) {
    assert.match(env, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(env, /eyJ[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(env, /postgresql:\/\/[^\n*]+:[^\n*]+@/);
});

test('backup restore documentation contains executable PostgreSQL procedures', () => {
  const docs = read('docs/backup-restore.md');
  assert.match(docs, /pg_dump/);
  assert.match(docs, /psql/);
  assert.match(docs, /Rétention MVP.*7 jours/s);
  assert.match(docs, /Rétention production.*30 jours/s);
  assert.match(docs, /test de restauration/i);
});

test('security documentation covers secrets RLS and private storage', () => {
  const docs = read('docs/security.md');
  for (const phrase of ['Aucun secret dans GitHub', 'RLS obligatoire', 'SUPABASE_SERVICE_ROLE_KEY uniquement côté serveur', 'bucket privé `entry-attachments`']) {
    assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
