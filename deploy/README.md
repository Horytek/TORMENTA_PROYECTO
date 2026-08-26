# Despliegue en VPS — Horytek ERP + POS

Guía para poner el ERP en el VPS de Vultr (4 vCPU / 8 GB, NVMe) y sacar la
aplicación de Vercel.

**Por qué migrar:** Vercel es serverless y `api/index.js` solo hace
`export default app`. El proceso muere entre requests, así que los crons nunca
corrieron — ni el cobro de suscripciones ni la expiración de reservas de
inventario. La aplicación necesita un proceso vivo.

**Arquitectura del destino:**

```
Internet → Nginx (nativo, TLS)
              └─→ 127.0.0.1:4000 → contenedor web
                                    contenedor worker (crons)
                                         ↓
                              MySQL nativo en el host
```

MySQL y Nginx van **nativos**, no en contenedor. MySQL porque un
`docker compose down -v` distraído se lleva boletas y RUCs sin deshacer; Nginx
porque certbot renueva con mucha menos fricción.

---

## 1 · Preparar el servidor

Ubuntu 24.04 LTS. Todo como root la primera vez.

```bash
adduser horytek && usermod -aG sudo horytek
```

Copiar tu llave SSH y **después** cerrar el acceso por contraseña en
`/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
```

```bash
systemctl restart ssh
apt update && apt upgrade -y
apt install -y ufw fail2ban
ufw allow OpenSSH && ufw allow 80 && ufw allow 443
ufw enable
```

El puerto 3306 **no** se abre. MySQL solo se alcanza desde la misma máquina.

---

## 2 · Docker

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker horytek
```

Cerrar sesión y volver a entrar para que el grupo tome efecto.

---

## 3 · MySQL

```bash
apt install -y mysql-server
mysql_secure_installation
```

### Configuración para 8 GB de RAM

En `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# El contenedor llega por la interfaz de Docker; nunca desde afuera.
bind-address = 127.0.0.1,172.17.0.1

# ~2.5 GB para MySQL deja el resto a Node, al worker y al sistema.
innodb_buffer_pool_size = 2560M
innodb_log_file_size    = 512M
innodb_flush_method     = O_DIRECT

max_connections = 200
```

`max_connections` en 200 porque los pools de la aplicación suman 100 + 50 + 40
por producto y hay que dejar margen para conexiones administrativas.

```bash
systemctl restart mysql
```

### Bases y usuario de aplicación

**No usar root.** Un usuario con permisos solo sobre las dos bases reales:

```sql
CREATE DATABASE db_tormenta  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE db_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'horytek_app'@'%' IDENTIFIED BY 'UNA_CLAVE_LARGA_Y_UNICA';
GRANT ALL PRIVILEGES ON db_tormenta.*  TO 'horytek_app'@'%';
GRANT ALL PRIVILEGES ON db_ecommerce.* TO 'horytek_app'@'%';
FLUSH PRIVILEGES;
```

Las 16 bases de los productos de plataforma (`db_taxi`, `db_wms`, `db_crm`…)
**no se crean.** Son esqueletos de productos congelados: cada una sería un punto
más donde el despliegue puede fallar por una migración que nadie corre.

---

## 4 · 🔴 Migrar los datos desde Railway

**Es el único paso de esta guía donde un error pierde datos.** Hacerlo con
calma.

### Antes de tocar nada

Anotar la foto de referencia desde Railway:

```sql
SELECT COUNT(*) FROM producto;
SELECT COUNT(*) FROM producto_sku;
SELECT COALESCE(SUM(stock),0) FROM inventario_stock;
SELECT COUNT(*) FROM venta;
SELECT COUNT(*) FROM tenant;
```

### Volcado

```bash
mysqldump --single-transaction --routines --triggers --events \
  -h <HOST_RAILWAY> -P <PUERTO> -u root -p db_tormenta > tormenta.sql
```

`--single-transaction` evita bloquear la base de producción mientras se copia.

### Quitar los DEFINER

El servidor de Railway corre MySQL 9.6 y el volcado trae triggers y vistas con
`DEFINER='root'@'%'`. Ese usuario no existe en el destino y **aborta la
importación**:

```bash
sed -E "s/DEFINER=\`[^\`]+\`@\`[^\`]+\`//g" tormenta.sql > tormenta_limpio.sql
```

### Importar y verificar

```bash
mysql -u root -p db_tormenta < tormenta_limpio.sql
```

Correr las mismas cinco consultas en el destino y **comparar número por
número**. Si alguna no coincide, no seguir: revisar antes de continuar.

Repetir todo para `db_ecommerce`.

### No dar de baja Railway todavía

Dejarlo andando hasta que el VPS lleve unos días estable. Es el respaldo.

---

## 5 · La aplicación

```bash
mkdir -p /opt/horytek && cd /opt/horytek
git clone <REPO> .
mkdir -p uploads certificados
```

Subir el `.env` **por separado**, nunca por git:

```bash
scp .env horytek@<IP>:/opt/horytek/.env
chmod 600 /opt/horytek/.env
```

Ajustar en el `.env` del servidor:

```
DB_HOST=host.docker.internal
DB_USERNAME=horytek_app
DB_PASSWORD=<la clave del paso 3>
NODE_ENV=production
```

### Migraciones antes de levantar

Las migraciones son idempotentes —cada una verifica antes de escribir—, así que
correrlas en cada despliegue es seguro y barato:

```bash
npm ci
npm run db:migrate:all
```

Corre las 53 en orden y **sale con error si alguna falla**, para que el
despliegue se detenga en vez de levantar la aplicación contra una base
incompleta. Excluye a propósito `ecommerce-etl` y `ecommerce-drop-tormenta`:
son operaciones de una sola vez que hacen DROP y mueven datos entre bases.

Para ver qué correría sin ejecutar nada: `npm run db:migrate:all -- --dry`.

Esto nos mordió tres veces durante el desarrollo: código que referenciaba
columnas cuya migración nunca se corrió, tumbando módulos enteros con errores
500 opacos.

### Levantar

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f web
```

Se esperan **dos** contenedores. El worker debe imprimir
`[worker] 3 de 3 tareas activas`.

---

## 6 · Nginx y TLS

```bash
apt install -y nginx certbot python3-certbot-nginx
cp /opt/horytek/deploy/nginx.conf /etc/nginx/sites-available/horytek
ln -s /etc/nginx/sites-available/horytek /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
mkdir -p /var/www/certbot
nginx -t && systemctl reload nginx
```

Con el DNS ya apuntando al VPS:

```bash
certbot --nginx -d horycore.online -d www.horycore.online
```

### Verificar que la renovación funcione

```bash
systemctl status certbot.timer
certbot renew --dry-run
```

**Este paso no es opcional.** `primeinstitute.net` está caído desde el 14 de
agosto porque su Let's Encrypt venció y la renovación automática no corrió.

---

## 7 · Respaldos

Un VPS es una sola máquina: si se cae el disco, se fue todo. Con datos de
clientes reales esto no es opcional.

`/opt/horytek/deploy/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail
FECHA=$(date +%F)
DEST=/var/backups/horytek
mkdir -p "$DEST"

mysqldump --single-transaction --routines --triggers \
  -u root db_tormenta  | gzip > "$DEST/tormenta_$FECHA.sql.gz"
mysqldump --single-transaction --routines --triggers \
  -u root db_ecommerce | gzip > "$DEST/ecommerce_$FECHA.sql.gz"

# Fuera del VPS. Un respaldo en el mismo disco no es un respaldo.
# rclone copy "$DEST" remoto:horytek-backups --max-age 2d

find "$DEST" -name "*.sql.gz" -mtime +14 -delete
```

```bash
chmod +x deploy/backup.sh
crontab -e
# 0 3 * * * /opt/horytek/deploy/backup.sh >> /var/log/horytek-backup.log 2>&1
```

**Probar la restauración una vez.** Un respaldo que nunca se restauró es una
suposición, no un respaldo.

---

## 8 · Despliegue automático

`.github/workflows/deploy-vps.yml`:

```yaml
name: Deploy VPS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: horytek
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/horytek
            git pull --ff-only
            npm ci
            # Migraciones ANTES de levantar la app nueva. Sin `|| true`: si una
            # falla, el despliegue se detiene acá y la app vieja sigue viva.
            npm run db:migrate:all
            docker compose up -d --build
            docker compose ps
```

El `master_horytek.yml` de Azure se puede borrar: ese entorno ya no existe.

---

## 9 · Verificación

Después del primer despliegue:

- [ ] `curl -s https://horycore.online/api/health` responde `operational` y la base `up`
- [ ] Login con un usuario real devuelve token
- [ ] `docker compose ps` muestra **dos** contenedores arriba
- [ ] El log del worker dice `3 de 3 tareas activas`
- [ ] Se carga una imagen de producto y se ve en `/uploads/`
- [ ] `SELECT SUM(stock) FROM inventario_stock` coincide con la foto de Railway
- [ ] `certbot renew --dry-run` pasa
- [ ] El respaldo del día siguiente aparece en `/var/backups/horytek`

---

## 10 · Operación diaria

```bash
docker compose logs -f web        # ver logs
docker compose restart web        # reiniciar solo el web
docker compose up -d --build      # desplegar cambios
docker compose down               # bajar TODO (sin -v, nunca -v)
```

**Volver atrás:**

```bash
git checkout <commit-anterior>
docker compose up -d --build
```

Si el problema es de base de datos, restaurar desde `/var/backups/horytek`.
Por eso Railway se deja andando las primeras semanas.

---

## Notas

**Un solo worker, siempre.** Dos instancias cobran las suscripciones dos veces.
El proceso web sí puede replicarse — desde que se removieron Socket.IO y los
crons, ya no guarda estado.

**Capacidad.** Con 8 GB, el buffer pool de 2.5 GB cubre cómodamente hasta unos
500 clientes. A los 1,500 conviene mover MySQL a su propia máquina: no se cae,
se pone lento a medida que el conjunto de trabajo deja de entrar en memoria.

**El `.env` y los certificados nunca entran a la imagen.** Se montan en tiempo
de ejecución. Si un `.p12` queda en una capa de Docker, cualquiera con acceso al
registro lo tiene.
