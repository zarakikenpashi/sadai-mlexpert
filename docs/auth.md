# Authentification et invitations MVP

## Auth Supabase

MLexpert utilise Supabase Auth email/mot de passe pour l’identité utilisateur. Les droits applicatifs ne viennent pas du profil Auth seul : ils sont portés par les tables métier protégées par RLS.

## Tables métier

- `organization_members` : appartenance cabinet + rôle (`owner`, `admin`, `accountant`, `reader`) + désactivation via `disabled_at`.
- `organization_invitations` : invitations email avec rôle, entreprises affectées, statut et expiration.
- `company_members` : affectation explicite utilisateur ↔ entreprise avec permissions fines.

## Règles MVP

- Owner/admin peuvent gérer les invitations du cabinet.
- Admin peut inviter `accountant` et `reader`; owner peut aussi inviter `admin`.
- `accountant` et `reader` doivent être affectés explicitement aux entreprises.
- `reader` peut lire/exporter/consulter les pièces jointes autorisées, mais ne peut pas créer/modifier/valider.
- `disabled_at` retire l’accès au cabinet et aux entreprises via les helpers RLS.
- Les routes `/entreprises` et `/administration` sont protégées par `apps/web/proxy.ts` et redirigent les sessions anonymes vers `/login?next=...`.
