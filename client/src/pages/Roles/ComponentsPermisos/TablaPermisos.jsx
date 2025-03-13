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
} from "@nextui-org/react";
import { FaUserShield, FaUser, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useState, useEffect } from "react";
import useGetRutas from "../data/getRutas";
import { useRoles, usePermisosByRol, useSavePermisos } from "../data/rolPermisos";
import { toast, Toaster } from "react-hot-toast";

export function TablaPermisos() {
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
  const { permisos, loading: permisosLoading, refetchPermisos } = usePermisosByRol(currentRoleId);
  const { savePermisos, saving: savingPermisos } = useSavePermisos();

  const [permisosData, setPermisosData] = useState({});

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
    if (currentRoleId) {
      const rolePermisos = {};
      
      if (permisos && permisos.length > 0) {
        permisos.forEach(permiso => {
          if (permiso.id_submodulo) {
            rolePermisos[`submodulo_${permiso.id_submodulo}`] = !!permiso.ver;
          } else {
            rolePermisos[`modulo_${permiso.id_modulo}`] = !!permiso.ver;
          }
        });
      }
  
      setPermisosData(prev => ({
        ...prev,
        [currentRoleId]: rolePermisos
      }));
    }
  }, [permisos, currentRoleId]);

  useEffect(() => {
    if (selectedTab && roleMapping[selectedTab]) {
      setCurrentRoleId(roleMapping[selectedTab]);
    }
  }, [selectedTab, roleMapping]);

  const handlePermissionChange = (id, type, value) => {
    if (!currentRoleId) return;
    
    const isChecked = typeof value === 'boolean' ? value : 
                      (value && typeof value === 'object' ? value.target?.checked : false);
    
    
    setPermisosData(prev => {
      const currentRolePerms = {...(prev[currentRoleId] || {})};
      currentRolePerms[`${type}_${id}`] = isChecked;
      
      return {
        ...prev,
        [currentRoleId]: currentRolePerms
      };
    });
  };

  const handleSavePermissions = async () => {
    if (!currentRoleId) return;

    try {
      const rolePermisos = permisosData[currentRoleId] || {};
      const permisosToSave = [];

      modulosConSubmodulos.forEach(modulo => {
        if (rolePermisos[`modulo_${modulo.id}`]) {
          permisosToSave.push({
            id_modulo: modulo.id,
            id_submodulo: null,
            ver: 1
          });
        }

        modulo.submodulos.forEach(submodulo => {
          if (rolePermisos[`submodulo_${submodulo.id_submodulo}`]) {
            permisosToSave.push({
              id_modulo: modulo.id,
              id_submodulo: submodulo.id_submodulo,
              ver: 1
            });
          }
        });
      });

      const success = await savePermisos(currentRoleId, permisosToSave);

      if (success) {
        toast.success("Permisos guardados correctamente");
        refetchPermisos(); 
      } else {
        toast.error("Error al guardar los permisos");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Error al guardar los permisos");
    }
  };


  const formatRoleName = (roleName) => {
    if (roleName === "ADMIN") return "Administrador";
    if (roleName === "EMPLEADOS") return "Empleado";
    return roleName; 
  };

  const renderModulosListing = () => {
    if (rutasLoading || rolesLoading || permisosLoading) {
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

    const rolePermisos = permisosData[currentRoleId] || {};

    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            {modulosConSubmodulos.length} módulos disponibles
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              onPress={expandAll}
              style={{ fontWeight: "bold" }}
            >
              Expandir todo
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="default"
              onPress={collapseAll}
            >
              Colapsar todo
            </Button>
          </div>
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

                    <span className="font-medium text-gray-800">{modulo.nombre}</span>
                    {modulo.ruta && (
                      <span className="text-xs text-gray-500 ml-2">({modulo.ruta})</span>
                    )}
                  </div>

                  {modulo.id !== 9 && (
                    <Checkbox
                      color="primary"
                      isSelected={rolePermisos[`modulo_${modulo.id}`] || false}
                      onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'modulo', isChecked)}
                      onClick={(e) => e.stopPropagation()}
                      disableAnimation={true}
                    >
                      Ver
                    </Checkbox>
                  )}
                </div>

                {expandedModulos[modulo.id] && modulo.submodulos && modulo.submodulos.length > 0 && (
                  <>
                    <Divider />
                    <div className="bg-gray-50">
                      {modulo.submodulos.map((submodulo) => (
                        <div
                          key={submodulo.id_submodulo}
                          className="flex items-center justify-between px-5 py-3 pl-12 border-t border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">➤ {submodulo.nombre_sub}</span>
                            {submodulo.ruta_submodulo && (
                              <span className="text-xs text-gray-500 ml-2">({submodulo.ruta_submodulo})</span>
                            )}
                          </div>

                          <Checkbox
                            color="primary"
                            isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`] || false}
                            onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'submodulo', isChecked)}
                            disableAnimation={true}
                          />
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
        <h1 className="text-3xl font-bold">Gestión de Permisos</h1>
        <p
          className="text-small text-default-400"
          style={{ fontSize: "16px", userSelect: "none", marginTop: "10px" }}
        >
          Administra los permisos de acceso para cada rol del sistema.
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
                      Permisos de {formatRoleName(role.nom_rol)}
                    </h3>
                    {renderModulosListing()}
                    <div className="mt-6 flex justify-end">
                      <Button
                        color="primary"
                        isLoading={savingPermisos}
                        onPress={handleSavePermissions}
                      >
                        {savingPermisos ? "Guardando..." : "Guardar cambios"}
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

export default TablaPermisos;