import { useState, useEffect, useCallback } from 'react';
import { useGetRutas, useRoles, usePermisosByRol, useSavePermisos } from '@/services/permisos.services';
import { toast } from 'react-hot-toast';

export const usePermissionsManager = () => {
    // Data Fetching
    const {
        modulosConSubmodulos: catalog,
        loading: catalogLoading,
        error: catalogError,
        expandedModulos,
        toggleExpand,
        expandAll,
        collapseAll
    } = useGetRutas();

    const { roles, loading: rolesLoading, error: rolesError } = useRoles();

    // Selection State
    const [selectedRoleId, setSelectedRoleId] = useState(null);

    // Permissions Fetching (Dependent on Selection)
    const {
        permisos: fetchedPermissions,
        loading: permissionsLoading,
        refetchPermisos
    } = usePermisosByRol(selectedRoleId);

    // Saving Mutation
    const { savePermisos, saving: isSaving } = useSavePermisos();

    // Matrix State: { [roleId]: { [key]: { ver: bool, ... } } }
    const [matrix, setMatrix] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize Matrix when fetched permissions change
    useEffect(() => {
        if (selectedRoleId && fetchedPermissions) {
            const roleMatrix = {};

            fetchedPermissions.forEach(p => {
                const key = p.id_submodulo
                    ? `submodulo_${p.id_submodulo}`
                    : `modulo_${p.id_modulo}`;

                roleMatrix[key] = {
                    ver: !!p.ver,
                    crear: !!p.crear,
                    editar: !!p.editar,
                    eliminar: !!p.eliminar,
                    desactivar: !!p.desactivar,
                    generar: !!p.generar
                };
            });

            setMatrix(prev => ({
                ...prev,
                [selectedRoleId]: roleMatrix
            }));
            setHasChanges(false);
        }
    }, [fetchedPermissions, selectedRoleId]);

    // Select first role by default
    useEffect(() => {
        if (roles?.length > 0 && !selectedRoleId) {
            setSelectedRoleId(roles[0].id_rol);
        }
    }, [roles, selectedRoleId]);

    // Actions
    const togglePermission = useCallback((subjectId, action, type = 'modulo') => {
        if (!selectedRoleId) return;

        const key = `${type}_${subjectId}`;

        setMatrix(prev => {
            const roleMatrix = { ...(prev[selectedRoleId] || {}) };
            const currentPerms = {
                ver: false, crear: false, editar: false, eliminar: false, desactivar: false, generar: false,
                ...(roleMatrix[key] || {})
            };

            // Toggle value
            currentPerms[action] = !currentPerms[action];
            roleMatrix[key] = currentPerms;

            return { ...prev, [selectedRoleId]: roleMatrix };
        });
        setHasChanges(true); // Track dirty state if needed
    }, [selectedRoleId]);

    const setAllPermissions = useCallback((enable = true) => {
        if (!selectedRoleId || !catalog) return;

        const allPerms = {};
        const dummyPerms = { ver: enable, crear: enable, editar: enable, eliminar: enable, desactivar: enable, generar: enable };

        if (!enable) {
            // Clear all
            setMatrix(prev => ({ ...prev, [selectedRoleId]: {} }));
            return;
        }

        catalog.forEach(mod => {
            allPerms[`modulo_${mod.id}`] = { ...dummyPerms };
            if (mod.submodulos) {
                mod.submodulos.forEach(sub => {
                    allPerms[`submodulo_${sub.id_submodulo}`] = { ...dummyPerms };
                });
            }
        });

        setMatrix(prev => ({ ...prev, [selectedRoleId]: allPerms }));
    }, [selectedRoleId, catalog]);

    const saveChanges = async () => {
        if (!selectedRoleId) return false;

        const roleMatrix = matrix[selectedRoleId] || {};
        const payload = [];

        // Reconstruct payload from matrix + catalog structure to ensure IDs are correct
        if (!catalog) return;

        catalog.forEach(mod => {
            const modKey = `modulo_${mod.id}`;
            if (roleMatrix[modKey]) {
                const p = roleMatrix[modKey];
                payload.push({
                    id_modulo: mod.id,
                    id_submodulo: null,
                    ver: p.ver ? 1 : 0,
                    crear: p.crear ? 1 : 0,
                    editar: p.editar ? 1 : 0,
                    eliminar: p.eliminar ? 1 : 0,
                    desactivar: p.desactivar ? 1 : 0,
                    generar: p.generar ? 1 : 0
                });
            }

            if (mod.submodulos) {
                mod.submodulos.forEach(sub => {
                    const subKey = `submodulo_${sub.id_submodulo}`;
                    if (roleMatrix[subKey]) {
                        const p = roleMatrix[subKey];
                        payload.push({
                            id_modulo: mod.id,
                            id_submodulo: sub.id_submodulo,
                            ver: p.ver ? 1 : 0,
                            crear: p.crear ? 1 : 0,
                            editar: p.editar ? 1 : 0,
                            eliminar: p.eliminar ? 1 : 0,
                            desactivar: p.desactivar ? 1 : 0,
                            generar: p.generar ? 1 : 0
                        });
                    }
                });
            }
        });

        const success = await savePermisos(selectedRoleId, payload);
        if (success) {
            toast.success("Permisos guardados correctamente");
            refetchPermisos();
            setHasChanges(false);
        } else {
            toast.error("Error al guardar permisos");
        }
        return success;
    };

    return {
        // Data
        catalog,
        roles,
        matrix: matrix[selectedRoleId] || {},
        selectedRoleId,

        // Loading/Error
        isLoading: catalogLoading || rolesLoading || permissionsLoading,
        error: catalogError || rolesError,
        isSaving,

        // Actions
        setSelectedRoleId,
        togglePermission,
        toggleAll: setAllPermissions,
        saveChanges,

        // UI Helpers
        expandedModulos,
        toggleExpand,
        expandAll,
        collapseAll
    };
};
