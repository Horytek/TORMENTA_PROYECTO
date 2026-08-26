#!/usr/bin/env bash
#
# Respaldo diario de las dos bases.
#
# Un VPS es una sola máquina: si se cae el disco, se fue todo. Con facturas,
# RUCs y datos de clientes adentro, esto no es opcional.
#
#   crontab -e
#   0 3 * * * /opt/horytek/deploy/backup.sh >> /var/log/horytek-backup.log 2>&1

set -euo pipefail

DEST="/var/backups/horytek"
FECHA=$(date +%F_%H%M)
RETENCION_DIAS=14

mkdir -p "$DEST"

respaldar() {
  local base="$1"
  local archivo="$DEST/${base}_${FECHA}.sql.gz"

  # --single-transaction no bloquea la base mientras copia.
  mysqldump --single-transaction --routines --triggers --events \
    --default-character-set=utf8mb4 "$base" | gzip > "$archivo"

  local tam
  tam=$(du -h "$archivo" | cut -f1)

  # Un dump que sale bien pero queda vacío es peor que uno que falla: parece
  # respaldo y no lo es. 1 KB comprimido no contiene una base real.
  if [[ $(stat -c%s "$archivo") -lt 1024 ]]; then
    echo "[$(date -Is)] ERROR: $base generó un archivo de $tam — sospechoso"
    exit 1
  fi

  echo "[$(date -Is)] ok  $base  $tam"
}

respaldar db_tormenta
respaldar db_ecommerce

# TODO: copiar fuera del VPS. Un respaldo en el mismo disco que la base no
# protege del único escenario que importa: perder la máquina.
#   rclone copy "$DEST" remoto:horytek-backups --max-age 2d

borrados=$(find "$DEST" -name "*.sql.gz" -mtime +$RETENCION_DIAS -print -delete | wc -l)
[[ $borrados -gt 0 ]] && echo "[$(date -Is)] $borrados respaldo(s) viejos eliminados"

echo "[$(date -Is)] listo · $(ls -1 "$DEST"/*.sql.gz 2>/dev/null | wc -l) archivos en $DEST"
