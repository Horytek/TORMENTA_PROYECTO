# CLAUDE.md — Proyecto Tormenta / Horytek ERP

> Este archivo es el contrato de trabajo con Claude. Léelo completo antes de tocar código.
> Si algo aquí contradice al código real, **el código gana**: avísame de la discrepancia en vez de asumir.

---

## 1. Qué es este proyecto

**Horytek ERP** (nombre interno: *Proyecto Tormenta*) es un **ERP + POS multi-tenant SaaS** para PYMES peruanas. Vende gestión de inventario, ventas, punto de venta, y **facturación electrónica ante SUNAT**. Estado: **MVP de startup en producción** (desplegado en Azure, pocos clientes). Se cobra por suscripción vía MercadoPago.

Prioridades del negocio, en orden: **1) no romper facturación/cobros, 2) no filtrar datos entre tenants, 3) time-to-value para nuevos clientes, 4) todo lo demás.**

## 2. Stack (verificado en el código)

| Capa | Tecnología |
|---|---|
| Backend | **Node ≥20, Express 5, ESM** (`"type":"module"`) |
| Base de datos | **MySQL + `mysql2/promise` con SQL crudo**. ⚠️ `sequelize` está en `package.json` pero **NO se usa como ORM** — no escribas modelos Sequelize. |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs`. Rate limiting propio. |
| Realtime | Socket.io (señalización WebRTC para llamadas) |
| Facturación | SUNAT vía SOAP (`soap`, `xml-crypto`, `node-forge`, certificados `.p12`) |
| Pagos | MercadoPago (suscripciones + webhooks) |
| Frontend | **React 19, Vite 7, TailwindCSS 4, HeroUI/Radix, Zustand, React Router 7, nuqs, axios** |
| Otros | Resend/Nodemailer (email), ImageKit (imágenes), OpenAI/Gemini/OpenRouter/DeepSeek (IA), `node-cron` |
| Deploy | **Azure Web App** (proceso Node persistente). Ver §9. |

## 3. Estructura

```
├── index.js              # Entry: crea HTTP server + Socket.io, arranca app.js
├── src/
│   ├── app.js            # Express: middlewares, monta todas las rutas /api/*
│   ├── config.js         # Lee .env → exporta constantes (HOST, DATABASE, TOKEN_SECRET…)
│   ├── controllers/      # Lógica de cada endpoint (SQL crudo aquí y en repositories)
│   ├── routes/           # *.routes.js → router.<verbo>(path, [middlewares], controller)
│   ├── middlewares/      # auth, tenantStatus, featureAccess, validator, rateLimiter, audit…
│   ├── repositories/     # BaseRepository (patrón query() con release en finally)
│   ├── schemas/          # Validación Zod (usadas por validator.middleware)
│   ├── services/         # Lógica de negocio reutilizable (sunat/, PlanSynchronizer, limites…)
│   ├── database/         # Pools: database.js (db_tormenta), express_db.js, database_tesis.js
│   ├── cron/             # subscriptionCron.js (node-cron)
│   ├── libs/ utils/      # jwt, passwordUtil, logActions, helpers
│   └── scripts/          # Migraciones y utilidades
├── client/               # Frontend (React + Vite). envDir apunta a la raíz (usa el .env raíz)
│   └── src/
│       ├── api/          # axios.js (instancia) + api.<dominio>.js (un módulo por recurso)
│       ├── pages/        # Una carpeta por módulo del ERP
│       ├── store/        # Zustand (useStore.js, …)
│       ├── components/ context/ hooks/ layouts/ services/
├── api/, vercel.json     # Configuración opcional de Vercel (apunta a client-v2) — Ver §9.
└── scripts/sunat/        # Pruebas/certificados SUNAT
```

## 4. Modelo de datos: 3 bases + multi-tenancy (LO MÁS IMPORTANTE)

Hay **tres bases MySQL** en el mismo servidor, con pools separados:
- **`db_tormenta`** — principal (ERP: usuario, venta, producto, inventario, empresa, plan…). Pool en `database.js`.
- **`express_db`** — POS Express (base lateral). Pool en `express_db.js`.
- **`tesis_db`** — eCommerce. Pool en `database_tesis.js`.

**Multi-tenant:** casi todo se aísla por **`id_tenant`** (y a menudo `id_empresa`). El middleware `auth` pone `req.user`, `req.id_tenant`, `req.id_empresa` desde el JWT.

> 🔴 **REGLA DE ORO Nº1 — Aislamiento de tenant.** Toda query que lea o escriba datos de negocio **DEBE** filtrar por `id_tenant` (y `id_empresa` cuando aplique), tomándolos de `req.id_tenant`/`req.id_empresa`, **nunca** del body/query del cliente. Un `WHERE` sin `id_tenant` es un bug de seguridad que expone datos de un cliente a otro. Si dudas, filtra.

## 5. Cómo correr (local)

```bash
# Requiere MySQL local con las 3 bases importadas y .env apuntando a localhost.
npm install               # backend
npm --prefix client install
npm run dev:fullstack     # backend (4000) + frontend (5173) juntos, con colores
```

| Servicio | URL |
|---|---|
| Backend API | http://localhost:4000/api |
| Frontend | http://localhost:5173 |

- El frontend proxya `/api` → backend (ver `client/vite.config.js`).
- Vite lee las variables `VITE_*` del **`.env` de la raíz** (`envDir: '..'`). No dupliques en `client/.env`.
- No hay suite de tests aún (`npm test` no existe). Verifica cambios corriendo la app y golpeando el endpoint real (ej. `GET /api/health` confirma conexión a BD).

## 6. Convenciones — Backend

- **SQL parametrizado siempre.** Usa placeholders `?` con `connection.query(sql, params)` / `BaseRepository.query()`. 🔴 **REGLA DE ORO Nº2:** nunca concatenes input de usuario en un string SQL (inyección).
- **Conexiones:** obtén con `getConnection()`, **libera SIEMPRE** con `connection.release()` en `finally`. Para varias escrituras relacionadas, usa transacción (`beginTransaction`/`commit`/`rollback`) y pasa la misma `connection` (ver `queryWithConnection`). El pool es finito; una conexión no liberada lo agota.
- **Rutas:** un archivo `*.routes.js` por dominio. Orden de middlewares: `auth` → (`tenantStatus`/`featureAccess` si aplica) → `validateSchema(...)` → controller.
- **Validación:** define un esquema **Zod** en `src/schemas/` y aplícalo con `validateSchema(schema)`. No valides a mano dentro del controller.
- **Auth:** protege endpoints con el middleware `auth`. El JWT lleva claims cortos (`sub`, `usr`, `ten`, `emp`, `rol`); ya vienen normalizados en `req.user`. Issuer `horytek-backend`, audience `horytek-erp`.
- **Forma de respuesta:** el estándar preferido es `{ success: true, data }` en éxito y `{ success: false, message }` en error, con el status HTTP correcto (400 validación, 401 auth, 403 permiso, 404, 500). El código legacy es inconsistente (algunos devuelven `{ message }` pelado) — en código **nuevo** usa el estándar; no rompas contratos existentes que el frontend ya consume.
- **Errores:** captura, loguea con contexto y devuelve mensaje seguro (sin stack ni SQL al cliente). Usa los helpers de logging existentes (`logActions`, `audit.middleware`).

## 7. Convenciones — Frontend

- **Llamadas HTTP:** solo a través de la instancia `client/src/api/axios.js` (baseURL desde `VITE_API_URL`, `withCredentials: true`). Agrupa las llamadas de un recurso en su módulo `api.<dominio>.js`. No uses `fetch` suelto ni crees instancias axios nuevas.
- **Estado global:** Zustand (`store/`). Estado de URL/filtros: `nuqs`. No metas Redux.
- **UI:** componentes de HeroUI/Radix + TailwindCSS 4. Reutiliza `components/` antes de crear uno nuevo.
- **Rutas/páginas:** una carpeta por módulo en `pages/`; registra en `routes.jsx`.

## 8. Seguridad y manejo de datos (no negociable)

- 🔴 **La BD de producción tiene datos reales de clientes y PII (facturas, RUCs, correos).** Nunca la vuelques a disco, ni la copies a un servicio externo, ni la pegues en un chat/PR. Para desarrollo se trabaja **solo con la copia local**.
- **`.env` contiene secretos vivos** (SUNAT, MercadoPago producción, OpenAI/Gemini, Resend, certificado `.p12`). Ya está en `.gitignore` — **nunca** lo commitees, lo imprimas entero, ni lo muevas a un archivo trackeado. Certificados `*.p12`/`*.pfx`/`*.base64.txt` también están ignorados: mantenlo así.
- Contraseñas: **bcrypt** (`passwordUtil.js`, 12 rounds). Nunca guardes ni loguees contraseñas en claro. El login tolera texto plano solo por legado; no introduzcas contraseñas planas nuevas.
- 🔴 **REGLA DE ORO Nº3 — SUNAT y pagos son sagrados.** Cambios en facturación (`services/sunat/`, `sunat.controller`) o en cobros/webhooks (`payment.controller`, `pagos.controller`, `subscription.controller`, `mp_payments`) deben ser **idempotentes** (un reintento no duplica factura ni cobro) y quedar auditados. Ante la duda aquí, **pregunta antes de tocar**.

## 9. Despliegue

- **Producción = Azure Web App** (`.github/workflows/master_horytek.yml`, push a `master`). Es un **proceso Node persistente** vía `index.js`, por eso Socket.io y `node-cron` funcionan.
- `vercel.json` + `api/index.js` están configurados para desplegar el frontend `client-v2` en Vercel de forma opcional/pruebas. La producción oficial corre en Azure.

## 10. Límites de escala a tener presentes

- **Estado en memoria = una sola instancia.** La presencia de sockets (`index.js`, `Map` en memoria) y el `subscriptionCron` viven en un proceso. Si algún día se escala a 2+ instancias en Azure, se rompen: presencia → mover a Redis, cron → job/scheduler dedicado. No agregues más estado global en memoria que asuma instancia única.
- El pool MySQL tiene límite (100/50). Cuidado con conexiones sin liberar y con features que abran muchas a la vez.

## 11. Gotchas conocidos

- **Dumps MySQL 9.6 → local 8.0:** el servidor de prod es MySQL 9.6; los dumps traen triggers/vistas con `DEFINER='root'@'%'` que no existe en local y **abortan el import** / bloquean escrituras. Al importar en local, **quita los `DEFINER`** (`sed -E "s/DEFINER=\`[^\`]+\`@\`[^\`]+\`//g"`) antes de cargar.
- **Node local desactualizado:** Vite 7 pide Node ≥20.19/22.12. Si ves warnings raros de Vite, actualiza a Node 22 LTS.
- **Raíz del repo sucia:** hay ~30 scripts sueltos de depuración (`check_*.js`, `fix_*.js`, `tmp*.json`, `*.log`). No son parte del runtime; no los tomes como referencia de arquitectura y no agregues más ahí — usa `src/scripts/`.

## 12. Cómo debe trabajar Claude aquí

- **Sé preciso, no genérico.** Antes de afirmar, verifica en el código (grep/read). Si no estás seguro de una convención, míralas en un archivo hermano y **coincide con el estilo existente** (nombres, idioma de comentarios en español, forma de respuestas).
- **Cambios pequeños y enfocados.** No refactorices de más ni "modernices" sin que se pida. No cambies contratos de API que el frontend ya consume sin avisar.
- **Pide confirmación** antes de: migraciones/DDL, tocar facturación o pagos, borrar archivos, o cualquier acción contra datos/servicios de producción.
- **No inventes** endpoints, columnas ni flags: confírmalos en el código o en la BD primero.
- Idioma: código y comentarios en **español** (como el resto del repo).
