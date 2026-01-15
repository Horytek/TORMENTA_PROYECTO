
import { getConnection } from "../database/database.js";

// Helper to deduce available actions (Business Logic)
const getAvailableActions = (item, type) => {
    // 1. If active_actions is explicitly set (JSON), use it
    if (item.active_actions) {
        try {
            const parsed = typeof item.active_actions === 'string'
                ? JSON.parse(item.active_actions)
                : item.active_actions;

            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            console.error(`Error parsing active_actions for ${type} ${item.id}:`, e);
        }
    }

    // 2. Fallback Logic (Legacy/Default) - The "Smart" Defaults
    const standardCRUD = ['ver', 'crear', 'editar', 'eliminar'];

    if (type === 'modulo') {
        const id = item.id;

        // Read-only modules
        // 1: Inicio, 7: Reportes
        if ([1, 7].includes(id)) return ['ver'];

        // Special case: Clientes (4) allows 'desactivar'
        if (id === 4) return [...standardCRUD, 'desactivar'];

        // Default: CRUD
        return standardCRUD;
    }

    if (type === 'submodulo') {
        const id = item.id;
        // Submodules allowing 'desactivar'
        const allowDesactivar = [1, 2, 3, 10, 11, 13].includes(id);
        // Submodules allowing 'generar'
        const allowGenerar = [10, 11, 13].includes(id);

        let actions = [...standardCRUD];
        if (allowDesactivar) actions.push('desactivar');
        if (allowGenerar) actions.push('generar');

        return actions;
    }

    return ['ver'];
};

const getMergedPermissions = async (req, res) => {
    const { roleId, planId } = req.query; // Expecting query params

    if (!roleId || !planId) {
        return res.status(400).json({ success: false, message: "Missing roleId or planId" });
    }

    let connection;
    try {
        connection = await getConnection();

        // 1. Fetch Hierarchy (Modules & Submodules)
        const [modulos] = await connection.query("SELECT id_modulo as id, nombre_modulo as nombre, active_actions FROM modulo ORDER BY nombre_modulo");
        const [submodulos] = await connection.query("SELECT id_submodulo as id, id_modulo, nombre_sub as nombre, active_actions FROM submodulos ORDER BY nombre_sub");

        // 2. Fetch Existing Permissions for this Role/Plan
        const [permsRows] = await connection.query(
            "SELECT * FROM permisos WHERE id_rol = ? AND id_plan = ?",
            [roleId, planId]
        );

        // Index permissions for fast lookup: "M_1" or "S_5"
        const permsMap = new Map();
        permsRows.forEach(p => {
            const key = p.id_submodulo ? `S_${p.id_submodulo}` : `M_${p.id_modulo}`;

            // Extract core booleans + actions_json
            let mergedPerms = {
                ver: !!p.ver,
                crear: !!p.crear,
                editar: !!p.editar,
                eliminar: !!p.eliminar,
                desactivar: !!p.desactivar,
                generar: !!p.generar
            };

            // Merge dynamic actions from JSON
            if (p.actions_json) {
                try {
                    const dynamic = typeof p.actions_json === 'string' ? JSON.parse(p.actions_json) : p.actions_json;
                    mergedPerms = { ...mergedPerms, ...dynamic };
                } catch (e) { }
            }

            permsMap.set(key, mergedPerms);
        });

        // 3. Build the Tree
        const resultTree = modulos.map(mod => {
            const uniqueId = `M_${mod.id}`;
            const available = getAvailableActions(mod, 'modulo');
            const currentPerms = permsMap.get(uniqueId) || {};

            // Find children
            const children = submodulos
                .filter(sub => sub.id_modulo === mod.id)
                .map(sub => {
                    const subUniqueId = `S_${sub.id}`;
                    const subAvailable = getAvailableActions(sub, 'submodulo');
                    const subPerms = permsMap.get(subUniqueId) || {};

                    return {
                        uniqueId: subUniqueId,
                        type: 'submodulo',
                        id: sub.id,
                        parentId: sub.id_modulo, // Added for saving context
                        name: sub.nombre,
                        availableActions: subAvailable,
                        permissions: subPerms
                    };
                });

            return {
                uniqueId: uniqueId,
                type: 'modulo',
                id: mod.id,
                name: mod.nombre,
                availableActions: available,
                permissions: currentPerms,
                children: children
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
