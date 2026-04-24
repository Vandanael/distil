#!/usr/bin/env bash
set -euo pipefail

# Usage: PGPASSWORD='...' ./scripts/backup-db.sh
# Requires: postgresql-client-17, PGPASSWORD env var

POOLER_HOST="${SUPABASE_POOLER_HOST:-}"
POOLER_USER="${SUPABASE_POOLER_USER:-postgres.viakuunxglwtrksfgtor}"
DB_NAME="postgres"
BACKUP_DIR="${HOME}/distil-backups"
DATE=$(date +%Y%m%d-%H%M)
OUTPUT="${BACKUP_DIR}/distil-backup-${DATE}.dump"

if [[ -z "${PGPASSWORD:-}" ]]; then
  echo "Erreur : PGPASSWORD non défini"
  exit 1
fi

if [[ -z "${POOLER_HOST}" ]]; then
  echo "Erreur : SUPABASE_POOLER_HOST non défini"
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

echo "Backup en cours vers ${OUTPUT}..."
/usr/lib/postgresql/17/bin/pg_dump \
  -h "${POOLER_HOST}" \
  -U "${POOLER_USER}" \
  -d "${DB_NAME}" \
  --no-owner --no-acl \
  -F c \
  -f "${OUTPUT}"

SIZE=$(du -h "${OUTPUT}" | cut -f1)
echo "OK — ${OUTPUT} (${SIZE})"

# Rétention 7 fichiers
cd "${BACKUP_DIR}"
ls -t distil-backup-*.dump | tail -n +8 | xargs -r rm --
