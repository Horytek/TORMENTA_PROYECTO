# Imagen de la aplicación Horytek: proceso web y worker comparten esta imagen y
# se diferencian solo por el comando. La base de datos NO va en contenedor —
# corre nativa en el host, para poder respaldarla con mysqldump sin depender de
# volúmenes y sin el riesgo de que un `compose down -v` se lleve datos reales de
# clientes.

# ── Etapa 1: construir el frontend ──────────────────────────────────────────
# Node 22 porque Vite 7 exige >= 20.19 o >= 22.12, y el entorno local está en
# 20.15. Fijar la versión acá es la razón principal para usar contenedores.
FROM node:22-alpine AS frontend

WORKDIR /build

COPY client-v2/package.json client-v2/package-lock.json ./client-v2/
RUN npm --prefix client-v2 ci

COPY client-v2 ./client-v2

# Vite lee las VITE_* del .env de la raíz (envDir: '..'), pero ese archivo tiene
# secretos vivos de SUNAT y MercadoPago y está excluido en .dockerignore a
# propósito. Se pasan solo las tres que client-v2 usa de verdad, como build args.
#
# Nota: todo lo que empieza con VITE_ termina dentro del bundle y es visible para
# cualquiera que abra el código fuente de la página. Nunca poner acá una clave
# que deba seguir siendo secreta.
ARG VITE_API_URL
ARG VITE_DEMO_ERP_USER
ARG VITE_DEMO_ERP_PASSWORD
ENV VITE_API_URL=$VITE_API_URL     VITE_DEMO_ERP_USER=$VITE_DEMO_ERP_USER     VITE_DEMO_ERP_PASSWORD=$VITE_DEMO_ERP_PASSWORD

RUN npm --prefix client-v2 run build


# ── Etapa 2: dependencias del backend ───────────────────────────────────────
FROM node:22-alpine AS backend-deps

WORKDIR /app
COPY package.json package-lock.json ./
# `--omit=dev` deja fuera nodemon, vitest y demás: la imagen final no los usa.
RUN npm ci --omit=dev


# ── Etapa 3: imagen final ───────────────────────────────────────────────────
FROM node:22-alpine

# `tini` como PID 1 para que SIGTERM llegue a Node y el apagado ordenado de
# index.js y worker.js se ejecute de verdad.
RUN apk add --no-cache tini curl

WORKDIR /app

COPY --from=backend-deps /app/node_modules ./node_modules
COPY package.json ./
COPY index.js worker.js ./
COPY src ./src
COPY scripts ./scripts
COPY --from=frontend /build/client-v2/dist ./client-v2/dist

# Las imágenes subidas por los usuarios se montan como volumen; el directorio
# tiene que existir para que Express no falle al servirlo.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

ENV NODE_ENV=production
ENV FRONTEND_DIST=client-v2/dist

# Sin root. El .env y los certificados .p12 se montan desde el host en tiempo de
# ejecución: nunca se copian a la imagen, porque quedarían en una capa que
# cualquiera con acceso al registro puede leer.
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:4000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
