import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Tabs, Tab, Spinner, Button, Chip, Input, Tooltip
} from "@heroui/react";

import { MdOutlineRestore } from "react-icons/md";
import { FaUserShield, FaUser, FaFolder, FaFileAlt, FaCheck, FaSearch } from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import { useGetRutas } from '@/services/permisos.services';
import { useRoles } from '@/services/permisos.services';
import { toast } from "react-hot-toast";
import axios from "@/api/axios";
import { ButtonSave } from "@/components/Buttons/Buttons";

export function TablaAsignacion({ externalData, skipApiCall = false }) {
    const [selectedTab, setSelectedTab] = useState("administrador");
    const [searchTerm, setSearchTerm] = useState("");

    // Usar datos externos o hooks de API condicionalmente
    const rutasHook = skipApiCall ? null : useGetRutas();
    const rolesHook = skipApiCall ? null : useRoles();

    // Asignar datos desde hooks o datos externos
    const {
        modulosConSubmodulos,
        loading: rutasLoading,
        error: rutasError,
    } = skipApiCall ? {
        modulosConSubmodulos: externalData?.rutas,
        loading: false,
        error: null,
    } : rutasHook;

    const { roles, loading: rolesLoading, error: rolesError } = skipApiCall ? {
        roles: externalData?.roles,
        loading: false,
        error: null
    } : rolesHook;

    const [roleMapping, setRoleMapping] = useState({});
    const [currentRoleId, setCurrentRoleId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [defaultPages, setDefaultPages] = useState(skipApiCall ? externalData?.defaultPages || {} : {});
    const [loading, setLoading] = useState(!skipApiCall);

    // Fetch default pages for all roles
    useEffect(() => {
        if (skipApiCall) {
            setDefaultPages(externalData?.defaultPages || {});
            setLoading(false);
            return;
        }

        async function fetchDefaultPages() {
            if (!roles?.length) return;

            try {
                setLoading(true);
                const defaultPagesData = {};

                for (const role of roles) {
                    try {
                        const response = await axios.get(`/rol/pagina-defecto/${role.id_rol}`);
                        if (response.data.code === 1) {
                            defaultPagesData[role.id_rol] = {
                                id_modulo: response.data.data.id_modulo,
                                id_submodulo: response.data.data.id_submodulo
                            };
                        }
                    } catch (error) {
                        console.error(`Error fetching default page for role ${role.id_rol}:`, error);
                    }
                }

                setDefaultPages(defaultPagesData);
            } catch (error) {
                console.error("Error fetching default pages:", error);
                toast.error("Error al cargar las páginas por defecto");
            } finally {
                setLoading(false);
            }
        }

        fetchDefaultPages();
    }, [roles, skipApiCall, externalData?.defaultPages]);

    useEffect(() => {
        if (roles?.length > 0) {
            const mapping = {};
            const tabRoleMapping = {};

            roles.forEach(role => {
                const tabKey = role.nom_rol.toLowerCase();
                mapping[role.id_rol] = tabKey;
                tabRoleMapping[tabKey] = role.id_rol;
            });

            setRoleMapping(tabRoleMapping);

            if (selectedTab && tabRoleMapping[selectedTab]) {
                setCurrentRoleId(tabRoleMapping[selectedTab]);
            } else if (roles.length > 0) {
                const firstTabKey = roles[0].nom_rol.toLowerCase();
                setSelectedTab(firstTabKey);
                setCurrentRoleId(roles[0].id_rol);
            }
        }
    }, [roles]);

    useEffect(() => {
        if (selectedTab && roleMapping[selectedTab]) {
            setCurrentRoleId(roleMapping[selectedTab]);
        }
    }, [selectedTab, roleMapping]);

    const handleSaveDefaultPage = async () => {
        if (!currentRoleId) return;
        const defaultPage = defaultPages[currentRoleId];

        if (!defaultPage || !defaultPage.id_modulo) {
            toast.error("Por favor selecciona una página por defecto");
            return;
        }

        try {
            setSaving(true);
            const response = await axios.put(`/rol/pagina-inicio/${currentRoleId}`, {
                id_modulo: defaultPage.id_modulo,
                id_submodulo: defaultPage.id_submodulo || null
            });

            if (response.data.code === 1) {
                toast.success("Página por defecto guardada correctamente");
            } else {
                toast.error(response.data.message || "Error al guardar la página por defecto");
            }
        } catch (error) {
            console.error("Error saving default page:", error);
            toast.error("Error al guardar la página por defecto");
        } finally {
            setSaving(false);
        }
    };

    const handleRestoreDefaultPage = () => {
        if (!currentRoleId) return;
        const defaultPage = modulosConSubmodulos.find(modulo => modulo.id === 1); // Default to Module 1 (usually Dashboard/Inicio)
        if (defaultPage) {
            setDefaultPages(prev => ({
                ...prev,
                [currentRoleId]: {
                    id_modulo: defaultPage.id,
                    id_submodulo: null
                }
            }));
            toast.success("Restaurado a Inicio general");
        }
    };

    const handleDefaultPageChange = (type, id) => {
        if (!currentRoleId) {
            console.error("No current role ID selected");
            return;
        }

        const numericId = parseInt(id);

        if (type === 'modulo') {
            setDefaultPages(prev => ({
                ...prev,
                [currentRoleId]: {
                    id_modulo: numericId,
                    id_submodulo: null
                }
            }));
        } else if (type === 'submodulo') {
            // Find parent module that contains this submodule
            const parentModule = modulosConSubmodulos?.find(modulo =>
                modulo.submodulos?.some(sub => parseInt(sub.id_submodulo) === numericId)
            );

            if (parentModule) {
                setDefaultPages(prev => ({
                    ...prev,
                    [currentRoleId]: {
                        id_modulo: parseInt(parentModule.id), // AuthZService returns 'id'
                        id_submodulo: numericId
                    }
                }));
            } else {
                console.error("Parent module not found for submodule", numericId);
            }
        }
    };

    // Flatten logic similar to UnifiedPermissionsTable
    const renderTableItems = useMemo(() => {
        if (!modulosConSubmodulos) return [];
        // Force re-calculation when selection changes to ensure Table updates (if it relies on reference equality)
        // trigger: defaultPages, currentRoleId
        const _trigger = defaultPages[currentRoleId];

        const items = [];
        const lowerSearch = searchTerm.toLowerCase();

        const traverse = (nodes, level = 0, parentMatched = false) => {
            nodes.forEach(node => {
                const isModulo = !!node.submodulos;
                // Adapt node structure if necessary (AuthZ service returns 'id', 'nombre')
                const name = isModulo ? node.nombre : node.nombre_sub;

                // Ensure ID is accessed correctly. 
                // AuthZService returns { id: ..., nombre: ... } for modules
                // and submodulos array with { id_submodulo: ... }
                // let's double check node structure in loop
                const id = isModulo ? node.id : node.id_submodulo;

                const type = isModulo ? 'modulo' : 'submodulo';
                const uniqueId = isModulo ? `M_${id}` : `S_${id}`;

                const matches = name && name.toLowerCase().includes(lowerSearch);
                const showRow = matches || parentMatched || searchTerm === "";

                if (showRow) {
                    items.push({
                        uniqueId,
                        id,
                        type,
                        name,
                        route: isModulo ? node.ruta : node.ruta_submodulo,
                        level,
                        originalNode: node
                    });
                }

                if (isModulo && node.submodulos) {
                    traverse(node.submodulos, level + 1, matches || parentMatched);
                }
            });
        };

        traverse(modulosConSubmodulos);
        return items;
    }, [modulosConSubmodulos, searchTerm, defaultPages, currentRoleId]);


    const renderModulosListing = () => {
        const isLoading = skipApiCall ? loading : (rutasLoading || rolesLoading || loading);
        const hasError = skipApiCall ? false : (rutasError || rolesError);

        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Spinner label="Cargando..." color="primary" size="lg" />
                </div>
            );
        }

        if (hasError) {
            return (
                <div className="p-4 text-center text-danger">
                    <p>Error al cargar los datos</p>
                </div>
            );
        }

        const currentDefault = defaultPages[currentRoleId] || {};
        const currentModuleId = currentDefault.id_modulo;
        const currentSubmoduleId = currentDefault.id_submodulo;

        return (
            <div className="flex flex-col gap-6 animate-fade-in pb-10">
                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                    <div className="w-full md:w-96">
                        <Input
                            placeholder="Buscar página..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            startContent={<FaSearch className="text-slate-400" />}
                            radius="lg"
                            variant="flat"
                            classNames={{
                                inputWrapper: "bg-white dark:bg-zinc-800 shadow-sm"
                            }}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="flat"
                            color="success"
                            onPress={handleRestoreDefaultPage}
                            startContent={<MdOutlineRestore size={18} />}
                            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium"
                        >
                            Restaurar por defecto
                        </Button>
                        <ButtonSave
                            onPress={handleSaveDefaultPage}
                            isLoading={saving}
                            text={saving ? "Guardando..." : "Guardar cambios"}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                    <Table
                        aria-label="Tabla de Asignación de Inicio"
                        isStriped
                        removeWrapper
                        layout="fixed"
                        classNames={{
                            th: "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider py-3 text-center first:text-left first:pl-8 h-10",
                            td: "py-1.5 border-b border-slate-100 dark:border-zinc-800/50 h-12"
                        }}
                    >
                        <TableHeader>
                            <TableColumn width={400} className="pl-6">Módulo / Página</TableColumn>
                            <TableColumn>Ruta</TableColumn>
                            <TableColumn align="center">Acción</TableColumn>
                        </TableHeader>
                        <TableBody items={renderTableItems} emptyContent="No se encontraron páginas.">
                            {(item) => {
                                const isSelected = item.type === 'modulo'
                                    ? (currentModuleId === item.id && !currentSubmoduleId)
                                    : (currentSubmoduleId === item.id); // If selecting submodule, we ignore module ID matching in this check logic because submodules are unique ID usually, but safer to just check ID matches target.

                                // Actually, defaultPages logic:
                                // { id_modulo: X, id_submodulo: Y }
                                // If Y is set, then X is parent.
                                // If Y is null, then X is target.

                                let isMyDefault = false;
                                const numId = parseInt(item.id);
                                const numModuleId = currentModuleId ? parseInt(currentModuleId) : null;
                                const numSubId = currentSubmoduleId ? parseInt(currentSubmoduleId) : null;

                                if (item.type === 'modulo') {
                                    isMyDefault = (numModuleId === numId && !numSubId);
                                } else {
                                    isMyDefault = (numSubId === numId);
                                }

                                return (
                                    <TableRow key={item.uniqueId}>
                                        <TableCell>
                                            <div
                                                style={{ paddingLeft: `${item.level * 28}px` }}
                                                className="flex items-center gap-3 relative"
                                            >
                                                {/* Connector Lines */}
                                                {item.level > 0 && (
                                                    <div className="absolute w-px h-[200%] bg-slate-200 dark:bg-zinc-700 -top-full"
                                                        style={{ left: `${(item.level * 28) - 14}px` }}
                                                    />
                                                )}
                                                {item.level > 0 && (
                                                    <div className="absolute w-3 h-px bg-slate-200 dark:bg-zinc-700 top-1/2"
                                                        style={{ left: `${(item.level * 28) - 14}px` }}
                                                    />
                                                )}

                                                <div className={`
                                                    flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md shadow-sm
                                                    ${item.type === 'modulo'
                                                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}
                                                `}>
                                                    {item.type === 'modulo' ? <FaFolder size={12} /> : <FaFileAlt size={10} />}
                                                </div>

                                                <span className={`
                                                    ${item.type === 'modulo'
                                                        ? 'font-bold text-slate-800 dark:text-slate-100 text-sm'
                                                        : 'font-medium text-slate-600 dark:text-slate-300 text-xs'}
                                                `}>
                                                    {item.name}
                                                </span>

                                                {isMyDefault && (
                                                    <Chip size="sm" color="success" variant="flat" className="ml-2 font-bold h-5 text-[10px]">
                                                        Inicio
                                                    </Chip>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-[10px] text-slate-400 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                                {item.route || "/"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center">
                                                <Button
                                                    size="sm"
                                                    color={isMyDefault ? "success" : "default"}
                                                    variant={isMyDefault ? "solid" : "flat"}
                                                    isDisabled={isMyDefault}
                                                    onPress={() => handleDefaultPageChange(item.type, item.id)}
                                                    startContent={isMyDefault ? <FaCheck size={12} /> : null}
                                                    className={`font-semibold h-7 min-h-7 text-xs ${isMyDefault ? "" : "text-slate-500 dark:text-slate-400"}`}
                                                >
                                                    {isMyDefault ? "Seleccionado" : "Establecer"}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            }}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    const formatRoleName = (roleName) => {
        if (roleName === "ADMIN") return "Administrador";
        if (roleName === "EMPLEADOS") return "Empleado";
        if (roleName === "SUPERVISOR") return "Supervisor";
        return roleName;
    };

    return (
        <div className="flex flex-col">
            <div className="w-full">
                <Tabs
                    aria-label="Roles"
                    selectedKey={selectedTab}
                    onSelectionChange={setSelectedTab}
                    color="primary"
                    variant="underlined"
                    classNames={{
                        tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider mb-6",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-0 h-12",
                        tabContent: "group-data-[selected=true]:text-primary"
                    }}
                >
                    {roles?.map(role => {
                        const tabKey = role.nom_rol.toLowerCase();
                        const isAdmin = role.id_rol === 1;

                        return (
                            <Tab
                                key={tabKey}
                                title={
                                    <div className="flex items-center gap-2">
                                        {isAdmin ? <FaUserShield className="mb-0.5" /> : <FaUser className="mb-0.5" />}
                                        <span className="text-base">{formatRoleName(role.nom_rol)}</span>
                                    </div>
                                }
                            >
                                <div className="py-2">
                                    {renderModulosListing()}
                                </div>
                            </Tab>
                        );
                    })}
                </Tabs>
            </div>
        </div>
    );
}

export default TablaAsignacion;