
import { useState, useCallback, useEffect } from "react";
import { getUnifiedCatalogRequest } from "@/services/permisosV2.services";
import { savePermisosGlobales } from "@/services/permisosGlobales.services";
import { toast } from "react-hot-toast";

export const useUnifiedPermissions = (roleId, planId) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Initial fetch
    const fetchData = useCallback(async () => {
        if (!roleId || !planId) return;

        setLoading(true);
        setError(null);
        try {
            const res = await getUnifiedCatalogRequest(roleId, planId);
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error(err);
            setError("Error cargando permisos");
        } finally {
            setLoading(false);
        }
    }, [roleId, planId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update local state (Optimistic UI) - OPTIMIZED: avoid JSON.parse/stringify
    const updateLocalPermission = useCallback((uniqueId, actionKey, value) => {
        setData(prevData => {
            // Recursive finder to update the specific node (shallow clone chain)
            const updateNode = (nodes) => {
                return nodes.map(node => {
                    if (node.uniqueId === uniqueId) {
                        return {
                            ...node,
                            permissions: {
                                ...node.permissions,
                                [actionKey]: value
                            }
                        };
                    }
                    if (node.children && node.children.length > 0) {
                        const updatedChildren = updateNode(node.children);
                        // Only create new object if children actually changed
                        if (updatedChildren !== node.children) {
                            return { ...node, children: updatedChildren };
                        }
                    }
                    return node;
                });
            };

            return updateNode(prevData);
        });
    }, []);

    // Save changes - WITH LOADING STATE
    const saveChanges = useCallback(async () => {
        setSaving(true);
        const flattened = [];

        const processNode = (node, parentId = null) => {
            const { ver, crear, editar, eliminar, desactivar, generar, ...others } = node.permissions;

            // Determine IDs
            let id_modulo = null;
            let id_submodulo = null;

            if (node.type === 'modulo') {
                id_modulo = node.id;
            } else {
                id_modulo = node.parentId || parentId;
                id_submodulo = node.id;
            }

            // Add to list
            flattened.push({
                id_modulo,
                id_submodulo,
                ver: ver ? 1 : 0,
                crear: crear ? 1 : 0,
                editar: editar ? 1 : 0,
                eliminar: eliminar ? 1 : 0,
                desactivar: desactivar ? 1 : 0,
                generar: generar ? 1 : 0,
                actions_json: Object.keys(others).length > 0 ? others : null
            });

            // Process children
            if (node.children) {
                node.children.forEach(child => processNode(child, id_modulo));
            }
        };

        data.forEach(rootNode => processNode(rootNode));

        try {
            const result = await savePermisosGlobales({
                id_rol: roleId,
                plan_seleccionado: planId,
                permisos: flattened
            });

            if (result && result.success) {
                toast.success("Permisos guardados correctamente");
                // Don't reload - we already have optimistic state
                return true;
            } else {
                toast.error("Error al guardar");
                return false;
            }
        } catch (e) {
            console.error(e);
            toast.error("Excepción al guardar");
            return false;
        } finally {
            setSaving(false);
        }
    }, [data, roleId, planId]);

    return {
        data,
        loading,
        saving, // NEW: expose saving state
        error,
        updateLocalPermission,
        refetch: fetchData,
        saveChanges
    };
};
