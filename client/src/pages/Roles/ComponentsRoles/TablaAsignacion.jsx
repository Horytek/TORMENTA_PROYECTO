import {
    Card,
    CardBody,
    Tabs,
    Tab,
    Spinner,
    Checkbox,
    Button,
    Divider
} from "@heroui/react";

import { MdOutlineRestore } from "react-icons/md";
import { RiCollapseDiagonal2Line, RiExpandDiagonalLine } from "react-icons/ri";
import { FaUserShield, FaUser, FaChevronDown, FaChevronRight, FaHouseUser } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useGetRutas } from '@/services/permisos.services';
import { useRoles } from '@/services/permisos.services';
import { toast } from "react-hot-toast";
import axios from "@/api/axios";
import { ButtonSave } from "@/components/Buttons/Buttons";

export function TablaAsignacion({ externalData, skipApiCall = false }) {
    const [selectedTab, setSelectedTab] = useState("administrador");

    // Usar datos externos o hooks de API condicionalmente
    const rutasHook = skipApiCall ? null : useGetRutas();
    const rolesHook = skipApiCall ? null : useRoles();

    // Asignar datos desde hooks o datos externos
    const {
        modulosConSubmodulos,
        loading: rutasLoading,
        error: rutasError,
        expandedModulos,
        toggleExpand,
        expandAll,
        collapseAll
    } = skipApiCall ? {
        modulosConSubmodulos: externalData?.rutas,
        loading: false,
        error: null,
        expandedModulos: externalData?.expandedModulos,
        toggleExpand: externalData?.toggleExpand,
        expandAll: externalData?.expandAll,
        collapseAll: externalData?.collapseAll
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
        // Si tenemos datos externos, usar esos datos directamente
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

    const _handleDeleteConfig = () => {
        if (!currentRoleId) return;

        setDefaultPages(prev => ({
            ...prev,
            [currentRoleId]: {}
        }));
    };

    const handleRestoreDefaultPage = () => {
        if (!currentRoleId) return;

        const defaultPage = modulosConSubmodulos.find(modulo => modulo.id === 1);

        if (defaultPage) {
            setDefaultPages(prev => ({
                ...prev,
                [currentRoleId]: {
                    id_modulo: defaultPage.id,
                    id_submodulo: null
                }
            }));
        }
    };

    const handleDefaultPageChange = (type, id) => {
        if (!currentRoleId) return;

        if (type === 'modulo') {
            setDefaultPages(prev => ({
                ...prev,
                [currentRoleId]: {
                    id_modulo: id,
                    id_submodulo: null
                }
            }));
        } else if (type === 'submodulo') {
            const parentModule = modulosConSubmodulos.find(modulo =>
                modulo.submodulos.some(sub => sub.id_submodulo === id)
            );

            if (parentModule) {
                setDefaultPages(prev => ({
                    ...prev,
                    [currentRoleId]: {
                        id_modulo: parentModule.id,
                        id_submodulo: id
                    }
                }));
            }
        }
    };

    const formatRoleName = (roleName) => {
        if (roleName === "ADMIN") return "Administrador";
        if (roleName === "EMPLEADOS") return "Empleado";
        if (roleName === "SUPERVISOR") return "Supervisor";
        return roleName;
    };

    const renderModulosListing = () => {
        // Si usar datos externos y skipApiCall, no mostrar loading de API
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
                    <p>Error al cargar los datos:</p>
                    <p>{rutasError || rolesError}</p>
                </div>
            );
        }

        if (!modulosConSubmodulos || modulosConSubmodulos.length === 0) {
            return (
                <div className="p-4 text-center text-gray-500">
                    No hay módulos disponibles.
                </div>
            );
        }

        const currentDefault = defaultPages[currentRoleId] || {};
        const currentModuleId = currentDefault.id_modulo;
        const currentSubmoduleId = currentDefault.id_submodulo;

        let currentRoute = "";
        if (currentSubmoduleId) {
            const parent = modulosConSubmodulos.find(m =>
                m.submodulos.some(s => s.id_submodulo === currentSubmoduleId)
            );
            const sub = parent?.submodulos.find(s => s.id_submodulo === currentSubmoduleId);
            currentRoute = sub?.ruta_submodulo || "";
        } else if (currentModuleId) {
            const mod = modulosConSubmodulos.find(m => m.id === currentModuleId);
            currentRoute = mod?.ruta || "";
        }

        return (
            <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            Página de inicio seleccionada
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="flat"
                            color="success"
                            onPress={handleRestoreDefaultPage}
                            startContent={<MdOutlineRestore size={18} />}
                            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        >
                            Restaurar por defecto
                        </Button>

                        <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={expandAll}
                            startContent={<RiExpandDiagonalLine size={18} />}
                        >
                            Expandir
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onPress={collapseAll}
                            startContent={<RiCollapseDiagonal2Line size={18} />}
                        >
                            Colapsar
                        </Button>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-blue-900 rounded-lg shadow-sm">
                        <FaHouseUser className="text-blue-600 dark:text-blue-400 text-xl" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">Página Actual</span>
                        <span className="text-slate-700 dark:text-slate-200 font-bold text-base">{currentRoute || "Ninguna seleccionada"}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {modulosConSubmodulos.map((modulo) => (
                        <div
                            key={modulo.id}
                            className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div
                                className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors select-none`}
                                onClick={() => modulo.expandible && toggleExpand(modulo.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {modulo.expandible ? (
                                        expandedModulos[modulo.id] ?
                                            <FaChevronDown className="text-slate-400" /> :
                                            <FaChevronRight className="text-slate-400" />
                                    ) : <div className="w-4" />}

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                                {modulo.nombre}
                                            </span>
                                            {modulo.id === 1 && (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">Default</span>
                                            )}
                                        </div>
                                        {modulo.ruta && (
                                            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">({modulo.ruta})</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 items-center">
                                    <Checkbox
                                        color="primary"
                                        isSelected={currentModuleId === modulo.id && !currentSubmoduleId}
                                        onChange={() => handleDefaultPageChange('modulo', modulo.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        classNames={{
                                            label: "text-small font-medium text-slate-600 dark:text-slate-300"
                                        }}
                                    >
                                        Establecer inicio
                                    </Checkbox>
                                </div>
                            </div>

                            {expandedModulos[modulo.id] && modulo.submodulos && modulo.submodulos.length > 0 && (
                                <>
                                    <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 p-2 space-y-2">
                                        {modulo.submodulos
                                            .filter(submodulo => submodulo.id_submodulo !== 8)
                                            .map((submodulo) => (
                                                <div
                                                    key={submodulo.id_submodulo}
                                                    className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 ml-4 shadow-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-700 dark:text-slate-300 font-medium">↳ {submodulo.nombre_sub}</span>
                                                        {submodulo.ruta_submodulo && (
                                                            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">({submodulo.ruta_submodulo})</span>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-3 items-center">
                                                        <Checkbox
                                                            size="sm"
                                                            color="primary"
                                                            isSelected={currentSubmoduleId === submodulo.id_submodulo}
                                                            onChange={() => handleDefaultPageChange('submodulo', submodulo.id_submodulo)}
                                                            classNames={{
                                                                label: "text-small font-medium text-slate-600 dark:text-slate-300"
                                                            }}
                                                        >
                                                            Establecer inicio
                                                        </Checkbox>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </>
        );
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
                        tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                        cursor: "w-full bg-primary",
                        tab: "max-w-fit px-0 h-12",
                        tabContent: "group-data-[selected=true]:text-primary"
                    }}
                >
                    {roles.map(role => {
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
                                <div className="py-6">
                                    {renderModulosListing()}
                                    <div className="mt-8 flex justify-end sticky bottom-6 z-10">
                                        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800">
                                            <ButtonSave
                                                onPress={handleSaveDefaultPage}
                                                isLoading={saving}
                                                text={saving ? "Guardando..." : "Guardar cambios"}
                                            />
                                        </div>
                                    </div>
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