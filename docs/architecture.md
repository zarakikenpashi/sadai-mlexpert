# Architecture MLexpert

MLexpert suit une architecture monorepo : application Next.js, Supabase self-hosted, migrations SQL, documentation et tests.

## Principes

- Multi-tenant par `organization_id`.
- Accès entreprise par affectation explicite.
- RLS obligatoire.
- Actions sensibles côté serveur/RPC.
- Montants comptables en `numeric`, jamais en flottants.
