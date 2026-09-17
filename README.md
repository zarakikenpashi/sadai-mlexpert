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

## Couche applicative Supabase

L’application sépare explicitement les usages Supabase :

- `apps/web/lib/supabase-config.ts` valide les variables requises.
- `apps/web/lib/supabase-client.ts` expose un client navigateur anon et un client serveur service-role.
- `apps/web/lib/supabase-repositories.ts` centralise les lectures MVP typées : entreprises visibles, exercices, journaux, écritures et lignes.

Règle de sécurité : `SUPABASE_SERVICE_ROLE_KEY` reste uniquement côté serveur et n’est jamais exposée aux composants navigateur.

## Tests sécurité RLS

La CI lance un PostgreSQL éphémère et exécute `supabase/tests/rls_regression.sql` via :

```bash
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/mlexpert_test" npm run test:rls
```

Ce test installe la migration Supabase, simule `auth.uid()` et vérifie au niveau base que :

- un comptable ou lecteur affecté à une seule entreprise ne voit pas les autres entreprises ;
- un lecteur ne voit pas les affectations d’autres utilisateurs ;
- une affectation lecture seule ne peut pas créer d’écritures ;
- une organisation suspendue ne peut plus créer d’écritures ;
- `anon` ne voit aucune donnée même si des grants SQL existent ;
- `service_role` conserve le contournement RLS attendu côté serveur uniquement ;
- les pièces jointes privées restent lisibles uniquement via l’accès à l’écriture/entreprise associée ;
- un lecteur peut consulter une pièce jointe autorisée mais ne peut pas créer de pièce jointe sans `attachment:create`.

## Règles importantes

- Jamais de secrets dans GitHub.
- Design intentionnel, métier, non “AI slop”.
- RLS obligatoire pour les tables multi-tenant.
- Une écriture validée est immuable.
- Une balance officielle doit être équilibrée.
