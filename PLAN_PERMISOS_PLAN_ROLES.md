# Plan de mejora — Permisos por Plan × Rol (v2)

> Continuación de `nueva_arquitectura.md` (épicas E1–E8). Este documento parte del
> **estado real del código al 2026-07-18** (rama `feature/frontend-v2`), separa lo
> que ya está construido de lo que sigue hardcodeado, y propone fases concretas.
> Regla transversal: pagos y SUNAT son zona sagrada (CLAUDE.md §8) — en esas rutas
> solo se AGREGA autorización, nunca se cambia lógica de negocio sin confirmación.

---

## 1. Estado actual (verificado en código)

### Ya construido ✅

| Pieza | Dónde | Épica |
|---|---|---|
| Tenant status (ACTIVE/GRACE/SUSPENDED) | `empresa.tenant_status`, `tenantStatus.middleware.js` | E1 |
| `perm_version` por tenant (se incrementa en `savePermisos`, viaja en el JWT como `pv`) | `permisos.controller.js`, `jwt` | E2 parcial |
| Auditoría de cambios de permisos | `audit_log`, `logAudit`, PermissionsAuditTab | E3 |
| Entitlements versionados por plan (DRAFT→PUBLISHED) | `plan_template_version` + `plan_entitlement_modulo/submodulo`, `planTemplates.controller.js`, PlanEntitlementsTab | E4-01 |
| Defaults por plan vs overrides por tenant | `permisos.id_plan` (= plan → default, NULL → override; override gana) | E4-02 (variante) |
| Resolver central de capabilities efectivas | `AuthZService.getEffectivePermissions` (plan como techo + fuentes) | E4-02 |
| Endpoint efectivo consumido por client-v2 | `GET /authz/roles/:id/effective` → `useUserStore` | Fase 0 del plan viejo |
| Why-denied (backend) | `GET /authz/why` | E7 parcial |
| Catálogo dinámico (sidebar/buscador desde BD) | migración 006 (`icon/group_name/sort_order/frontend_route/is_visible`) + `navigationCatalog.ts` | — |
| Registro de módulos en código + validadores | `src/config/moduleRegistry.js`, `scripts/validate-authz.js`, `validate-registry-sync.js` | — |
| `requireCapability(slug, accion)` aplicado a ~30 archivos de rutas | `authorize.middleware.js` | — |
| UI Developer: entitlements por plan y permisos del Administrador por plan | PlanEntitlementsTab, AdminPlanPermissionsTab | — |
| Matriz de roles marca la fuente de cada permiso (Personalizado / Plantilla del plan) | RolePermissionsDialog | — |

### Lo que sigue hardcodeado / limitado ❌

1. **Tres resolvers de permisos distintos que no coinciden**:
   - `requireCapability` (middleware) hace su propia query cruda a `permisos`
     **sin filtrar `id_plan`** (con default de plan + override de tenant para el
     mismo recurso, el `LIMIT 1` elige una fila arbitraria), **sin techo de
     entitlements**, sin `active_actions`, sin `actions_json`, sin caché
     (+1 query a BD por cada request mutante).
   - `AuthZService.getEffectivePermissions` (el correcto) solo lo usan los
     endpoints `/authz` y el frontend.
   - `permisos.controller.js` (~líneas 346 y 651) aún tiene su propio SQL de
     "efectivos" duplicado.
   El **enforcement real del backend puede diferir de lo que el usuario ve** en
   la UI: ese es el bug estructural más grave.

2. **Jerarquía de planes por convención numérica invertida**: el fallback legado
   usa `pm.id_plan <= planEmpresa` y `planesDisponibles.filter(p => p.id_plan <= planEmpresa)`
   (`permisosGlobales.controller.js`), asumiendo Enterprise=1 < Pro=2 < Básico=3.
   Crear un plan nuevo con cualquier otro id rompe el filtrado en silencio.

3. **Features y límites hardcodeados**: `featureAccess.js` tiene un `featureMap`
   en código con ids mágicos y límites fijos (`max: 3`), lee `plan_pago.funciones`
   (CSV de ids) y además el chequeo de límites tiene un bug (`[[{ total }]] = ...`
   sin declarar → ReferenceError → 500 cuando `checkLimit` aplica).
   `plans.config.js` duplica ids y precios de planes en código (y es CommonJS en
   un proyecto ESM).

4. **Roles mágicos**: `id_rol = 1` = admin/titular y `id_rol = 10` = developer
   están regados por todo el código. Peor: `isDeveloperReq` también acepta
   `nameUser === "desarrollador"` — **cualquier tenant que cree un usuario con
   ese nombre obtiene superpoderes de developer** (escalación de privilegios
   entre tenants). `resolvePlanId` asume que el titular es el primer usuario
   rol 1. `PlanSynchronizer.js` está lleno de comentarios adivinando a qué rol
   sincronizar.

5. **Push destructivo aún vivo (E6 pendiente)**: `savePermisosGlobales` hace
   `DELETE + INSERT` de los defaults (`id_plan = X`) para **todos los tenants
   del plan** de una vez, sin análisis de impacto ni estrategias (merge/reset).
   Los overrides (`id_plan NULL`) sobreviven, pero no hay visibilidad de qué se
   pisó.

6. **9 archivos de rutas con endpoints mutantes sin autorización de rol**
   (salida real de `node scripts/validate-authz.js`): `sunat.routes.js` (11 rutas
   mutantes — emisión de comprobantes solo con `auth`), `payment.routes.js` (4),
   `uploads.routes.js`, `logs.routes.js` (cleanup), `talla/tonalidad/unidades`,
   `funciones`, `email`.

7. **Caché frágil**: `AuthZService` usa un `Map` con TTL 60 s e invalidación
   global (`clearCache()`), sin usar `perm_version` en las keys (E2 a medias).
   Asume instancia única (CLAUDE.md §10).

8. **UX del plan inexistente**: los módulos fuera del plan simplemente
   desaparecen (no hay "No incluido en tu plan — mejorar"), un 403 de rol y un
   403 de plan son indistinguibles para el frontend, y las cuotas (3 sucursales)
   solo se descubren al chocar con el error.

---

## 2. Plan por fases

### Fase 0 — Seguridad inmediata (1–2 días, sin migraciones)

| # | Tarea | Archivos |
|---|---|---|
| 0.1 | Eliminar el bypass `nameUser === "desarrollador"` de `isDeveloperReq` (dejar solo `id_rol === 10`). Verificar antes que el usuario developer real tenga rol 10 en prod. | `authorize.middleware.js` |
| 0.2 | Corregir `requireCapability`: filtrar `(p.id_plan IS NULL OR p.id_plan = ?)` con el plan del tenant y priorizar el override — hoy elige fila arbitraria. (Solución definitiva en Fase 1; este es el parche mínimo.) | `authorize.middleware.js` |
| 0.3 | Gatear las 9 rutas con warnings del validador. SUNAT y payment primero (solo agregar middleware, cero cambios de lógica — zona sagrada). Meta: `validate-authz.js` en 0 warnings y correrlo en CI. | `sunat.routes.js`, `payment.routes.js`, `uploads`, `logs`, `talla`, `tonalidad`, `unidades`, `funciones`, `email` |
| 0.4 | Arreglar el ReferenceError de `featureAccess.js` (`[[{ total }]]` sin declarar) y liberar la conexión en `finally` (hoy se fuga en cada llamada). | `featureAccess.js` |

### Fase 1 — Un solo resolver, cacheado por versión (2–4 días)

| # | Tarea | Detalle |
|---|---|---|
| 1.1 | `requireCapability` delega en `AuthZService.getEffectivePermissions` | El middleware deja de tener SQL propio. Mismo techo de plan, mismos `active_actions`, mismas `actions_json` que ve el frontend. Enforcement = UI, por construcción. |
| 1.2 | Caché por versión (cierra E2) | Key `perms:{tenant}:{rol}:{plan}:{perm_version}`. El `pv` ya viaja en el JWT → 0 queries extra para validar frescura. Incrementar `perm_version` también en `savePermisosGlobales`, publish de plantillas y `PlanSynchronizer` (hoy solo `savePermisos` lo hace). |
| 1.3 | Matar el SQL duplicado de `permisos.controller.js` (l. 346/651) | Ambos endpoints llaman al servicio y devuelven además `source` por permiso. |
| 1.4 | Invalidación selectiva | Reemplazar `clearCache()` global por borrado de keys del tenant/plan afectado. Si algún día hay 2+ instancias: mover a Redis (decisión abierta, no bloquea). |

### Fase 2 — Planes 100 % data-driven (3–5 días, incluye migraciones ⚠️ confirmar antes de DDL)

| # | Tarea | Detalle |
|---|---|---|
| 2.1 | Completar E5: plantilla v1 PUBLISHED para **todos** los planes | Script que copia `plan_modulo`/`plan_submodulo` → entitlements por plan. Comparar salida antes/después (mismo criterio que E5-01). |
| 2.2 | Eliminar el fallback `id_plan <= plan` | Con 2.1 hecho, borrar la rama legada de `permisosGlobales.controller.js` y `getRolesPorPlan`. La jerarquía de planes deja de ser "orden numérico del id" y pasa a ser exactamente lo que diga la plantilla. |
| 2.3 | Features y límites por plan en BD | Tabla `plan_feature (id_plan, feature_key, enabled, limite)` que reemplaza `plan_pago.funciones` (CSV) + el `featureMap` hardcodeado. `checkFeatureAccess` y `limites.service.js` leen de ahí (con caché de Fase 1). Editable desde PlanEntitlementsTab (nueva sección "Funciones y límites"). |
| 2.4 | Roles del sistema con flag, no con id mágico | Columnas `rol.es_titular` / `rol.es_sistema` (o `rol.tipo`). `resolvePlanId`, `PlanSynchronizer`, `usePermissions` (frontend) y todos los `id_rol === 1/10` migran al flag. Los ids 1/10 quedan como datos, no como contrato. |
| 2.5 | Precios de planes | Sacar ids/precios de `plans.config.js` a columnas de `plan_pago` (`precio_mensual`, `precio_anual`). ⚠️ Toca el flujo de pagos (MercadoPago) → hacerlo al final, con confirmación explícita y validación server-side intacta. |

### Fase 3 — Publicación no destructiva de defaults (E6) (3–4 días)

| # | Tarea | Detalle |
|---|---|---|
| 3.1 | Análisis de impacto al publicar | `POST /authz/plans/:id/impact`: cuántos tenants usan el plan, cuáles tienen overrides y sobre qué recursos. Panel en AdminPlanPermissionsTab antes de "Aplicar". |
| 3.2 | Aplicación con estrategia | `merge` (default: solo pisa defaults, conserva overrides — lo de hoy pero explícito), `reset` (borra overrides de tenants seleccionados), `manual` (publica sin aplicar). Idempotente + auditado. |
| 3.3 | Defaults para roles no-admin | Decisión abierta (ver §3). Cierra los TODO de `PlanSynchronizer`. |

### Fase 4 — UX de plan en el frontend (2–3 días, client-v2)

| # | Tarea | Detalle |
|---|---|---|
| 4.1 | Errores 403 distinguibles | Respuesta estándar `{ success:false, code: "ROLE_DENIED" \| "PLAN_NOT_INCLUDED" \| "LIMIT_REACHED" \| "TENANT_SUSPENDED" }` desde el middleware. El interceptor de axios los mapea a UI distinta. |
| 4.2 | Módulos fuera del plan visibles en gris | En RolePermissionsDialog y sidebar: "No incluido en tu plan — Mejorar" (hoy desaparecen y el admin cree que es un bug). Requiere que el catálogo devuelva también los no-entitled con un flag `in_plan`. |
| 4.3 | Cuotas visibles | "2/3 sucursales usadas" en Branches/Warehouses + CTA de upgrade al llegar al límite (datos de `plan_feature` de 2.3). |
| 4.4 | UI de why-denied | Modal "Explicar acceso" en Developer/Roles usando `GET /authz/why` (ya existe el backend). |

---

## 3. Decisiones abiertas (para decidir antes de Fase 2/3)

1. **¿Tabla `plan_role_template` separada (backlog E4-02 original) o seguir con
   `permisos.id_plan`?** Recomendación: **seguir con `permisos.id_plan`** — ya
   funciona, el override gana, la migración es cero. Solo crear
   `plan_role_template` si se necesitan defaults *versionados* por rol no-admin.
2. **Defaults para roles no-admin**: ¿cada tenant define sus roles desde cero
   (hoy) o el plan trae plantillas de roles sugeridos ("Vendedor", "Almacenero")
   que se copian al crear el tenant? Afecta 3.3.
3. **Redis para caché/presencia** cuando se escale a 2+ instancias (CLAUDE.md
   §10). No bloquea nada de este plan; el diseño de keys de Fase 1 ya es
   compatible.
4. **Precios en BD (2.5)**: requiere plan de rollout con MercadoPago (webhooks
   validan montos). Puede posponerse indefinidamente sin afectar el resto.

## 4. Riesgos y mitigaciones

- **Zona sagrada**: Fase 0.3 (sunat/payment) y 2.5 (precios) solo con
  confirmación explícita y en PRs separados y pequeños.
- **Enforcement nuevo puede denegar donde antes permitía** (Fase 1.1): correr en
  modo *shadow* primero — el middleware evalúa ambos resolvers y loguea
  divergencias (`audit_log`) sin bloquear; activar el nuevo con flag
  `AUTHZ_UNIFIED=1` tras una semana sin divergencias.
- **Migración E5 (2.1)**: script compara el catálogo por plan antes/después;
  fallback se elimina solo cuando la salida es idéntica para todos los planes
  reales de prod.
- **Sin suite de tests**: cada fase agrega al menos un script de verificación
  ejecutable (estilo `validate-authz.js`) que quede en CI.

## 5. Orden sugerido

`Fase 0` (ya) → `Fase 1` → `Fase 4.1–4.2` (dependen solo de F1) → `Fase 2` →
`Fase 3` → `Fase 4.3–4.4`. Total estimado: ~3 semanas de trabajo efectivo,
entregable por PRs chicos e independientes.
