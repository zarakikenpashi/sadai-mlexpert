# Backup / restore

## Variables attendues

- `DATABASE_URL` : URL PostgreSQL de l’instance Supabase self-hosted.
- `BACKUP_DIR` : répertoire local ou volume monté recevant les dumps.

## Backup PostgreSQL quotidien

Commande de base à planifier côté serveur/Coolify :

```bash
mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file "$BACKUP_DIR/mlexpert-$(date +%Y%m%d-%H%M%S).dump"
```

## Restauration

Restaurer dans une base vide ou une base de test avant toute production :

```bash
createdb mlexpert_restore_test
psql "$DATABASE_URL" -c 'select 1'
pg_restore --dbname "$DATABASE_URL" --clean --if-exists --no-owner --no-acl "$BACKUP_FILE"
```

## Rétention MVP : 7 jours

```bash
find "$BACKUP_DIR" -name 'mlexpert-*.dump' -type f -mtime +7 -delete
```

## Rétention production : 30 jours

- Conserver au moins 30 jours de dumps.
- Copier les sauvegardes hors serveur quand le projet devient production-sérieux.
- Surveiller l’échec des backups et l’espace disque.

## Test de restauration obligatoire

Avant données réelles, exécuter un test de restauration complet :

1. créer une base de test ;
2. restaurer le dernier dump avec `pg_restore` ;
3. lancer les migrations/tests RLS ;
4. documenter la date du dernier test réussi.
