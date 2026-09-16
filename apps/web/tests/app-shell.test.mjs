import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const appRoot = resolve(process.cwd(), 'app');
const dashboard = readFileSync(resolve(appRoot, 'page.tsx'), 'utf8');
const css = readFileSync(resolve(appRoot, 'globals.css'), 'utf8');

const mvpRoutes = [
  'abonnement',
  'entreprises',
  'exercices',
  'plan-comptable',
  'journaux',
  'saisie',
  'import',
  'etats',
  'administration'
];

test('MVP navigation exposes every approved route', () => {
  for (const route of mvpRoutes) {
    assert.ok(existsSync(resolve(appRoot, route, 'page.tsx')), `missing route /${route}`);
  }

  for (const label of ['Abonnement', 'Entreprises', 'Exercices', 'Plan comptable', 'Journaux', 'Saisie comptable', 'Import Excel', 'États comptables', 'Administration']) {
    assert.match(dashboard, new RegExp(label));
  }
});

test('dashboard shell contains the approved structure and business UI components', () => {
  for (const className of ['shell', 'chrome', 'menu', 'context', 'kpis', 'table-card', 'panel']) {
    assert.match(dashboard, new RegExp(`className=\"[^\"]*${className}`));
  }

  for (const copy of ['Santé comptable', 'Balance rapide', 'Écritures récentes', 'Actions rapides']) {
    assert.match(dashboard, new RegExp(copy));
  }
});

test('design system defines intentional accounting UI tokens', () => {
  for (const token of ['--bg', '--card', '--ink', '--orange', '--green', '--red', '--amber']) {
    assert.match(css, new RegExp(token));
  }

  for (const selector of ['.status.valid', '.status.draft', '.status.reject', '.primary', '.secondary']) {
    assert.match(css, new RegExp(selector.replace('.', '\\.')));
  }
});
