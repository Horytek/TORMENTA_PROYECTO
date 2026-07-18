import { getConnection } from "../database/database.js";

const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minute

// Helper to decode buffers
const decodeBuffer = (field) => {
    return field && typeof field === "object" && field.toString
        ? field.toString('utf-8')
        : field;
};

// Columna de permisos → nombre de acción usado en capabilities ("{slug}.{accion}")
const ACTION_COLUMNS = {
    ver: "view",
    crear: "create",
    editar: "edit",
    eliminar: "delete",
    desactivar: "deactivate",
    generar: "generate",
};

function normalizeSlug(ruta) {
    return (ruta || "").toString().toLowerCase().replace(/^\/+/, "");
}

function parseActionsJson(raw) {
    if (!raw) return {};
    if (typeof raw === "object") return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

// `active_actions` (columna en modulo/submodulos): null = todas las acciones
// estándar habilitadas; array = solo esas (mismas claves ver/crear/editar/...
// que usa RolePermissionsDialog/useUserStore en el frontend).
function parseActiveActions(raw) {
    if (raw == null) return null;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try {
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : null;
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Resuelve qué módulos/submódulos incluye el plan (E4): la plantilla PUBLISHED
 * más reciente. Sin plantilla publicada para ese plan, devuelve `null` en los
 * sets (= "no filtrar", compatibilidad con planes que aún no tienen entitlements
 * versionados — ver ÉPICA E5 de nueva_arquitectura.md).
 */
async function resolveEntitlements(connection, planId) {
    if (!planId) return { templateVersionId: null, moduloIds: null, submoduloIds: null };

    const [templateRows] = await connection.query(
        `SELECT id FROM plan_template_version WHERE id_plan = ? AND status = 'PUBLISHED' ORDER BY version DESC LIMIT 1`,
        [planId]
    );
    const templateVersionId = templateRows[0]?.id || null;
    if (!templateVersionId) return { templateVersionId: null, moduloIds: null, submoduloIds: null };

    const [modulos] = await connection.query(
        "SELECT id_modulo FROM plan_entitlement_modulo WHERE template_version_id = ?",
        [templateVersionId]
    );
    const [submodulos] = await connection.query(
        "SELECT id_submodulo FROM plan_entitlement_submodulo WHERE template_version_id = ?",
        [templateVersionId]
    );

    return {
        templateVersionId,
        moduloIds: new Set(modulos.map((r) => r.id_modulo)),
        submoduloIds: new Set(submodulos.map((r) => r.id_submodulo)),
    };
}

export const AuthZService = {
    /**
     * Plan de suscripción del tenant, resuelto desde el **titular** (usuario con
     * `id_rol = 1` de ese tenant) — el mismo criterio que ya usan
     * `limites.service.js`, `auth.controller.js` y `PlanSynchronizer.js` para el
     * "plan del tenant". Único punto para no repetir esta query en cada
     * controller que necesite "el plan de este tenant".
     *
     * Importante: NO se lee del usuario que hace la request. Si el caller no es
     * el titular (caso raro donde el rol 1 lo ocupa un usuario distinto al
     * dueño), se devuelve el plan del dueño — el plan es un atributo del
     * tenant, no del usuario concreto.
     */
    async resolvePlanId({ tenantId }) {
        if (!tenantId) return null;
        let connection;
        try {
            connection = await getConnection();
            const [rows] = await connection.query(
                "SELECT plan_pago FROM usuario WHERE id_tenant = ? AND id_rol = 1 ORDER BY id_usuario ASC LIMIT 1",
                [tenantId]
            );
            return rows[0]?.plan_pago ?? null;
        } finally {
            if (connection) connection.release();
        }
    },

    /**
     * Retrieves the Application Catalog (Modules, Submodules, Active Actions, metadata visual).
     * Si se pasa `planId`, filtra a los módulos/submódulos incluidos en la plantilla
     * PUBLISHED de ese plan (E4) — esto es lo que le pone techo a lo que un
     * Administrador de tenant puede llegar a ver/asignar: si el plan no incluye un
     * módulo, ni siquiera aparece en el catálogo que arma el sidebar o el editor de
     * permisos por rol. Sin plantilla publicada, devuelve el catálogo completo
     * (compatibilidad con planes que aún no tienen entitlements versionados).
     * @param {Object} context - { tenantId, isDeveloper, planId }
     */
    async getCatalog({ tenantId, isDeveloper = false, planId = null }) {
        const cacheKey = `catalog_${isDeveloper ? 'dev' : `${tenantId}_${planId}`}`;

        if (queryCache.has(cacheKey)) {
            const cached = queryCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.data;
            }
            queryCache.delete(cacheKey);
        }

        let connection;
        try {
            connection = await getConnection();

            const { moduloIds, submoduloIds } = isDeveloper
                ? { moduloIds: null, submoduloIds: null }
                : await resolveEntitlements(connection, planId);

            const baseSelect = `
                SELECT
                    m.id_modulo AS modulo_id,
                    m.nombre_modulo AS modulo_nombre,
                    m.ruta AS modulo_ruta,
                    m.active_actions AS modulo_active_actions,
                    m.icon AS modulo_icon,
                    m.group_name AS modulo_group,
                    m.sort_order AS modulo_sort_order,
                    m.frontend_route AS modulo_frontend_route,
                    m.is_visible AS modulo_is_visible,
                    s.id_submodulo,
                    s.id_modulo,
                    s.nombre_sub,
                    s.ruta AS submodulo_ruta,
                    s.active_actions AS submodulo_active_actions,
                    s.icon AS submodulo_icon,
                    s.group_name AS submodulo_group,
                    s.sort_order AS submodulo_sort_order,
                    s.frontend_route AS submodulo_frontend_route,
                    s.is_visible AS submodulo_is_visible
                FROM modulo m
                LEFT JOIN submodulos s ON m.id_modulo = s.id_modulo
                ORDER BY m.sort_order, m.nombre_modulo, s.sort_order, s.nombre_sub
            `;

            const [rows] = await connection.query(baseSelect);

            const modulosMap = new Map();
            for (const row of rows) {
                const moduloId = row.modulo_id;
                if (moduloIds && !moduloIds.has(moduloId)) continue;

                if (!modulosMap.has(moduloId)) {
                    modulosMap.set(moduloId, {
                        id: moduloId,
                        nombre: decodeBuffer(row.modulo_nombre),
                        ruta: decodeBuffer(row.modulo_ruta),
                        active_actions: row.modulo_active_actions,
                        icon: row.modulo_icon,
                        group_name: row.modulo_group,
                        sort_order: row.modulo_sort_order,
                        frontend_route: row.modulo_frontend_route,
                        is_visible: !!row.modulo_is_visible,
                        submodulos: []
                    });
                }

                if (row.id_submodulo && (!submoduloIds || submoduloIds.has(row.id_submodulo))) {
                    modulosMap.get(moduloId).submodulos.push({
                        id_submodulo: row.id_submodulo,
                        id_modulo: row.id_modulo,
                        nombre_sub: decodeBuffer(row.nombre_sub),
                        ruta: decodeBuffer(row.submodulo_ruta),
                        active_actions: row.submodulo_active_actions,
                        icon: row.submodulo_icon,
                        group_name: row.submodulo_group,
                        sort_order: row.submodulo_sort_order,
                        frontend_route: row.submodulo_frontend_route,
                        is_visible: !!row.submodulo_is_visible,
                    });
                }
            }

            const result = Array.from(modulosMap.values());

            queryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;

        } catch (error) {
            console.error("AuthZService.getCatalog Error:", error);
            throw error;
        } finally {
            if (connection) connection.release();
        }
    },

    /**
     * Permisos efectivos de un rol: combina el default del plan (permisos.id_plan = planId)
     * con el override del tenant (permisos.id_plan IS NULL) — el override siempre gana por
     * recurso (módulo/submódulo). Además, ningún permiso "sobrevive" si el módulo/submódulo
     * ya no está incluido en el plan actual del tenant (ej. tras un downgrade) — el plan es
     * el techo real de lo que un Administrador puede llegar a habilitar, no solo un default.
     * Devuelve capabilities en formato "{slug}.{accion}" (mismo contrato que ya consume
     * client-v2/src/store/useUserStore.ts) más la fuente de cada una.
     * @param {Object} context - { tenantId, roleId, planId, isDeveloper }
     */
    async getEffectivePermissions({ tenantId, roleId, planId = null, isDeveloper = false }) {
        if (isDeveloper) {
            return { capabilities: new Set(["*"]), sources: {} };
        }

        let connection;
        try {
            connection = await getConnection();

            const { moduloIds, submoduloIds } = await resolveEntitlements(connection, planId);

            const [rows] = await connection.query(
                `SELECT
                    p.id_modulo, p.id_submodulo, p.id_plan,
                    p.ver, p.crear, p.editar, p.eliminar, p.desactivar, p.generar, p.actions_json,
                    m.ruta AS modulo_ruta, s.ruta AS submodulo_ruta,
                    m.active_actions AS modulo_active_actions, s.active_actions AS submodulo_active_actions
                 FROM permisos p
                 LEFT JOIN modulo m ON p.id_modulo = m.id_modulo
                 LEFT JOIN submodulos s ON p.id_submodulo = s.id_submodulo
                 WHERE p.id_tenant = ? AND p.id_rol = ? AND (p.id_plan IS NULL OR p.id_plan = ?)`,
                [tenantId, roleId, planId]
            );

            // Un override de tenant (id_plan IS NULL) siempre pisa al default del plan
            // para ese mismo recurso — nunca al revés (evita el bug de "push destructivo").
            const byResource = new Map();
            for (const row of rows) {
                // El plan es el techo: un recurso que ya no está en los entitlements
                // (ej. plan degradado) no otorga capabilities aunque exista la fila en
                // `permisos` — ni por default de plan ni por override de tenant viejo.
                if (row.id_submodulo) {
                    if (submoduloIds && !submoduloIds.has(row.id_submodulo)) continue;
                } else if (moduloIds && !moduloIds.has(row.id_modulo)) {
                    continue;
                }

                const key = `${row.id_modulo}_${row.id_submodulo ?? "null"}`;
                const isOverride = row.id_plan === null;
                const existing = byResource.get(key);
                if (!existing || isOverride) {
                    byResource.set(key, { row, source: isOverride ? "TENANT_OVERRIDE" : "DEFAULT_PLAN" });
                }
            }

            const capabilities = new Set();
            const sources = {};

            for (const { row, source } of byResource.values()) {
                const base = normalizeSlug(row.submodulo_ruta || row.modulo_ruta);
                if (!base) continue;

                // Igual criterio que el frontend (getActiveActions en useUserStore):
                // si hay submódulo, su propio active_actions manda (sin heredar del módulo).
                const activeActions = parseActiveActions(
                    row.id_submodulo ? row.submodulo_active_actions : row.modulo_active_actions
                );

                for (const [column, action] of Object.entries(ACTION_COLUMNS)) {
                    if (row[column] === 1 && (activeActions === null || activeActions.includes(column))) {
                        const cap = `${base}.${action}`;
                        capabilities.add(cap);
                        sources[cap] = source;
                    }
                }

                const dynamicActions = parseActionsJson(row.actions_json);
                for (const [action, enabled] of Object.entries(dynamicActions)) {
                    if (enabled) {
                        const cap = `${base}.${action}`;
                        capabilities.add(cap);
                        sources[cap] = source;
                    }
                }
            }

            return { capabilities, sources };
        } finally {
            if (connection) connection.release();
        }
    },

    clearCache() {
        queryCache.clear();
    }
};
