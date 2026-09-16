# MLexpert

MLexpert est un SaaS web de comptabilité OHADA/SYSCOHADA destiné aux cabinets comptables.

## Objectif MVP

Permettre à un cabinet abonné de gérer plusieurs entreprises clientes, leurs exercices comptables, le plan SYSCOHADA, les journaux, les écritures, les imports Excel, les pièces jointes et les états principaux comme le grand livre et la balance générale.

## Stack validée

- Next.js + TypeScript
- Tailwind CSS avec design system MLexpert personnalisé
- Supabase Open Source self-hosted
- PostgreSQL + RLS obligatoire
- Supabase Auth
- Supabase Storage privé
- ExcelJS pour imports/exports Excel
- HTML → PDF via Playwright côté serveur
- Docker + Coolify
- GitHub Actions

## Démarrage local

```bash
npm install
cp .env.example .env
npm run dev
```

L’application web est dans `apps/web`.

## Règles importantes

- Jamais de secrets dans GitHub.
- Design intentionnel, métier, non “AI slop”.
- RLS obligatoire pour les tables multi-tenant.
- Une écriture validée est immuable.
- Une balance officielle doit être équilibrée.
