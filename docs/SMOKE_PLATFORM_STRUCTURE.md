# Smoke + estructura Horytek (admin / cliente / operador)

Generado como parte del plan *Landing + login admin + smoke*.  
Re-ejecutar auditoría estática: `node src/scripts/audit_platform_structure.js` (desde la raíz del repo).

## Credenciales / seeds de prueba (local)

| Superficie | Cómo crear | Notas |
|------------|------------|--------|
| ERP admin | Usuario local en `db_tormenta` | Login `/login?mode=erp` → `/dashboard` o `adminPath` del mode |
| Ecommerce | Cuenta tienda existente | `/login?mode=ecommerce` → `/ecommerce-admin` |
| Pocket | Express register/login | `/login?mode=express` |
| Taxi / Delivery / Flotas / Academia / Agenda | En admin del producto: “Crear operador” (bootstrap) con slug+email+pass | Luego `/login?mode=taxi` tab Administrador → `*-admin` |
| Portales públicos | Mismo slug del bootstrap | `/taxi/:slug`, `/delivery/:slug`, `/b2b/:slug`, etc. |
| Platform ERP (`/platform/*`) | Sesión ERP | Tras login ERP navegar a `/platform/campo`, `/platform/sync`, … |

**Demo sugerido (local):** slug `demo`, email `admin@demo.local`, password `Demo1234!` al hacer bootstrap en cada producto con auth propia.

## Login (post-cambio)

- Tab **Administrador**: creds (ERP o producto) → `adminPath`.
- Tab **Portal**: slug → `clientPath`.
- CTA / card activa: accent por `loginMode` (`loginAccents.ts`).
- Admins con JWT propio (`/taxi-admin`, …) **fuera** de `ProtectedRoute` ERP.

## Matriz (rellenar en cada smoke)

| productId | landing | loginAdmin | adminUI | clientUI | operadorUI | api/pool | estructura | notas |
|-----------|---------|------------|---------|----------|------------|----------|------------|-------|
| erp | | | | N/A | N/A | | | |
| … | | | | | | | | |

Estados: OK / FAIL / PARTIAL / N/A

## Gaps estructurales conocidos (baseline)

1. Varios productos `loginMode=erp` comparten una sola card “ERP” en el picker (destino post-login = primer `adminPath` del mode → `/dashboard`).
2. Portales sin seed → 404 amable o mensaje API (preventa/agenda a veces axios crudo).
3. Operador routes (`/campo/vendedor`, `/taxi/:slug/conductor`, …) no estánidas en picker de login (acceso directo por URL).
4. Catálogo WA reusa ERP (sin BD propia) — OK documentado.
5. Pocket `adminPath` `/express-pos/dashboard` es ruta anidada (auditoría heurística puede marcar FAIL; en App existe bajo `/express-pos`).
6. Auditoría estática (20 productos): admin/client routes OK; pools olas A–E presentes; admins JWT propios fuera de `ProtectedRoute`.

## Checklist runtime

- [ ] `/?product=<id>` identidad distinta (commerce vs mobility vs rail)
- [ ] Nav muestra nombre del producto; anchors `#producto` `#incluye` `#flujo` `#planes` `#preguntas`
- [ ] `/login?mode=taxi` → Admin form (no solo slug) → `/taxi-admin`
- [ ] Portal tab → `/taxi/demo` (o empty amable)
- [ ] `/soluciones` cards + CTA landing
- [ ] `/api/health` UP
