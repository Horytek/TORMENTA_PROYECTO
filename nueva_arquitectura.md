# Backlog Scrum — Mejora RBAC + Planes + Suscripción + Cache + Auditoría

## Convenciones

* **BE**: Backend (Node/Express)
* **DB**: MySQL
* **FE**: Frontend (React)
* **DoD**: Definition of Done
* CRUD = Create/Read/Update/Delete

---

## ÉPICA E1 — Suscripción “Enterprise”: Tenant Status (reemplazar kill-switch de usuarios)

**Objetivo:** dejar de desactivar usuarios masivamente al vencer; bloquear por estado del tenant con opción de “gracia / read-only”.

### HU E1-01 — Como sistema, debo bloquear acceso por estado del tenant sin alterar usuarios

**Criterios de aceptación**

* Si `tenant_status != ACTIVE`, login o requests protegidas quedan bloqueadas según política.
* No se ejecuta `update estado_usuario=0` masivo.
* JWT incluye `tenant_status` (o se puede resolver vía middleware).

**Tareas técnicas**

1. **DB**: agregar campos a `tenant` (o tabla equivalente)

   * `tenant_status ENUM('ACTIVE','SUSPENDED','GRACE') DEFAULT 'ACTIVE'`
   * `grace_until DATETIME NULL` (opcional)
   * `suspended_reason VARCHAR(255) NULL` (opcional)
2. **BE**: crear `tenantStatus.middleware.js`

   * lee `id_tenant` del JWT
   * resuelve estado (cacheable)
   * aplica política:

     * `ACTIVE`: ok
     * `GRACE`: permitir solo endpoints “lectura” (opcional) o permitir todo según config
     * `SUSPENDED`: 401/403 + mensaje estándar
3. **BE**: modificar `auth.controller.js`

   * quitar lógica de desactivar usuarios
   * setear `tenant_status` a `SUSPENDED` cuando vence (si aplica)
4. **BE**: tests

   * casos ACTIVE/GRACE/SUSPENDED
5. **FE**: manejar respuestas de bloqueo (pantalla “Suscripción vencida”)
6. **DoD**: despliegue no rompe login; usuarios conservan estado original.

---

## ÉPICA E2 — Cache por versión (perm_version) + coherencia inmediata de permisos

**Objetivo:** invalidación determinística en cambios de permisos sin depender solo de TTL.

### HU E2-01 — Como sistema, debo invalidar cache de menú/permisos por versión al guardar permisos

**Criterios de aceptación**

* Tras `savePermisos`, el menú refleja cambios inmediatamente.
* Cache keys incluyen `perm_version`.
* Se incrementa versión en cada update de permisos.

**Tareas técnicas**

1. **DB**: agregar `perm_version INT NOT NULL DEFAULT 1` a:

   * `tenant` o tabla `rol` (recomendado: `tenant.perm_version` + opcional `rol.perm_version`)
2. **BE**: actualizar `savePermisos` (permisos.controller.js)

   * transacción: delete permisos actuales + batch insert
   * incrementar `perm_version` al final (tenant o rol)
3. **BE**: cache keys nuevas (queryCache o Redis si existe)

   * `menu:{tenant}:{rol}:{plan}:{perm_version}`
   * `perms:{tenant}:{rol}:{perm_version}`
4. **BE**: actualizar `getPermisosByRol` y `getMenu` (donde aplique)

   * usa versión al construir key
5. **Tests**

   * al cambiar permisos, el siguiente request ya no usa key anterior
6. **DoD**: comprobado con flujo: login → menú → cambiar permisos → refresh → menú actualizado.

---

## ÉPICA E3 — Auditoría de cambios (permisos/planes) y trazabilidad mínima

**Objetivo:** registrar “quién cambió qué y cuándo” para soporte y seguridad.

### HU E3-01 — Como admin, quiero ver un log de cambios de permisos y planes

**Criterios de aceptación**

* Cada acción de guardar permisos (local y global) crea un registro auditable.
* Incluye actor, tenant afectado, rol, tipo de cambio, timestamp.

**Tareas técnicas**

1. **DB**: crear tabla `audit_log`

   * `id`, `actor_user_id`, `actor_role`, `id_tenant_target`, `entity_type`, `entity_id`, `action`, `before_json`, `after_json`, `ip`, `user_agent`, `created_at`
2. **BE**: helper `auditLogger.js`

   * captura metadata request (ip, ua)
3. **BE**: instrumentar:

   * `permisos.controller.savePermisos`
   * `permisosGlobales.controller.savePermisosGlobales` (o su reemplazo futuro)
   * `modulos.controller` (create/update/delete)
4. **BE**: endpoint lectura

   * `GET /audit?tenant=...&entity=...&limit=...`
5. **FE**: vista básica (tabla + filtros)
6. **DoD**: logs visibles y consultables; no impacta performance significativamente (usar async o batch si hace falta).

---

## ÉPICA E4 — Nuevo modelo: Plantillas de Plan (Plan Template) + Overrides por Tenant

**Objetivo:** eliminar el riesgo del “push destructivo” separando defaults por plan y personalizaciones del tenant.

### HU E4-01 — Como sistema, debo tener “Entitlements del plan” versionables

**Criterios de aceptación**

* Existe entidad “plan_template_version”.
* Entitlements definen módulos/submódulos incluidos.
* Se puede consultar “qué incluye el plan” para filtrar UI.

**Tareas técnicas**

1. **DB**: tablas nuevas

   * `plan_template_version(id, id_plan, version, status ENUM('DRAFT','PUBLISHED'), created_at, published_at, created_by)`
   * `plan_entitlement_modulo(id, template_version_id, id_modulo)`
   * `plan_entitlement_submodulo(id, template_version_id, id_submodulo)`
   * (Opcional) unique constraints por template_version + id_modulo/submodulo
2. **BE**: controlador `planTemplates.controller.js`

   * CRUD draft
   * publish: set status= PUBLISHED y marcar como “current” del plan
3. **BE**: modificar `getModulosConSubmodulosPorPlan`

   * en vez de `plan_modulo/plan_submodulo` directo, usar plantilla publicada actual
   * mantener compatibilidad: fallback a tablas viejas mientras migras
4. **FE**: admin pantalla “Entitlements por plan”
5. **DoD**: plan filtra módulos igual que hoy, pero desde plantilla versionada.

---

### HU E4-02 — Como sistema, debo aplicar permisos por defecto del plan sin pisar overrides de tenant

**Criterios de aceptación**

* Los roles del tenant heredan defaults del plan.
* Si hay override, se respeta.
* Se puede calcular “permiso efectivo”.

**Tareas técnicas**

1. **DB**: tablas de defaults por rol y overrides

   * `plan_role_template(id, template_version_id, id_rol_global, id_submodulo, perm_mask INT)`
   * `tenant_role_override(id, id_tenant, id_rol, id_submodulo, perm_mask INT, updated_at)`
2. **BE**: resolver autorización central `authz.service.js`

   * entrada: `tenant`, `plan`, `rol`, `submodulo`
   * lógica:

     * si no está en entitlements → deny/hidden
     * si override existe → usar override
     * else usar default del plan_role_template
     * else fallback a permisos locales actuales (compatibilidad)
3. **BE**: actualizar endpoints existentes

   * `getPermisosByRol`: ahora devuelve “efectivos” + marca fuente (override/default/local)
4. **FE**: UI de permisos

   * mostrar indicador: (Default plan / Override tenant)
5. **DoD**: cambiar globales no destruye personalizaciones.

---

## ÉPICA E5 — Migración controlada desde modelo actual (compatibilidad sin downtime)

**Objetivo:** introducir el nuevo modelo sin romper tenants.

### HU E5-01 — Como sistema, debo migrar plan_modulo/plan_submodulo a plan_template_version

**Criterios de aceptación**

* Script de migración crea versión 1 por plan.
* Copia entitlements.
* Mantiene integridad.

**Tareas técnicas**

1. **DB**: script SQL/Node migration

   * por cada plan_pago:

     * crear `plan_template_version` v1 PUBLISHED
     * copiar `plan_modulo` → `plan_entitlement_modulo`
     * copiar `plan_submodulo` → `plan_entitlement_submodulo`
2. **BE**: feature flag `USE_PLAN_TEMPLATES`
3. **Tests**: comparar outputs de “filtrado por plan” antes/después
4. **DoD**: salida idéntica en ambos modos.

---

### HU E5-02 — Como sistema, debo migrar permisos globales “push” a defaults por plan (plan_role_template)

**Criterios de aceptación**

* Se crean defaults basados en la configuración actual de permisos globales.
* Los tenants no cambian su experiencia al activar flag.

**Tareas técnicas**

1. Crear script:

   * leer “permiso global por plan y rol” actual
   * poblar `plan_role_template` en template_version activa
2. `authz.service.js` fallback seguro:

   * si no encuentra default, usar permisos locales actuales
3. DoD: tenants quedan iguales tras activar el flag.

---

## ÉPICA E6 — Reemplazo de “Push Update” por “Versionado + Aplicación no destructiva”

**Objetivo:** cuando se editen globales, crear nueva versión y ofrecer estrategias de aplicación.

### HU E6-01 — Como superadmin, quiero publicar una nueva versión del template y ver su impacto

**Criterios de aceptación**

* Publicar no modifica tenants automáticamente.
* Se puede listar tenants afectados y detectar overrides existentes.

**Tareas técnicas**

1. **BE**: endpoint `POST /plans/:id/publish-template`
2. **BE**: job/servicio “impact analysis”

   * cuenta tenants por plan
   * detecta roles con overrides
3. **FE**: panel “Impacto”

   * total tenants
   * tenants con overrides
4. **DoD**: publicación segura y visible.

---

### HU E6-02 — Como superadmin, quiero aplicar cambios con estrategia (merge/reset/manual)

**Criterios de aceptación**

* “Reset a defaults” afecta solo tenants seleccionados.
* “Merge respetando overrides” no pisa overrides.
* “Manual” deja tenant igual.

**Tareas técnicas**

1. **BE**: endpoint `POST /plans/:id/apply-template`

   * payload: lista tenants + strategy
2. **BE**: implementación de estrategias:

   * reset: limpiar overrides + regenerar permisos locales (si aún existen)
   * merge: mantener overrides, recalcular efectivos
3. **Audit**: registrar cada aplicación
4. **DoD**: ejecución idempotente (no duplica registros).

---

## ÉPICA E7 — Endpoint “Why denied” (explicabilidad de autorización)

**Objetivo:** soporte rápido: saber por qué un usuario no ve/no accede.

### HU E7-01 — Como soporte/admin, quiero consultar por qué se denegó una ruta/submódulo

**Criterios de aceptación**

* Respuesta incluye motivo principal:

  * “Plan no incluye módulo”
  * “Rol sin permiso READ”
  * “Tenant suspended”
* Devuelve fuente: entitlement/default/override/local.

**Tareas técnicas**

1. **BE**: endpoint `GET /authz/why`

   * params: id_usuario o id_rol + id_submodulo (o route)
2. **BE**: en `authz.service.js`, devolver `decision + reasons[] + source`
3. **FE**: modal en admin “Explicar acceso”
4. **DoD**: útil en producción, sin filtrar datos sensibles.

---

## ÉPICA E8 — Hardening: Integridad, constraints, performance e índices

**Objetivo:** evitar duplicados, mejorar consultas y consistencia.

### HU E8-01 — Como sistema, quiero constraints e índices para evitar permisos duplicados y mejorar lecturas

**Criterios de aceptación**

* No hay duplicados por tenant/rol/submódulo.
* Consultas de menú y permisos no hacen full scans.

**Tareas técnicas**

1. **DB**: índices recomendados

   * `permisos (id_tenant, id_rol, id_submodulo)`
   * `tenant_role_override (id_tenant, id_rol, id_submodulo)` UNIQUE
   * `plan_role_template (template_version_id, id_rol_global, id_submodulo)` UNIQUE
2. **BE**: ajustar queries para usar índices
3. **Tests**: carga básica (menú con 100+ submódulos) sin degradación
4. **DoD**: explain plan revisado en queries críticas.

---

# Sprints sugeridos (orden práctico)

### Sprint 1 (seguridad + base)

* E1 (tenant_status)
* E2 (perm_version cache)
* E3 (audit básico)

### Sprint 2 (nuevo modelo base)

* E4-01 (plan_template_version + entitlements)
* E5-01 (migración entitlements)

### Sprint 3 (overrides + authz central)

* E4-02 (plan_role_template + tenant overrides + authz.service)
* E5-02 (migración defaults)

### Sprint 4 (reemplazo del push)

* E6 (publish + apply strategies)
* E7 (why denied)
* E8 (hardening)

---

# Checklist DoD global (para todas las historias)

* ✅ Migraciones con rollback (o script reversible).
* ✅ Tests unitarios mínimos + 1 test e2e por flujo.
* ✅ Auditoría activa en cambios críticos.
* ✅ No romper compatibilidad: feature flag o fallback.
* ✅ Documentación corta: “cómo funciona” + “cómo migrar”.
