# Cambios pendientes — plataforma, login y demos

Resumen de trabajo local en `feature/frontend-v2` aún no subido (antes del commit de este documento). Fecha de referencia: 2026-08-09.

## 1. Login unificado y demos

- Login único por producto (`ProductPicker`) con acentos por modo (`loginAccents.ts`).
- Paneles multi-rol: `TaxiLoginPanel`, `DeliveryLoginPanel`, `LoginRoleTabs`.
- Tarjeta `DemoAccessCard` (credenciales enmascaradas; sin copy interno tipo `SEED_TENANT_ID` / `npm run seed`).
- Bundles demo: `loginDemoBundles.ts`, `demoPortalCreds.ts`, `useDemoAutoEnter.ts`.
- Auth admin de productos: `productAdminAuth.ts`.
- Eliminación del gate/admin auth shell: portales sin sesión → `/login?mode=…`; demo auto-enter en slug `demo`.
- Landing: `DemoSurfacesDropdown`, CTAs de demo, bridges de soluciones, headers contextuales.

## 2. Panel izquierdo del login (brand + escenas)

- `LoginBrandPanel`: atmósfera del theme, `Horytek {Producto}`, pitch + métricas, crossfade al cambiar producto.
- Escenas únicas por producto en `login-scenes/` (comercio, ops/movilidad, personas).
- Copy: `loginBrandPanels.ts`.
- Themes completos en `productThemes.ts` (20 productos + alias `express`→pocket, `validar`→erp).
- Pocket acento ámbar (`#f59e0b`) alineado al botón; Ecommerce teal-700 (`#0f766e`).
- Título del formulario unificado: micro “Iniciar sesión” + `Horytek {Producto}`.

## 3. Navbar de producto (apps / ops)

- `ProductAppBar`: Horytek + producto | empresa (logo/iniciales) | rol | Salir / Home.
- Integrado en `PlatformShell` y `OpsShell`; título de pantalla debajo del bar.
- Portales y admins pasan `companyName` / `roleLabel`; Delivery admin migrado a `PlatformShell`.
- UI compartida: `EmptyState`, `FilterBar`, `KpiStrip`, `StatusChip`, `OpsShell`, `portalTouch`, etc.

## 4. Landings y soluciones

- Layouts experience / section variants; `ExperienceBody`, `BenefitPillars`, `TrustStrip`, `SolutionsBridge`.
- Ajustes en Hero, Header, MarketingHeader, PricingModular, mapas Lima / Ship.
- Páginas Soluciones / producto / bundle / payment flow.
- Registro plataforma: `RegisterPlatformPage.tsx`.

## 5. Backend platform + pagos

- `platformWaves` controller/routes/schema ampliados.
- `payment.controller.js`: activación operador tras pago (bootstrap `activo=0` hasta webhook cuando aplica).
- `horytekProducts.config.js` alineado al catálogo.
- Scripts:
  - `npm run seed:platform-demo` → `src/scripts/seed_platform_demo.js`
  - `npm run seed:express` → `src/scripts/seed_express_demo.js` (Pocket)
  - `src/scripts/audit_platform_structure.js`
- Docs: `docs/DEMO_SEEDS_PLATFORM.md`, `docs/SMOKE_PLATFORM_STRUCTURE.md`

### Credenciales demo Pocket (local)

| Rol | Login | Password |
|-----|--------|----------|
| Admin | `demo.pocket@horytek.test` | `PocketDemo2026!` |
| Cajero | `CajeroDemo@caja1` | `PocketDemo2026!` |

```bash
npm run seed:express
```

## 6. Páginas platform tocadas

Admins y portales de Taxi, Delivery, Flotas, Academia, Agenda, Mayorista, Sync, CRM, Envíos, WMS, Despacho, Campo, Taller, Preventa, Mantenimiento, Recluta, Tracking, etc. — shells unificados, demos y UX compacta.

## Cómo verificar

```bash
npm run seed:platform-demo   # olas platform
npm run seed:express         # Pocket
# Backend + client-v2, luego:
# /login?mode=express | taxi | delivery | erp …
```

## Nota

No incluye secretos de `.env`. Seeds solo para MySQL local.
