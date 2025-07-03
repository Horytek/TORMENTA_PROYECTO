import {
    Card,
    CardHeader,
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
import {useGetRutas} from '@/services/permisos.services';
import { useRoles } from '@/services/permisos.services';
import { toast } from "react-hot-toast";
import axios from "@/api/axios";

export function TablaAsignacion() {
    const [selectedTab, setSelectedTab] = useState("administrador");
    const {
        modulosConSubmodulos,
        loading: rutasLoading,
        error: rutasError,
        expandedModulos,
        toggleExpand,
        expandAll,
        collapseAll
    } = useGetRutas();

    const { roles, loading: rolesLoading, error: rolesError } = useRoles();
    const [roleMapping, setRoleMapping] = useState({});
    const [currentRoleId, setCurrentRoleId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [defaultPages, setDefaultPages] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch default pages for all roles
    useEffect(() => {
        async function fetchDefaultPages() {
            if (!roles.length) return;

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
    }, [roles]);

    useEffect(() => {
        if (roles.length > 0) {
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
    }, [roles, selectedTab]);

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

    const handleDeleteConfig = () => {
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
        if (rutasLoading || rolesLoading || loading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Spinner label="Cargando..." color="primary" size="lg" />
                </div>
            );
        }

        if (rutasError || rolesError) {
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
                <div className="flex justify-between items-center mb-4">

                    <div className="text-sm text-gray-500">
                        Selecciona la página principal para este rol.

                    </div>


                    <div className="flex gap-2">

                        <Button
                            size="sm"
                            variant="flat"
                            color="success"
                            onPress={handleRestoreDefaultPage}
                            tooltip="Restaurar página por defecto"

                        >
                            <MdOutlineRestore className="text-green-700" size={20} />

                            Restaurar página por defecto
                        </Button>

                        {/* <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={handleDeleteConfig}
                            style={{ fontWeight: "bold" }}

                        >
                            Desmarcar página seleccionada
                        </Button> */}
                        <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={expandAll}
                        >
                            <RiExpandDiagonalLine className="text-blue-700" size={20} />

                            Expandir todo
                        </Button>
                        <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onPress={collapseAll}

                        >
                            <RiCollapseDiagonal2Line className="text-purple-700" size={20} />

                            Colapsar todo
                        </Button>
                    </div>
                </div>

                <Divider className="mb-4" />
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-blue-600 font-bold">Página actual de inicio:</span>
                    <FaHouseUser className="text-green-600" />
                    <span className="text-gray-700 font-semibold">({currentRoute})</span>
                </div>

                <div className="space-y-5">
                    {modulosConSubmodulos.map((modulo) => (
                        <Card
                            key={modulo.id}
                            className="shadow-md border border-gray-200 bg-white overflow-hidden"
                            style={{ boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                        >
                            <CardBody className="p-0">
                                <div
                                    className={`flex items-center justify-between px-5 py-4 ${modulo.expandible ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                    onClick={() => modulo.expandible && toggleExpand(modulo.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {modulo.expandible ? (
                                            expandedModulos[modulo.id] ?
                                                <FaChevronDown className="text-gray-600" /> :
                                                <FaChevronRight className="text-gray-600" />
                                        ) : <div className="w-4" />}
                                        <span className="font-semibold text-gray-800 text-lg">
                                            {modulo.nombre}
                                            {modulo.id === 1 && (
                                                <span className="ml-2 text-primary-600  text-xs font-extrabold">(Página por defecto)</span>
                                            )}
                                        </span>
                                        {modulo.ruta && (
                                            <span className="text-xs text-gray-500 ml-2">({modulo.ruta})</span>
                                        )}
                                    </div>

                                    <div className="flex gap-4 items-center">
                                        <Checkbox
                                            color="primary"
                                            isSelected={currentModuleId === modulo.id && !currentSubmoduleId}
                                            onChange={() => handleDefaultPageChange('modulo', modulo.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Establecer como inicio
                                        </Checkbox>
                                    </div>
                                </div>

                                {expandedModulos[modulo.id] && modulo.submodulos && modulo.submodulos.length > 0 && (
                                    <>
                                        <Divider />
                                        <div className="bg-gray-100 px-5 py-2">
                                            <span className="text-sm font-medium text-gray-600">Submodulos</span>
                                        </div>
                                        <div className="bg-gray-50">
                                            {modulo.submodulos
                                                .filter(submodulo => submodulo.id_submodulo !== 8)
                                                .map((submodulo) => (
                                                    <div
                                                        key={submodulo.id_submodulo}
                                                        className="flex items-center justify-between px-5 py-3 pl-14 border-t border-gray-200"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-700">➤ {submodulo.nombre_sub}</span>
                                                            {submodulo.ruta_submodulo && (
                                                                <span className="text-xs text-gray-500 ml-2">({submodulo.ruta_submodulo})</span>
                                                            )}
                                                        </div>

                                                        <div className="flex gap-3 items-center">
                                                            <Checkbox
                                                                size="sm"
                                                                color="primary"
                                                                isSelected={currentSubmoduleId === submodulo.id_submodulo}
                                                                onChange={() => handleDefaultPageChange('submodulo', submodulo.id_submodulo)}
                                                            >
                                                                Establecer como inicio
                                                            </Checkbox>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </>
        );
    };

    return (
        <>
            <div className="flex flex-col mb-4">
                <h1 className="text-4xl font-extrabold">Configuración de página de inicio por rol</h1>
                <p
                    className="text-small text-default-400"
                    style={{ fontSize: "16px", userSelect: "none", marginTop: "10px" }}
                >
                    Asigna la página de inicio a cada rol al iniciar sesión en el sistema.
                </p>
            </div>
            <Card>
                <CardHeader>
                </CardHeader>
                <CardBody>
                    <Tabs
                        aria-label="Roles"
                        selectedKey={selectedTab}
                        onSelectionChange={setSelectedTab}
                        color="primary"
                        variant="bordered"
                        classNames={{
                            tabList: "gap-4",
                            tab: "py-2"
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
                                            {isAdmin ? <FaUserShield /> : <FaUser />}
                                            <span>{formatRoleName(role.nom_rol)}</span>
                                        </div>
                                    }
                                >
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            {isAdmin ? <FaUserShield /> : <FaUser />}
                                            Configurando página inicial para:  {formatRoleName(role.nom_rol)}
                                        </h3>
                                        {renderModulosListing()}
                                        <div className="mt-6 flex justify-end">
                                            <Button
                                                color="primary"
                                                isLoading={saving}
                                                onPress={handleSaveDefaultPage}
                                            >
                                                {saving ? "Guardando..." : "Guardar cambios"}
                                            </Button>
                                        </div>
                                    </div>
                                </Tab>
                            );
                        })}
                    </Tabs>
                </CardBody>
            </Card>
        </>
    );
}

export default TablaAsignacion;