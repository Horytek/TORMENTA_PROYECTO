# Seeds demo — productos platform (local)

## Obligatorio

Sin este seed, portales como `/taxi/demo` responden **Operador no encontrado** y el login admin falla con **Credenciales inválidas**.

```bash
# Solo MySQL local (.env → localhost). No correr contra producción.
npm run seed:platform-demo
# o
SEED_TENANT_ID=1 node src/scripts/seed_platform_demo.js
```

El script:

1. Crea las bases `db_*` de olas si faltan.
2. Aplica schemas Sync / Mayorista / Waves B–E.
3. Upsert idempotente: slug `demo`, códigos `DEMO*`, completa filas faltantes (no borra datos tuyos).

Re-ejecutar es seguro.

## Credenciales canónicas

| Rol | Identificador | Password / PIN |
|-----|---------------|----------------|
| Admin operador | slug `demo` + email `admin@demo.local` | `Demo1234!` |
| Equipo Taxi (2.º admin) | `ops@demo.local` | `Demo1234!` |
| Pasajero / cliente delivery | tel `999111222`, `999111223` (+ Taxi `999111224`; inactivo `999111299`) | `Demo1234!` |
| Conductor / repartidor | tel `999333444`…`999333446` (Taxi inactivo `999333499`) | `Demo1234!` |
| Alumno academia | `alumno1@demo.local` (…2, …3) | `Demo1234!` |
| Comprador B2B | `comprador@demo.local` | `Demo1234!` |
| ERP platform (`/platform/*`) | `platform.demo` (o `SEED_ERP_USER` / `VITE_DEMO_ERP_USER`) | `Demo1234!` |
| Campo / taller / despacho / mantto | PIN por operador | `1234` (o `5678` en el 2.º) |

**Tenant ERP** para paneles `/platform/*`: `SEED_TENANT_ID` (default `1`). El seed crea el usuario `platform.demo` en ese tenant.

En `/login`, la tarjeta **Acceso demostración** rellena credenciales por producto. Para paneles ERP (Mayorista admin, Recluta, Sync, CRM, …) usa `VITE_DEMO_ERP_USER` / `VITE_DEMO_ERP_PASSWORD` (default `platform.demo` / `Demo1234!`).

## Matriz URLs

### A — Auth propia (slug `demo`)

| Producto | Admin | Portal / ops |
|----------|-------|----------------|
| Taxi | `/login?mode=taxi` → rol **Operador** → `/taxi-admin` (Viajes / Conductores / Pasajeros / Equipo / Operador) | `/login?mode=taxi` → Pasajero / Conductor, o `/taxi/demo` · `/taxi/demo/conductor` |
| Delivery | `/login?mode=delivery` → `/delivery-admin` (Pedidos / Repartidores / Clientes / Equipo / Operador) | `/delivery/demo`, `/delivery/demo/repartidor` |
| Flotas | `/login?mode=flotas` | panel flotas-admin |
| Academia | `/login?mode=academia` | `/academia/demo` (alumno) |
| Agenda | `/login?mode=agenda` | `/agenda/demo` |

### B — Tenant ERP (`SEED_TENANT_ID`)

| Producto | Admin | Cliente / ops |
|----------|-------|----------------|
| Sync | `/platform/sync` | — |
| Mayorista | `/login?mode=mayorista` → **Administrador** → `/mayorista-admin` (Pedidos / Portales / Listas / Compradores) | `/login?mode=mayorista` → **Portal**: slug `demo` + `comprador@demo.local` / `Demo1234!` → `/b2b/demo` |
| Taller | `/platform/taller` | `/taller/planta` PIN `1234` |
| Preventa | `/platform/preventa` | `/preventa/demo` |
| CRM | `/platform/crm` | — |
| Envíos | `/platform/envios` | `/tracking/DEMO01` (…DEMO05) |
| WMS | `/platform/wms` | `/wms/operario` |
| Despacho | `/platform/despacho` | `/despacho/chofer` PIN `1234` |
| Campo | `/platform/campo` | `/campo/vendedor` PIN `1234` |
| Mantenimiento | `/platform/mantenimiento` | `/mantenimiento/tecnico` PIN `1234` |
| Recluta | `/platform/recluta` | `/recluta/demo` |

### C — Seeds aparte

| Producto | Nota |
|----------|------|
| **Atelier** | `npm run seed:atelier-demo` → base `db_atelier` |
| Catálogo WA | `/catalogo/{SEED_TENANT_ID}` (datos ERP del tenant) |
| ERP | Credenciales locales del usuario |
| Ecommerce (demo) | `demo_ecommerce_store` / `DemoEcommerce2026!` — seed específico |
| Pocket | `npm run seed:express` → `demo.pocket@horytek.test` / `PocketDemo2026!` |
| Ecommerce (empresa ERP → tienda) | `npm run sync:empresa-ecommerce` |

### Ecommerce (sync desde empresa ERP)

Copia `id_empresa=2` (nombre, contacto, logo) a la tienda `textiles_creando_moda`, asegura admin, MP TEST y catálogo de prendas femeninas.

```bash
npm run sync:empresa-ecommerce
```

| Rol | Credencial | Destino |
|-----|------------|---------|
| Admin tienda | `textiles_creando_moda` / `CreandoModa2026!` | `/login?mode=ecommerce` |
| Vitrina | — | `/tienda/textiles_creando_moda` |

Overrides: `ECOM_SYNC_ID_EMPRESA`, `ECOM_SYNC_SLUG`. MP = keys TEST de `src/scripts/ecommerce_mp_test_creds.js` (no `.env`).

### Atelier (marketplace de dibujos)

```bash
npm run seed:atelier-demo
```

| Rol | Login | Destino |
|-----|-------|---------|
| Admin | `atelier.admin@demo.local` / `Demo1234!` | `/login?mode=atelier` → `/atelier-admin` |
| Creador | `luna.ink@demo.local` o `pixel.fox@demo.local` / `Demo1234!` | `/atelier/creador` |
| Cliente | `cliente.demo@demo.local` / `Demo1234!` | `/atelier/cliente` |

Público: `/atelier` · ficha `/atelier/c/luna.ink` · API `/api/atelier/*` · DB `db_atelier` (`ATELIER_DB_DATABASE`).

## Volumen sembrado (resumen)

- Taxi: 4 pasajeros (1 inactivo), 4 conductores con placa/vehículo/notas (1 inactivo), 2 admins (`admin@` + `ops@`), ≥10 viajes multi-estado  

- Delivery: 2 clientes, 3 repartidores, ~10 pedidos  
- Flotas: 5 vehículos, 6 combustibles, 2 conductores  
- Academia: 4 cursos, 3 alumnos, inscripciones  
- Agenda: 12 slots, 5 reservas  
- Sync: 3 canales, mapeos SKU, jobs ok/error/pending  
- Mayorista: tienda `demo`, 12 ítems, 2 compradores, 4 pedidos  
- Taller / Preventa / CRM / Envíos / WMS / Despacho / Campo / Mantto / Recluta: según plan (varios estados)

## Troubleshooting

| Síntoma | Qué hacer |
|---------|-----------|
| Operador no encontrado | Correr `npm run seed:platform-demo` |
| Credenciales inválidas (ERP admin) | Usuario canónico `platform.demo` / `Demo1234!` tras el seed (no uses `admin` a menos que exista en tu BD) |
| Credenciales inválidas (portal B2B) | `comprador@demo.local` / `Demo1234!` + slug `demo`; seed mayorista |
| Tracking 404 | Código exacto `DEMO01`…`DEMO05` (tenant del seed) |
| `/b2b/demo` vacío | Seed mayorista; slug `demo` |
| Error de conexión MySQL | `.env` con `HOST`/`USER`/`PASSWORD` locales |
| Duplicados al re-run | No deberían; si hay, reportar tabla |

## Verificación rápida

```bash
# Tras seed + backend arriba:
curl -s http://localhost:4000/api/taxi/portal/demo
# Login admin taxi (POST según ruta real del producto)
```

Alternativa: abrir `/taxi/demo` y `/login?mode=taxi` en el browser.
