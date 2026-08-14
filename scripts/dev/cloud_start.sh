#!/usr/bin/env bash
#
# cloud_start.sh — Reconciliación por arranque para Cloud Agents.
# Idempotente: arranca MySQL, garantiza usuario/bases/tablas mínimas y .env.
# NO instala dependencias ni corre servidores de desarrollo (eso va en install/terminals).
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

DB_USER="${DB_USERNAME:-horytek}"
DB_PASS="${DB_PASSWORD:-horytek}"

echo "==> [start] Garantizando archivo .env (dev local)"
if [ ! -f .env ]; then
  cat > .env <<ENV
# Generado por scripts/dev/cloud_start.sh — entorno de desarrollo local (Cloud Agent)
# ========== Base de Datos ==========
DB_HOST=127.0.0.1
DB_DATABASE=db_tormenta
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_PORT=3306
ECOMMERCE_DB_DATABASE=db_ecommerce
EXPRESS_DB_DATABASE=express_db
TESIS_DB_DATABASE=tesis_db

# ========== Servidor ==========
NODE_ENV=development
PORT=4000
TOKEN_SECRET=dev_local_token_secret_change_me

# ========== URLs ==========
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:4000/api

# ========== Servicios opcionales ==========
# Resend construye su cliente al importar y exige una key no vacía.
RESEND_API_KEY=re_dev_placeholder
ENV
  echo "    .env creado"
else
  echo "    .env ya existe (no se sobreescribe)"
fi

echo "==> [start] Preparando y arrancando MySQL"
sudo mkdir -p /var/run/mysqld /var/lib/mysql
sudo chown -R mysql:mysql /var/run/mysqld /var/lib/mysql

# El data dir es propiedad de mysql (modo 700); comprobamos con sudo.
if ! sudo test -d /var/lib/mysql/mysql; then
  echo "    Inicializando data dir de MySQL (insecure root local)"
  sudo mysqld --initialize-insecure --user=mysql
fi

if ! sudo mysqladmin ping >/dev/null 2>&1; then
  echo "    Arrancando mysqld_safe"
  sudo mysqld_safe --user=mysql >/tmp/mysqld_safe.log 2>&1 &
  for i in $(seq 1 60); do
    if sudo mysqladmin ping >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi

if ! sudo mysqladmin ping >/dev/null 2>&1; then
  echo "ERROR: MySQL no respondió a tiempo" >&2
  tail -20 /tmp/mysqld_safe.log >&2 || true
  exit 1
fi
echo "    MySQL arriba"

echo "==> [start] Usuario, bases y tablas mínimas de bootstrap"
# Nota: db_tormenta es el ERP principal. Su esquema real proviene de un dump de
# producción (con PII) que NO está en el repo. Aquí solo creamos las bases vacías
# y las tablas mínimas que los servicios always-on (mantenimiento de logs) y el
# seed de plataforma necesitan para que el backend arranque estable en local.
sudo mysql -uroot <<SQL
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'localhost' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS db_tormenta  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS express_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS tesis_db     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE db_tormenta;
-- Tabla mínima para que el seed de plataforma no falle (su paso de usuario ERP
-- hace un SELECT sobre 'usuario' y se salta con gracia si no hay filas activas).
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  usua VARCHAR(30) NULL,
  contra VARCHAR(255) NULL,
  id_rol INT NULL,
  estado_usuario TINYINT(1) NOT NULL DEFAULT 1,
  id_tenant INT NULL,
  id_empresa INT NULL,
  plan_pago INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla mínima para el servicio de mantenimiento de logs (corre ~30s tras
-- arrancar y, si falta, lanza una excepción no capturada que tumba el proceso).
CREATE TABLE IF NOT EXISTS log_sistema (
  id_log BIGINT AUTO_INCREMENT PRIMARY KEY,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_usuario INT NULL,
  id_modulo INT NULL,
  id_submodulo INT NULL,
  accion VARCHAR(80) NULL,
  recurso VARCHAR(255) NULL,
  descripcion TEXT NULL,
  ip VARCHAR(64) NULL,
  id_tenant INT NULL,
  INDEX idx_log_fecha (fecha),
  INDEX idx_log_tenant (id_tenant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL

echo "==> [start] Listo. MySQL operativo y bootstrap aplicado."
