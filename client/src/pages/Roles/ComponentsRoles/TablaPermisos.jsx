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
import { MdPlaylistRemove } from "react-icons/md";
import { RiCollapseDiagonal2Line, RiExpandDiagonalLine, RiPlayListAddFill } from "react-icons/ri";
import { FaUserShield, FaUser, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useGetRutas } from '@/services/permisos.services';
import { useRoles, usePermisosByRol, useSavePermisos } from '@/services/permisos.services';
import { toast } from "react-hot-toast";

export function TablaPermisos() {
  const [selectedTab, setSelectedTab] = useState("administrador");
  const {
    modulosConSubmodulos,
    loading: rutasLoading,
    error: rutasError,
    expandedModulos,
    toggleExpand,
    expandAll,
    addAll,
    deleteAll,
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
            rolePermisos[`submodulo_${permiso.id_submodulo}`] = {
              ver: !!permiso.ver,
              crear: !!permiso.crear,
              editar: !!permiso.editar,
              eliminar: !!permiso.eliminar,
              desactivar: !!permiso.desactivar,
              generar: !!permiso.generar
            };
          } else if (permiso.id_modulo) {
            rolePermisos[`modulo_${permiso.id_modulo}`] = {
              ver: !!permiso.ver,
              crear: !!permiso.crear,
              editar: !!permiso.editar,
              eliminar: !!permiso.eliminar,
              desactivar: !!permiso.desactivar,
              generar: !!permiso.generar

            };
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

  const handlePermissionChange = (id, field, value, type = 'modulo') => {
    if (!currentRoleId) return;

    const isChecked = typeof value === 'boolean'
      ? value
      : (value && typeof value === 'object' ? value.target?.checked : false);
    const key = `${type}_${id}`;

    setPermisosData(prev => {
      const currentRolePerms = { ...(prev[currentRoleId] || {}) };
      const currentPermission = {
        ...(currentRolePerms[key] || {
          ver: false,
          crear: false,
          editar: false,
          eliminar: false,
          desactivar: false,
          generar: false

        })
      };
      currentPermission[field] = isChecked;
      currentRolePerms[key] = currentPermission;

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

      modulosConSubmodulos.forEach((modulo) => {
        const moduloKey = `modulo_${modulo.id}`;
        if (rolePermisos[moduloKey]) {
          const { ver, crear, editar, eliminar, desactivar, generar } = rolePermisos[moduloKey];
          permisosToSave.push({
            id_modulo: modulo.id,
            id_submodulo: null,
            ver: ver ? 1 : 0,
            crear: crear ? 1 : 0,
            editar: editar ? 1 : 0,
            eliminar: eliminar ? 1 : 0,
            desactivar: desactivar ? 1 : 0,
            generar: generar ? 1 : 0
          });
        }

        modulo.submodulos.forEach((submodulo) => {
          const subKey = `submodulo_${submodulo.id_submodulo}`;
          if (rolePermisos[subKey]) {
            const { ver, crear, editar, eliminar, desactivar, generar } = rolePermisos[subKey];
            permisosToSave.push({
              id_modulo: modulo.id,
              id_submodulo: submodulo.id_submodulo,
              ver: ver ? 1 : 0,
              crear: crear ? 1 : 0,
              editar: editar ? 1 : 0,
              eliminar: eliminar ? 1 : 0,
              desactivar: desactivar ? 1 : 0,
              generar: generar ? 1 : 0,
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

  const handleAddAllPermissions = () => {
    if (!currentRoleId) return;

    const allPermissions = {};

    modulosConSubmodulos.forEach(modulo => {
      // Add all permissions for the module
      allPermissions[`modulo_${modulo.id}`] = {
        ver: true,
        crear: true,
        editar: true,
        eliminar: true,
        desactivar: true,
        generar: true
      };

      // Add all permissions for submodules
      if (modulo.submodulos && modulo.submodulos.length > 0) {
        modulo.submodulos.forEach(submodulo => {
          allPermissions[`submodulo_${submodulo.id_submodulo}`] = {
            ver: true,
            crear: true,
            editar: true,
            eliminar: true,
            desactivar: true,
            generar: true
          };
        });
      }
    });

    setPermisosData(prev => ({
      ...prev,
      [currentRoleId]: allPermissions
    }));
  };

  const handleDeleteAllPermissions = () => {
    if (!currentRoleId) return;

    setPermisosData(prev => ({
      ...prev,
      [currentRoleId]: {}
    }));
  };

  const formatRoleName = (roleName) => {
    if (roleName === "ADMIN") return "Administrador";
    if (roleName === "EMPLEADOS") return "Empleado";
    if (roleName === "SUPERVISOR") return "Supervisor";
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
          <div>
            <div className="text-sm text-gray-500">
              {modulosConSubmodulos.length} módulos disponibles
            </div>

          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              color="success"
              onPress={handleAddAllPermissions}
            >
              <RiPlayListAddFill className="text-green-700" size={20} />

              Agregar todos los permisos
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="danger"
              onPress={handleDeleteAllPermissions}
            >
              <MdPlaylistRemove className="text-red-700" size={20} />

              Quitar todos los permisos
            </Button>
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

        <Divider className="mb-3" />
        <div className="text-sm text-gray-400 mb-6">
          Recuerda guardar los cambios después de modificar los permisos.
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

                    <span className="font-semibold text-gray-800 text-lg">{modulo.nombre}</span>
                    {modulo.ruta && (
                      <span className="text-xs text-gray-500 ml-2">({modulo.ruta})</span>
                    )}
                  </div>

                  {modulo.id !== 9 && (
                    <>
                      <div className="flex gap-4 items-center">
                        <Checkbox
                          color="primary"
                          isSelected={rolePermisos[`modulo_${modulo.id}`]?.ver || false}
                          onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'ver', isChecked, 'modulo')}
                          onClick={(e) => e.stopPropagation()}
                          disableAnimation={true}
                        >
                          Ver
                        </Checkbox>
                        {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                          <Checkbox
                            color="success"
                            isSelected={rolePermisos[`modulo_${modulo.id}`]?.crear || false}
                            onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'crear', isChecked, 'modulo')}
                            onClick={(e) => e.stopPropagation()}
                            disableAnimation={true}
                          >
                            Agregar
                          </Checkbox>
                        )}
                        {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                          <Checkbox
                            color="warning"
                            isSelected={rolePermisos[`modulo_${modulo.id}`]?.editar || false}
                            onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'editar', isChecked, 'modulo')}
                            onClick={(e) => e.stopPropagation()}
                            disableAnimation={true}
                          >
                            Editar
                          </Checkbox>
                        )}
                        {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                          <Checkbox
                            color="danger"
                            isSelected={rolePermisos[`modulo_${modulo.id}`]?.eliminar || false}
                            onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'eliminar', isChecked, 'modulo')}
                            onClick={(e) => e.stopPropagation()}
                            disableAnimation={true}
                          >
                            Eliminar
                          </Checkbox>
                        )}
                        {modulo.id === 4 && (
                          <Checkbox
                            color="secondary"
                            isSelected={rolePermisos[`modulo_${modulo.id}`]?.desactivar || false}
                            onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'desactivar', isChecked, 'modulo')}
                            onClick={(e) => e.stopPropagation()}
                            disableAnimation={true}
                          >
                            Desactivar
                          </Checkbox>
                        )}
                      </div>
                    </>
                  )}
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
                                isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.ver || false}
                                onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'ver', isChecked, 'submodulo')}
                                disableAnimation={true}
                              >
                                Ver
                              </Checkbox>
                              <Checkbox
                                size="sm"
                                color="success"
                                isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.crear || false}
                                onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'crear', isChecked, 'submodulo')}
                                disableAnimation={true}
                              >
                                Agregar
                              </Checkbox>
                              <Checkbox
                                size="sm"
                                color="warning"
                                isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.editar || false}
                                onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'editar', isChecked, 'submodulo')}
                                disableAnimation={true}
                              >
                                Editar
                              </Checkbox>
                              <Checkbox
                                size="sm"
                                color="danger"
                                isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.eliminar || false}
                                onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'eliminar', isChecked, 'submodulo')}
                                disableAnimation={true}
                              >
                                Eliminar
                              </Checkbox>
                              {[1, 2, 3, 10, 11, 13].includes(submodulo.id_submodulo) && (
                                <Checkbox
                                  size="sm"
                                  color="secondary"
                                  isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.desactivar || false}
                                  onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'desactivar', isChecked, 'submodulo')}
                                  disableAnimation={true}
                                >
                                  Desactivar
                                </Checkbox>
                              )}
                              {[10, 11, 13].includes(submodulo.id_submodulo) && (
                                <Checkbox
                                  size="sm"
                                  color="default"
                                  isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.generar || false}
                                  onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'generar', isChecked, 'submodulo')}
                                  disableAnimation={true}
                                >
                                  Generar
                                </Checkbox>
                              )}
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
        <h1 className='text-3xl font-extrabold mb-4 text-blue-900 tracking-tight'>Gestión de permisos</h1>
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