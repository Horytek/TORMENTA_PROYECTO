#!/usr/bin/env bash
#
# cloud_install.sh — Bootstrap de dependencias para Cloud Agents (fase install).
# Idempotente y termina. Instala MySQL + dependencias npm, arranca la BD,
# aplica el bootstrap y siembra datos demo de plataforma.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "==> [install 1/4] Dependencias del sistema (MySQL server)"
if ! command -v mysqld >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mysql-server
else
  echo "    MySQL ya instalado"
fi

echo "==> [install 2/4] Dependencias npm (backend + client + client-v2)"
npm install --no-audit --no-fund
npm --prefix client install --no-audit --no-fund
# client-v2 es el frontend nuevo (TypeScript) donde viven los módulos de plataforma
# (Taxi, Delivery, Mayorista, Atelier, ...) y la landing. Es el frontend demostrable.
npm --prefix client-v2 install --no-audit --no-fund

echo "==> [install 3/4] Arranque de MySQL + bootstrap de bases"
bash scripts/dev/cloud_start.sh

echo "==> [install 4/4] Seed demo de plataforma (taxi, delivery, etc.)"
# Idempotente; siembra credenciales demo y datos para los módulos self-contained.
SEED_TENANT_ID=1 node src/scripts/seed_platform_demo.js || {
  echo "    Aviso: el seed de plataforma reportó un error (no bloqueante)."
}

echo "==> [install] Completado."
