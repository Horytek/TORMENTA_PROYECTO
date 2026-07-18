import { getConnection } from "../database/database.js";
import { AuthZService } from "../services/authz.service.js";

// Mismo criterio que AuthZService.getEffectivePermissions: `active_actions`
// null = las 6 acciones estándar están disponibles; array = solo esas.
// Antes esta función tenía una lista de ids de módulo/submódulo hardcodeada
// ("smart defaults") desconectada de `active_actions` — dos fuentes de verdad
// que podían decir cosas distintas sobre qué acciones aplican a un mismo
// recurso. Ahora hay una sola.
const STANDARD_ACTIONS = ["ver", "crear", "editar", "eliminar", "desactivar", "generar"];

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

const getAvailableActions = (item) => parseActiveActions(item.active_actions) ?? STANDARD_ACTIONS;

const getMergedPermissions = async (req, res) => {
    const { roleId, planId } = req.query;

    if (!roleId || !planId) {
        return res.status(400).json({ success: false, message: "Missing roleId or planId" });
    }

    let connection;
    try {
        connection = await getConnection();

        // Mismo catálogo (icon/group_name/sort_order/frontend_route/is_visible)
        // que ya usa el sidebar de client-v2 — ver src/lib/navigationCatalog.ts.
        const catalog = await AuthZService.getCatalog({ tenantId: null, isDeveloper: true });

        const [permsRows] = await connection.query(
            "SELECT * FROM permisos WHERE id_rol = ? AND id_plan = ?",
            [roleId, planId]
        );

        const permsMap = new Map();
        permsRows.forEach((p) => {
            const key = p.id_submodulo ? `S_${p.id_submodulo}` : `M_${p.id_modulo}`;

            let mergedPerms = {
                ver: !!p.ver,
                crear: !!p.crear,
                editar: !!p.editar,
                eliminar: !!p.eliminar,
                desactivar: !!p.desactivar,
                generar: !!p.generar
            };

            if (p.actions_json) {
                try {
                    const dynamic = typeof p.actions_json === "string" ? JSON.parse(p.actions_json) : p.actions_json;
                    mergedPerms = { ...mergedPerms, ...dynamic };
                } catch { /* actions_json corrupto: se ignora, no rompe el resto */ }
            }

            permsMap.set(key, mergedPerms);
        });

        const resultTree = catalog.map((mod) => {
            const uniqueId = `M_${mod.id}`;
            const children = (mod.submodulos || []).map((sub) => {
                const subUniqueId = `S_${sub.id_submodulo}`;
                return {
                    uniqueId: subUniqueId,
                    type: "submodulo",
                    id: sub.id_submodulo,
                    parentId: sub.id_modulo,
                    name: sub.nombre_sub,
                    icon: sub.icon,
                    groupName: sub.group_name,
                    inSidebar: !!sub.frontend_route && sub.is_visible !== false,
                    isVisible: sub.is_visible !== false,
                    availableActions: getAvailableActions(sub),
                    permissions: permsMap.get(subUniqueId) || {}
                };
            });

            return {
                uniqueId,
                type: "modulo",
                id: mod.id,
                name: mod.nombre,
                icon: mod.icon,
                groupName: mod.group_name,
                inSidebar: !!mod.frontend_route && mod.is_visible !== false,
                isVisible: mod.is_visible !== false,
                availableActions: getAvailableActions(mod),
                permissions: permsMap.get(uniqueId) || {},
                children
            };
        });

        res.json({ success: true, data: resultTree });

    } catch (error) {
        console.error("Error in getMergedPermissions:", error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

export const methods = {
    getMergedPermissions
};
