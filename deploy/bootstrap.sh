#!/usr/bin/env bash
#
# Prepara el VPS de cero: usuario, firewall, Docker, MySQL y las dos bases.
# Idempotente: se puede volver a correr sin romper nada.
#
#   ssh root@149.28.103.217
#   curl -fsSL https://raw.githubusercontent.com/<ORG>/<REPO>/feature/frontend-v2/deploy/bootstrap.sh -o bootstrap.sh
#   less bootstrap.sh          # leerlo antes de ejecutarlo, siempre
#   bash bootstrap.sh
#
# NO toca la configuración de SSH. Cerrar el acceso de root es el único paso
# donde un error deja el servidor inaccesible, así que se hace a mano y con una
# segunda terminal abierta. El script te recuerda cómo al terminar.

set -euo pipefail

USUARIO="horytek"
APP_DIR="/opt/horytek"
CRED_FILE="/root/horytek-credenciales.txt"

log()  { printf "\n\033[1;32m▸ %s\033[0m\n" "$*"; }
warn() { printf "\033[1;33m  ! %s\033[0m\n" "$*"; }
skip() { printf "  · %s\n" "$*"; }

[[ $EUID -eq 0 ]] || { echo "Correr como root."; exit 1; }

# ── 1 · Usuario sin privilegios ────────────────────────────────────────────
log "Usuario de aplicación"
if id "$USUARIO" &>/dev/null; then
  skip "'$USUARIO' ya existe"
else
  adduser --disabled-password --gecos "" "$USUARIO"
  usermod -aG sudo "$USUARIO"

  # Contrasena para sudo. El login por SSH sigue siendo solo por llave —
  # PasswordAuthentication se apaga despues—, pero sin contrasena el usuario
  # queda en un limbo: entra al servidor y no puede usar sudo para nada.
  CLAVE_SUDO=$(openssl rand -base64 18 | tr -d '/+=' | head -c 20)
  echo "$USUARIO:$CLAVE_SUDO" | chpasswd
  echo "  creado '$USUARIO' · entra por llave SSH · contrasena de sudo generada"
fi

install -d -m 700 -o "$USUARIO" -g "$USUARIO" "/home/$USUARIO/.ssh"
# Hereda las llaves de root para no quedarse afuera al cerrar el acceso de root.
if [[ -f /root/.ssh/authorized_keys ]]; then
  cp /root/.ssh/authorized_keys "/home/$USUARIO/.ssh/authorized_keys"
  chown "$USUARIO:$USUARIO" "/home/$USUARIO/.ssh/authorized_keys"
  chmod 600 "/home/$USUARIO/.ssh/authorized_keys"
  echo "  llaves de root copiadas a $USUARIO"
else
  warn "root no tiene authorized_keys: cargá tu llave antes de cerrar el acceso por contraseña"
fi

# ── 2 · Sistema y firewall ─────────────────────────────────────────────────
log "Paquetes y firewall"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq ufw fail2ban curl git nginx certbot python3-certbot-nginx

ufw allow OpenSSH >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
# El 3306 NO se abre: MySQL solo se alcanza desde la misma máquina.
ufw --force enable >/dev/null
echo "  ufw activo · 22, 80 y 443 abiertos · 3306 cerrado"

systemctl enable --now fail2ban >/dev/null
echo "  fail2ban activo"

# ── 3 · Docker ─────────────────────────────────────────────────────────────
log "Docker"
if command -v docker &>/dev/null; then
  skip "ya instalado ($(docker --version))"
else
  curl -fsSL https://get.docker.com | sh >/dev/null
  echo "  instalado"
fi
usermod -aG docker "$USUARIO"
systemctl enable --now docker >/dev/null

# ── 4 · MySQL ──────────────────────────────────────────────────────────────
log "MySQL"
if command -v mysqld &>/dev/null; then
  skip "ya instalado"
else
  apt-get install -y -qq mysql-server
  echo "  instalado"
fi

# Ajustes para 8 GB de RAM. Archivo propio: sobrevive a las actualizaciones del
# paquete, que reescriben mysqld.cnf.
cat > /etc/mysql/mysql.conf.d/horytek.cnf <<'CNF'
[mysqld]
# 127.0.0.1 para el host; 172.17.0.1 es la interfaz de Docker, por donde llegan
# los contenedores. Nunca desde afuera: el 3306 está cerrado en el firewall.
bind-address = 127.0.0.1,172.17.0.1

# ~2.5 GB deja el resto de los 8 para Node, el worker y el sistema.
innodb_buffer_pool_size = 2560M
innodb_log_file_size    = 512M
innodb_flush_method     = O_DIRECT

# Los pools de la app suman 100 + 50 + 40; el margen es para administración.
max_connections = 200

character-set-server = utf8mb4
collation-server     = utf8mb4_unicode_ci
CNF
systemctl restart mysql
echo "  configurado para 8 GB · reiniciado"

# ── 5 · Bases y usuario de aplicación ──────────────────────────────────────
log "Bases de datos"
if [[ -f "$CRED_FILE" ]]; then
  DB_PASS=$(grep -oP '(?<=^DB_PASSWORD=).*' "$CRED_FILE")
  skip "reutilizando la clave ya generada ($CRED_FILE)"
else
  DB_PASS=$(openssl rand -base64 30 | tr -d '/+=' | head -c 32)
fi

mysql <<SQL
CREATE DATABASE IF NOT EXISTS db_tormenta  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS db_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'horytek_app'@'%' IDENTIFIED BY '${DB_PASS}';
ALTER USER 'horytek_app'@'%' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON db_tormenta.*  TO 'horytek_app'@'%';
GRANT ALL PRIVILEGES ON db_ecommerce.* TO 'horytek_app'@'%';
FLUSH PRIVILEGES;
SQL
echo "  db_tormenta y db_ecommerce listas · usuario horytek_app"
echo "  (las 16 bases de productos congelados NO se crean, a propósito)"

umask 077
cat > "$CRED_FILE" <<EOF
# Generado por bootstrap.sh el $(date -Is)
# Estos valores van al .env de /opt/horytek. Este archivo es solo para root.
DB_HOST=host.docker.internal
DB_USERNAME=horytek_app
DB_PASSWORD=$DB_PASS

# Contrasena de sudo del usuario $USUARIO (solo para sudo; el SSH va por llave).
SUDO_PASSWORD=${CLAVE_SUDO:-<ya existia, sin cambios>}
EOF
chmod 600 "$CRED_FILE"

# ── 6 · Directorios de la aplicación ───────────────────────────────────────
log "Directorios"
install -d -o "$USUARIO" -g "$USUARIO" "$APP_DIR" "$APP_DIR/uploads" "$APP_DIR/certificados"
install -d /var/www/certbot /var/backups/horytek
echo "  $APP_DIR listo"

# ── Resumen ────────────────────────────────────────────────────────────────
# La IP se resuelve aca y no dentro del heredoc: alli el \$1 de awk llegaba
# escapado y awk fallaba con 'backslash not last character on line'.
IP_PUBLICA=$(hostname -I | awk '{print $1}')

cat <<FIN

════════════════════════════════════════════════════════════════
  Servidor preparado.

  Credenciales de la base:  $CRED_FILE   (solo root)

  LO QUE FALTA, Y HAY QUE HACER A MANO:

  1) Cerrar el acceso de root. ANTES abrí OTRA terminal y comprobá
     que podés entrar como '$USUARIO'. Si la llave falla y ya
     cerraste root, te quedás afuera del servidor.

       ssh $USUARIO@$IP_PUBLICA

     Recién con eso funcionando:

       sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/;
               s/^#*PasswordAuthentication.*/PasswordAuthentication no/' \\
           /etc/ssh/sshd_config
       systemctl restart ssh

  2) Rotar la contraseña de root de Vultr: la que pegaste en el
     chat quedó expuesta.

  3) Clonar el repo en $APP_DIR, subir el .env por scp y seguir
     desde el paso 5 de deploy/README.md.
════════════════════════════════════════════════════════════════

FIN
