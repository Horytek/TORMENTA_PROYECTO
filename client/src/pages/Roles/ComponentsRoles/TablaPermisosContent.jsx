import {
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
import { toast } from "react-hot-toast";
import { useUserStore } from "@/store/useStore";
import { ButtonSave } from "@/components/Buttons/Buttons";

// Componente de contenido compartido
export default function TablaPermisosContent({
  selectedTab,
  setSelectedTab,
  userInfo,
  setUserInfo,
  modulosConSubmodulos,
  roles,
  expandedModulos,
  toggleExpand,
  expandAll,
  collapseAll,
  rutasLoading,
  rutasError,
  rolesLoading,
  rolesError,
  roleMapping,
  setRoleMapping,
  currentRoleId,
  setCurrentRoleId,
  permisos,
  permisosLoading,
  refetchPermisos,
  savePermisos,
  savingPermisos,
  permisosData,
  setPermisosData,
  onPermisosUpdate
}) {
  // Obtener información del usuario para saber si es desarrollador
  const userStore = useUserStore(state => state.user);

  // Fallback local si el padre no provee setUserInfo
  const [localUserInfo, setLocalUserInfo] = useState(null);
  const setUserInfoSafe = typeof setUserInfo === "function" ? setUserInfo : setLocalUserInfo;

  useEffect(() => {
    if (userStore) {
      if (typeof setUserInfo !== "function" && import.meta.env?.DEV) {
        // Log claro para identificar el origen si vuelve a pasar
        console.warn("TablaPermisosContent: setUserInfo no es función; usando estado local.");
      }
      setUserInfoSafe(userStore.original || userStore);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userStore]);

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
  }, [roles, selectedTab, setRoleMapping, setSelectedTab, setCurrentRoleId]);

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
  }, [permisos, currentRoleId, setPermisosData]);

  useEffect(() => {
    if (selectedTab && roleMapping[selectedTab]) {
      setCurrentRoleId(roleMapping[selectedTab]);
    }
  }, [selectedTab, roleMapping, setCurrentRoleId]);

  const handlePermissionChange = (id, field, value, type = 'modulo') => {
    if (!currentRoleId) return;

    const isChecked = typeof value === 'boolean'
      ? value
      : (value && typeof value === 'object' ? value.target?.checked : false);
    const key = `${type}_${id}`;

    setPermisosData(prev => {
      const currentRolePerms = { ...prev[currentRoleId] };
      const currentPermission = {
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
        desactivar: false,
        generar: false,
        ...(currentRolePerms[key] || {})
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
        if (userInfo?.usuario === 'desarrollador') {
          toast.success("Permisos guardados para todos los inquilinos del sistema");
        } else {
          toast.success("Permisos guardados correctamente");
        }
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {modulosConSubmodulos.length} módulos disponibles
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="flat"
              color="success"
              onPress={handleAddAllPermissions}
              startContent={<RiPlayListAddFill size={16} />}
              className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="danger"
              onPress={handleDeleteAllPermissions}
              startContent={<MdPlaylistRemove size={16} />}
              className="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            >
              Ninguno
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="primary"
              onPress={expandAll}
              startContent={<RiExpandDiagonalLine size={16} />}
            >
              Expandir
            </Button>
            <Button
              size="sm"
              variant="flat"
              color="secondary"
              onPress={collapseAll}
              startContent={<RiCollapseDiagonal2Line size={16} />}
            >
              Colapsar
            </Button>
          </div>
        </div>

        <Divider className="mb-6 bg-slate-200 dark:bg-zinc-800" />

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
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-base">{modulo.nombre}</span>
                    {modulo.ruta && (
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">({modulo.ruta})</span>
                    )}
                  </div>
                </div>

                {modulo.id !== 9 && (
                  <div className="flex gap-4 items-center">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        color="primary"
                        isSelected={rolePermisos[`modulo_${modulo.id}`]?.ver || false}
                        onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'ver', isChecked, 'modulo')}
                      >
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ver</span>
                      </Checkbox>
                    </div>
                  </div>
                )}
              </div>

              {expandedModulos[modulo.id] && (
                <>
                  <div className="border-t border-slate-100 dark:border-zinc-800">
                    {modulo.id !== 9 && (
                      <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-800/50 flex flex-wrap gap-4">
                        {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                          <Checkbox
                            color="success"
                            size="sm"
                            isSelected={rolePermisos[`modulo_${modulo.id}`]?.crear || false}
                            onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'crear', isChecked, 'modulo')}
                          >
                            Agregar
                          </Checkbox>
                        )}
                        {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                          <Checkbox
                            color="warning"
                            size="sm"
                            isSelected={rolePermisos[`modulo_${modulo.id}`]?.editar || false}
                            onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'editar', isChecked, 'modulo')}
                          >
                            Editar
                          </Checkbox>
                        )}
                        {modulo.id !== 1 && modulo.id !== 6 && modulo.id !== 7 && (
                          <Checkbox
                            color="danger"
                            size="sm"
                            isSelected={rolePermisos[`modulo_${modulo.id}`]?.eliminar || false}
                            onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'eliminar', isChecked, 'modulo')}
                          >
                            Eliminar
                          </Checkbox>
                        )}
                        {modulo.id === 4 && (
                          <Checkbox
                            color="secondary"
                            size="sm"
                            isSelected={rolePermisos[`modulo_${modulo.id}`]?.desactivar || false}
                            onValueChange={(isChecked) => handlePermissionChange(modulo.id, 'desactivar', isChecked, 'modulo')}
                          >
                            Desactivar
                          </Checkbox>
                        )}
                      </div>
                    )}

                    {modulo.submodulos && modulo.submodulos.length > 0 && (
                      <div className="bg-slate-50/50 dark:bg-zinc-800/30 p-2 space-y-2">
                        {modulo.submodulos
                          .filter(submodulo => submodulo.id_submodulo !== 8)
                          .map((submodulo) => (
                            <div
                              key={submodulo.id_submodulo}
                              className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 ml-4 shadow-sm"
                            >
                              <div className="flex items-center gap-2 mb-2 sm:mb-0 w-full sm:w-auto">
                                <span className="text-slate-700 dark:text-slate-300 font-medium">↳ {submodulo.nombre_sub}</span>
                              </div>

                              <div className="flex flex-wrap gap-3 items-center justify-end w-full sm:w-auto">
                                <Checkbox
                                  size="sm"
                                  color="primary"
                                  isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.ver || false}
                                  onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'ver', isChecked, 'submodulo')}
                                >
                                  Ver
                                </Checkbox>
                                <Checkbox
                                  size="sm"
                                  color="success"
                                  isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.crear || false}
                                  onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'crear', isChecked, 'submodulo')}
                                >
                                  Agregar
                                </Checkbox>
                                <Checkbox
                                  size="sm"
                                  color="warning"
                                  isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.editar || false}
                                  onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'editar', isChecked, 'submodulo')}
                                >
                                  Editar
                                </Checkbox>
                                <Checkbox
                                  size="sm"
                                  color="danger"
                                  isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.eliminar || false}
                                  onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'eliminar', isChecked, 'submodulo')}
                                >
                                  Eliminar
                                </Checkbox>
                                {[1, 2, 3, 10, 11, 13].includes(submodulo.id_submodulo) && (
                                  <Checkbox
                                    size="sm"
                                    color="secondary"
                                    isSelected={rolePermisos[`submodulo_${submodulo.id_submodulo}`]?.desactivar || false}
                                    onValueChange={(isChecked) => handlePermissionChange(submodulo.id_submodulo, 'desactivar', isChecked, 'submodulo')}
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
                                  >
                                    Generar
                                  </Checkbox>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
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
      {userInfo?.usuario === 'desarrollador' && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
          <div className="flex items-center gap-2">
            <FaUserShield className="text-amber-600 dark:text-amber-500" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Modo Desarrollador: Los cambios se aplicarán a todos los inquilinos del sistema
            </span>
          </div>
        </div>
      )}

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
                <div className="py-6">
                  {renderModulosListing()}
                  <div className="mt-8 flex justify-end sticky bottom-6 z-10">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800">
                      <ButtonSave
                        onPress={handleSavePermissions}
                        isLoading={savingPermisos}
                        text={savingPermisos ? "Guardando..." : "Guardar cambios"}
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