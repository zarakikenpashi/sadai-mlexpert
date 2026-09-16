# Sécurité MLexpert

## Règles

- RLS obligatoire sur les tables exposées.
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur.
- Pièces jointes en bucket privé.
- Exports soumis aux mêmes permissions que les écrans.
- Accès support exceptionnel et journalisé.
- Aucun secret dans GitHub.
