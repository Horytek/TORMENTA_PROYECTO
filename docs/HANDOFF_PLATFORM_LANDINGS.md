# Handoff — Platform products + landings modulares

> **Commit:** `2b062ef2` en `feature/frontend-v2` (159 archivos, ~25k LOC).  
> **Para Claude Code:** lee este archivo primero. No hace falta abrir los 159 archivos.

---

## 1. Qué entró (una frase)

Landings distintas por producto (`?product=`), catálogo/soluciones, UIs de plataforma multi-producto, pools MySQL por producto, APIs/rutas de olas, y MapLibre (mapcn) en landings/apps de movilidad.

## 2. No romper

| Zona | Regla |
|------|--------|
| ERP / Pocket / Ecommerce landings | `renderer: "legacy"` — Hero/Pricing/PLANS legacy intactos |
| SUNAT / MercadoPago | No tocados en este commit |
| Tenant | Queries nuevas filtran por JWT (`id_tenant` / kit de producto), nunca del body |
| MapLibre en Vite | `import * as MapLibreGL from "maplibre-gl"` (no default). `vite.config.ts` → `optimizeDeps.include: ['maplibre-gl']` |
| Catálogo canónico | `client-v2/.../horytekProducts.ts` ↔ `src/config/horytekProducts.config.js` alineados |

## 3. Landing modular (client-v2)

### Flujo

```
/?product=<id>  (+ compat ?mode=pocket|ecommerce|standard)
       ↓
useLandingProduct()  → sessionStorage: horytek-landing-product
       ↓
landingModules.registry / experienceModules.data
       ↓
LandingPage → ExperienceLanding (si renderer=experience) | legacy
       ↓
layoutKitId → layouts/*.tsx
```

### Archivos clave

| Path | Rol |
|------|-----|
| `hooks/useLandingProduct.ts` | Producto activo + setProductId |
| `hooks/useMode.ts` | Compat con mode legacy |
| `modules/landingModule.types.ts` | Tipos: LayoutKitId, sections, accents, pricing |
| `modules/landingModules.registry.ts` | erp/pocket/ecommerce = legacy; resto experience |
| `modules/experienceModules.data.ts` | Arma módulos experience desde narrativas |
| `modules/content/productNarratives.ts` | Copy denso: story, scenario, antiConfusion, FAQ… |
| `components/ExperienceLanding.tsx` | Switch por `layoutKitId` |
| `components/PricingModular.tsx` / `ProductSwitcher.tsx` | Pricing + switcher |
| `layouts/*.tsx` + `layoutShared.tsx` | Compositores + bloques densos compartidos |
| `styles/experience-landing.css` | Tokens soft (DM Sans / Fraunces) |
| `pages/SolucionesPage.tsx`, `SolucionProductoPage.tsx`, `SolucionBundlePage.tsx` | `/soluciones` |

### Layout kits → productos (resumen)

| `layoutKitId` | Layout | Productos tipicos |
|---------------|--------|-------------------|
| `legacy` | (sin ExperienceLanding) | erp, pocket, ecommerce |
| `map-mobility` | MapMobilityLayout | taxi, delivery |
| `map-fleet` | MapFleetLayout | flotas |
| `rail-ops` | RailOpsLayout | campo, wms, despacho, mantenimiento… |
| `plant` | PlantLayout | taller, mantto OT |
| `commerce` | CommerceLayout | sync, mayorista, catalogo-wa, preventa… |
| `pipeline` | PipelineLayout | crm, recluta |
| `learn-book` | LearnBookLayout | academia, agenda |
| `ship` | ShipLayout | envios |

### Maps

| Path | Uso |
|------|-----|
| `components/ui/map.tsx` | MapCN / MapLibre (shadcn) |
| `landing/maps/HorytekMap.tsx` + `lima.ts` | Wrapper + demo geo Lima |
| `TaxiMapHero`, `DeliveryMapHero`, `FleetMapHero`, `ShipMapHero`, `CampoMapHero` | Heroes |
| `platform/maps/PlatformMapPanel.tsx` | Apps Taxi pasajero, Delivery cliente, Flotas admin |

Coords demo en Lima — no hay lat/lng reales en BD aún.

## 4. Plataforma UI (client-v2/features/platform)

- **API clients:** `api/createProductClient.ts` + `taxi.ts`, `delivery.ts`, `flotas.ts`, `agenda.ts`, `academia.ts`, `mayorista.ts`, `stockSync.ts`, `platformProducts.ts`
- **Catálogo:** `catalog/horytekProducts.ts`
- **Páginas admin/cliente/operador:** `pages/*` (Taxi, Delivery, Flotas, Campo, WMS, CRM, etc.)
- **Rutas** registradas en `App.tsx`: públicas (`/taxi/:slug`, `/delivery/:slug`, …) y protected (`/platform/*`, `*-admin`)
- **Auth:** `ProductPicker.tsx` + cambios en `LoginPage.tsx`
- **Nav:** `lib/navigationCatalog.ts`

## 5. Catálogo Express (mismo commit)

Refactor UI pública/admin: `CatalogShell`, grid/cards, filtros, cart sheet, checkout bar, CSS `catalog-express.css`. Reusa tenant ERP (sin BD propia).

## 6. Backend multi-producto

### Pools / config

- `src/database/createProductPool.js` — factory de pools
- `src/database/database_<producto>.js` — un pool por producto
- `src/config.js` — nombres opcionales `*_DB_DATABASE` (mismo host/user/pass/port que ERP). Defaults: `db_taxi`, `db_delivery`, `db_flotas`, `db_campo`, …  
  **No hace falta nuevas credenciales**; sí crear/migrar las BDs.

### Registro / APIs

| Path | Rol |
|------|-----|
| `config/horytekProducts.config.js` | Catálogo canónico BE |
| `config/platformRegistry.js` + `moduleRegistry.js` | Registro módulos/olas |
| `platform/tenantProductKit.js` | Kit tenant↔producto |
| `controllers/platformWaves.controller.js` | Olas B–E genéricas |
| `controllers/mayorista.controller.js`, `stockSync.controller.js` | Dominios A |
| `routes/*.routes.js` montadas en `app.js` | `/api/taxi`, `/api/delivery`, `/api/flotas`, `/api/campo`, … `/api/stock-sync`, `/api/mayorista`, `/api/horytek-products` |
| `schemas/*.schema.js` | Zod |
| `scripts/scaffold_product_databases.js` | Crear BDs |
| `scripts/migrate_platform_wave_a.js`, `migrate_platform_waves_b_e.js` | Migraciones |
| `scripts/schemas/*.sql.js` | DDL por ola |

## 7. Conteos del commit (orientación)

| Área | ~archivos |
|------|-----------|
| `client-v2/.../landing` | 53 |
| `client-v2/.../platform` | 42 |
| `client-v2/.../catalog-express` | 15 |
| `src/database` | 17 |
| `src/scripts` | 6 |
| rutas/controllers/schemas/config/app | resto |

Deps nuevas FE: `maplibre-gl` (+ map component en `package.json` / lock).

## 8. Cómo extender (checklist corto)

**Nueva landing experience**

1. Entrada en `horytekProducts` (FE+BE).
2. Narrativa en `productNarratives.ts` (`layoutKitId` + copy).
3. Si hace falta kit nuevo → `layouts/X.tsx` + case en `ExperienceLanding`.
4. Smoke: `/?product=<id>` y legacy `/?product=erp`.

**Nuevo producto con BD**

1. Default en `config.js` + `database_*.js` via `createProductPool`.
2. Schema/migrate en `scripts/`.
3. Routes + Zod + controller (tenant del JWT).
4. Páginas + client API en `features/platform`.
5. Rutas en `App.tsx` + nav.

## 9. Smoke rápido

- [ ] `/?product=erp|pocket|ecommerce` → landings legacy
- [ ] `/?product=campo|taxi|sync` → kits distintos, copy denso
- [ ] Mapas taxi/delivery/flotas (landing + app) sin error MapLibre
- [ ] `/soluciones` y `/soluciones/:slug`
- [ ] Login ProductPicker
- [ ] `/api/health` + pool producto si BD scaffolded

## 10. Fuera de alcance / deuda conocida

- Geo real en BD (maps usan demo Lima).
- Escala multi-instancia Azure (estado en memoria/cron) — no cambiado.
- Entitlements/DoD completo por producto (`PRODUCT_DEFINITION_OF_DONE`) — parcial.
- Dependabot vulnerabilities en default branch — aviso de GitHub al push; no de este commit.
