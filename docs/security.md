# Sécurité MLexpert

## Règles

- RLS obligatoire sur les tables exposées.
- Les comptes `owner`/`admin` voient toutes les entreprises de leur cabinet.
- Les comptes `accountant`/`reader` doivent être affectés explicitement à une entreprise.
- Un abonnement `suspended` ou `terminated` bloque les mutations base de données ; les lectures/exports restent autorisés selon les permissions.
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur.
- Pièces jointes en bucket privé.
- Exports soumis aux mêmes permissions que les écrans.
- Accès support exceptionnel et journalisé.
- Aucun secret dans GitHub.

## Régression automatisée

Le fichier `supabase/tests/rls_regression.sql` est exécuté en CI sur PostgreSQL avec un shim `auth.uid()` pour vérifier les policies au niveau base de données, pas seulement dans le code applicatif.

Cas couverts actuellement :

- isolation inter-cabinets ;
- affectation explicite des entreprises ;
- restriction des affectations visibles aux administrateurs ou à l’utilisateur concerné ;
- blocage des mutations sur abonnement suspendu ;
- blocage des écritures pour les affectations lecture seule ;
- absence d’accès `anon` malgré les grants SQL ;
- contournement RLS attendu uniquement par `service_role`.
