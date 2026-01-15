# Guía completa para refactorizar la arquitectura de permisos (Globales + Individuales)

Esta guía está diseñada para que **tú, otro ingeniero u otra IA** puedan modificar la estructura completa de permisos sin “tumbar” el sistema.

El repo actualmente mezcla **RBAC**, **planes**, **acciones dinámicas** y **gating de UI** en varios lugares. El objetivo es unificar el contrato y separar responsabilidades.

---

## 0) Resumen ejecutivo (por qué se cae hoy)

### 0.1. Riesgo crítico (root cause real)

Hoy existe **una sola tabla** `permisos` que se usa para:

- Permisos “individuales” por **tenant** (`id_tenant`) sin `id_plan`.
- Permisos “globales” por **plan** (`id_plan`) replicados por tenant.

El endpoint de permisos individuales:

- `POST /permisos/save` (ver `savePermisos` en `src/controllers/permisos.controller.js`)

borra con:

- `DELETE FROM permisos WHERE id_rol = ? AND id_tenant = ?`

Esto **borra también** los permisos globales de ese tenant (los que tienen `id_plan`) porque **no filtra por `id_plan`**.

Resultado: después de “guardar permisos individuales”, un tenant puede quedarse sin permisos “globales” y el menú/rutas/validaciones se rompen.

### 0.2. Otros problemas estructurales que amplifican fallos

- **Dos lógicas de autorización en frontend**: capability vs id_modulo/id_submodulo (`client/src/routes.jsx`).
- **Cálculo de capabilities depende de rutas** (`modulo_ruta`/`submodulo_ruta`) y de que el backend devuelva datos consistentes (`client/src/context/Auth/AuthProvider.jsx`).
- **Acciones dinámicas** (`actions_json`) se usan en UI global, pero no están persistidas correctamente en backend global.
- **Reglas “developer override” inconsistentes**:
  - Individual: developer = `nameUser === 'desarrollador'`
  - Global: developer = username o `id_rol == 10` consultando DB.
  - Front: developer = `user.rol === 10`.

---

## 1) Mapa del sistema actual (para no perderse)

### 1.1. Endpoints actuales

Permisos individuales (tenant):
- `GET /permisos` → módulos/submódulos (`getModulosConSubmodulos`)
- `GET /permisos/roles` → roles (`getRoles`)
- `GET /permisos/roles/:id_rol` → permisos por rol (`getPermisosByRol`)
- `POST /permisos/save` → guarda permisos por rol (`savePermisos`)
- `GET /permisos/check` → check legacy por id_modulo/submodulo (`checkPermiso`)

Permisos globales (plan):
- `GET /permisos-globales/modulos-plan` → módulos/submódulos filtrados por plan (`getModulosConSubmodulosPorPlan`)
- `GET /permisos-globales/roles-plan` → roles filtrados por plan (`getRolesPorPlan`)
- `GET /permisos-globales/permisos-rol/:id_rol?plan=` → permisos globales (`getPermisosByRolGlobal`)
- `POST /permisos-globales/save-global` → guarda globales (`savePermisosGlobales`)
- `GET /permisos-globales/check-global` → check global legacy (`checkPermisoGlobal`)

Fuentes:
- `src/routes/permisos.routes.js`
- `src/routes/permisosGlobales.routes.js`

### 1.2. Frontend: dónde se decide ver/habilitar

**Gating de rutas y permisos de UI**:
- `client/src/routes.jsx` → `RoutePermission` + `PermisosContext` + `usePermisos()`.

Dos modos:
1) **Nuevo**: `capability="clientes"` → usa `capabilities` (Set)
2) **Legacy**: `idModulo`, `idSubmodulo` → usa `permissions[]` (lista de DB)

**Cálculo de capabilities**:
- `client/src/context/Auth/AuthProvider.jsx` → `loadPermissions(roleId)` llama `getPermisosByRol(roleId)` y convierte a `capabilities`:
  - `base = (submodulo_ruta || modulo_ruta).toLowerCase()`
  - `base.view|create|edit|delete|generate|deactivate`

**Store**:
- `client/src/store/useStore.js` → guarda `permissions[]` y `capabilities:Set`.

### 1.3. UIs de administración de permisos

Individual (tenant):
- `client/src/pages/Roles/ComponentsRoles/TablaPermisosContent.jsx`
  - Estado por rol: `permisosData[currentRoleId]["modulo_#"|"submodulo_#"]`.
  - Acciones estándar: ver/crear/editar/eliminar/desactivar/generar.

Global (plan):
- `client/src/pages/Global/PermisosGlobales/TablaPermisosGlobales.jsx`
  - Estado por rol+plan: `permisosData["{roleId}_{plan}"]`.
  - Flatten de acciones dinámicas: `...permiso.actions_json`.
  - Guardado intenta mandar `actions_json`.
- `client/src/pages/Global/PermisosGlobales/ModuloPermisos.jsx`
  - Filtra acciones disponibles con `active_actions` (DB) o reglas hardcode fallback.
- `client/src/pages/Global/PermisosGlobales/ModuleConfigModal.jsx`
  - Permite configurar `active_actions` para módulo/submódulo.

### 1.4. Acciones dinámicas

- Migración: `scripts/migration_003_dynamic_actions.js` crea `permission_action_catalog` y agrega columna `actions_json` a `permisos`.

Problemas actuales:
- Global backend (`savePermisosGlobales`) **no inserta** `actions_json`.
- Global backend (`getPermisosByRolGlobal`) **no selecciona** `actions_json`.
- Individual UI **no maneja** `actions_json` (no lo carga/edita), pero `savePermisos` lo escribe (si no llega, lo deja en `{}`), lo que puede “resetear” acciones dinámicas.

---

## 2) Principios de diseño para el refactor (lo que SI debe quedar)

### 2.1. Separación de responsabilidades

Separar claramente:

1) **Catálogo**: qué existe
   - módulos/submódulos + rutas
   - acciones estándar + dinámicas
   - `active_actions` = qué acciones aplican por recurso

2) **Entitlements de plan**: qué incluye un plan
   - si un submódulo no está en el plan, debe ser **hidden/deny** aunque el rol tenga permisos.

3) **Grants / permisos**: qué acciones están permitidas
   - se deben poder editar y versionar.

4) **Resolución de permisos efectivos**:
   - defaults por plan + overrides por tenant
   - precedencia: `override tenant` pisa `default plan`.

### 2.2. Un contrato único para UI (capabilities)

La UI debe consumir una sola abstracción:

- `capabilities: Set<string>` con claves `"{slug}.{action}"`.

Ejemplo:
- `inventario.view`
- `inventario.create`
- `kardex.generate`

Regla recomendada:
- Si no tiene `.view`: no se renderiza la sección.
- Si tiene `.view` pero no la acción: se renderiza pero se deshabilita el botón.

Esto evita que el sistema dependa de `id_modulo/id_submodulo` dispersos por todas partes.

---

## 3) Objetivo arquitectónico recomendado (alineado con `nueva_arquitectura.md`)

El repo ya propone la solución en `nueva_arquitectura.md` (ÉPICA E4):

- `plan_template_version` + entitlements versionables (ya existe migración SQL).
- Defaults por plan/rol.
- Overrides por tenant.

### 3.1. Tablas recomendadas (mínimo viable)

**Catálogo** (ya existe en esencia):
- `modulo`, `submodulos`
- `permission_action_catalog`
- `active_actions` en módulo/submódulo (si aún no existe, crear)

**Entitlements** (ya existe migración):
- `plan_template_version`
- `plan_entitlement_modulo`
- `plan_entitlement_submodulo`

**Permisos** (nuevo modelo recomendado):
- `plan_role_template` (defaults)
- `tenant_role_override` (overrides)

Sugerencia técnica:
- usar `perm_mask INT` (bitmask) o JSON. Bitmask facilita performance y consistencia.

### 3.2. Servicio único de autorización (AuthZ)

Crear `src/services/authz.service.js` (o carpeta `src/services/authz/`), con funciones:

- `getCatalog({ tenantId, planId })`
- `getEffectivePermissions({ tenantId, roleId, planId })`
- `savePlanDefaults({ planId, roleId, grants })` (solo dev)
- `saveTenantOverrides({ tenantId, roleId, grants })` (admin tenant)

Este servicio debe ser la **única** fuente para:
- menú/entitlements
- cálculo de capabilities
- checks de autorización

---

## 4) Migración incremental segura (sin downtime)

### Paso 0: congelar contrato de UI

Mientras migras backend, el frontend debe depender solo de:

- `capabilities` + `user.plan_pago` + `catalog`

y minimizar el uso del check legacy por IDs.

### Paso 1: arreglar el bug destructivo (urgente)

Antes de refactor mayor:

- Evitar que `savePermisos` borre filas globales con `id_plan`.

Opciones temporales:
1) Cambiar delete a:
   - `DELETE FROM permisos WHERE id_rol = ? AND id_tenant = ? AND id_plan IS NULL`
2) O migrar de inmediato a una tabla distinta para overrides.

> Sin este cambio, cualquier mejora futura seguirá pudiendo borrar permisos globales.

### Paso 2: unificar el “Catálogo” y las “acciones disponibles”

Hacer que ambos mundos (global e individual) consuman el mismo catálogo:

- módulos/submódulos
- lista de acciones (estándar + dinámicas)
- `active_actions` por recurso

Ideal: un endpoint único (ej. `GET /authz/catalog`).

### Paso 3: permisos efectivos

Crear endpoint nuevo:

- `GET /authz/roles/:roleId/effective` → devuelve:
  - `capabilities: string[]`
  - `grants` (si la UI de edición los necesita)
  - `source` por grant (`DEFAULT_PLAN` | `TENANT_OVERRIDE`)

Durante transición:
- `AuthProvider.loadPermissions` debe migrar a este endpoint.

### Paso 4: migrar UI de edición

- Reutilizar un componente único `PermissionsMatrix` que renderice módulos/submódulos + acciones.
- Cambiar `TablaPermisosContent` y `TablaPermisosGlobales` a consumir el mismo hook:
  - `useAuthzMatrix({ scope: 'tenant'|'plan', roleId, planId })`.

### Paso 5: eliminar legacy

- Deprecar `idModulo/idSubmodulo` en `RoutePermission`.
- Deprecar `/permisos/check` y `/permisos-globales/check-global`.

---

## 5) Consideraciones especiales (lo que NO se debe olvidar)

### 5.1. Developer override

Definir una sola regla y usarla en todo:

- developer := `roleId === 10` (fuente: JWT) **o** username `desarrollador`.

Recomendación:
- Normalizar a `roleId === 10` en backend y frontend.
- Evitar lógica diferente por endpoint.

### 5.2. Acciones dinámicas y `active_actions`

Separar conceptos:

- `active_actions`: qué acciones existen/aplican (catálogo/feature flags)
- permisos: qué acciones están permitidas (grants)

Reglas:
- UI solo muestra checkboxes para acciones presentes en `active_actions`.
- Permisos nunca deben “inventar” acciones fuera del catálogo.

### 5.3. Caching y coherencia

Hoy hay cache en `permisos.controller.js` (TTL) y además se incrementa `perm_version` en `empresa` (pero el update no está await y no se usa para claves).

Si vas a refactorizar:
- usar `perm_version` como parte de la cache-key.
- invalidar determinísticamente en cada save.

### 5.4. Multi-tenant y seguridad

- `checkPermisoGlobal` actualmente no filtra por `id_tenant` en la query a `permisos`.
  - Esto es riesgoso si hay filas repetidas entre tenants.

Todo check debe incluir:
- `WHERE id_tenant = ?`.

---

## 6) Checklist de implementación (para ingeniero/IA)

### Backend

1) **Auditar la tabla actual `permisos`**
   - confirmar columnas: `id_tenant`, `id_plan`, `actions_json`.
   - confirmar índices y constraints.

2) **Hotfix inmediato**
   - ajustar delete de `savePermisos` para no borrar global.

3) **Implementar AuthZ service**
   - crear `authz.service.js` y mover ahí la lógica.

4) **Crear endpoints nuevos**
   - `GET /authz/catalog`
   - `GET /authz/roles/:id/effective`
   - `POST /authz/roles/:id` con `scope`.

5) **Migración DB a nuevo modelo**
   - aplicar `scripts/migrations/002_sprint2_plan_templates.sql` si no está.
   - crear `plan_role_template` y `tenant_role_override`.
   - migrar datos actuales a defaults/overrides.

6) **Asegurar `actions_json`**
   - incluirlo en selects de permisos.
   - persistirlo en inserts/updates si se mantiene el formato JSON.

### Frontend

1) **Un solo punto de decisión**
   - toda la UI consume capabilities (Set).

2) **Crear helpers de UI gating**
   - `can(capabilities, base, action)`
   - `shouldHide`, `shouldDisable`

3) **Migrar gradualmente los componentes**
   - reemplazar `usePermisos().hasCreatePermission` por `can(caps, 'slug', 'create')`.

4) **Unificar editores**
   - un hook `useAuthzMatrix`.
   - un componente `PermissionsMatrix`.

### Pruebas / validación

- Login como rol normal: menú y pantallas visibles coinciden.
- Guardar permisos individuales: NO debe tocar globales.
- Guardar globales (plan): NO debe pisar overrides.
- Acciones dinámicas:
  - se muestran según `active_actions`.
  - se guardan y se leen (round-trip).
- Multi-tenant: cambios de tenant no afectan a otro.

---

## 7) Señales de éxito (Definition of Done)

- Existe **un solo contrato** de permisos para la UI: `capabilities`.
- Cambiar globales no borra/pisa permisos individuales.
- Cambiar individuales no afecta a otros tenants ni a global.
- Acciones dinámicas funcionan end-to-end.
- `RoutePermission` ya no depende de IDs legacy.

---

## 8) Referencias internas del repo

- Diseño objetivo: `nueva_arquitectura.md` (ÉPICAS E2–E6, en especial E4).
- Controladores actuales:
  - `src/controllers/permisos.controller.js`
  - `src/controllers/permisosGlobales.controller.js`
- UI edición:
  - `client/src/pages/Roles/ComponentsRoles/TablaPermisosContent.jsx`
  - `client/src/pages/Global/PermisosGlobales/TablaPermisosGlobales.jsx`
  - `client/src/pages/Global/PermisosGlobales/ModuloPermisos.jsx`
- Gating:
  - `client/src/routes.jsx`
  - `client/src/context/Auth/AuthProvider.jsx`
- Migraciones:
  - `scripts/migrations/002_sprint2_plan_templates.sql`
  - `scripts/migration_003_dynamic_actions.js`
