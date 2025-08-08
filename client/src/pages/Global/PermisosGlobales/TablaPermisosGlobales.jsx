import {
  Card,
  CardHeader,
  CardBody,
  Tabs,
  Tab,
  Spinner,
  Button,
  Chip
} from "@heroui/react";
import { FaUserShield, FaUser } from "react-icons/fa";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useGetRutasPorPlan } from '@/services/permisosGlobales.services';
import { useRolesPorPlan, usePermisosByRolGlobal, useSavePermisosGlobales, usePlanesDisponibles } from '@/services/permisosGlobales.services';
import { toast } from "react-hot-toast";
import ModulosListing from './ModulosListing';

export function TablaPermisosGlobales() {
  const [selectedTab, setSelectedTab] = useState("administrador");
  const [selectedPlan, setSelectedPlan] = useState(1); // Enterprise por defecto 
  const [userInfo, setUserInfo] = useState(null);
  const [roleMapping, setRoleMapping] = useState({});
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [permisosData, setPermisosData] = useState({});
  const [forceRenderKey, setForceRenderKey] = useState(0); // Key para forzar re-render completo

  // Efecto simple para manejar cambios de plan/rol
  useEffect(() => {
    if (selectedPlan && currentRoleId && isInitialized.current) {
      // Solo limpiar los datos del estado, sin complicar con transiciones
      setPermisosData(prev => {
        const dataKey = `${currentRoleId}_${selectedPlan}`;
        // Si no existe el dataKey, crear uno vacío para forzar la recarga
        if (!prev[dataKey]) {
          return {
            ...prev,
            [dataKey]: {}
          };
        }
        return prev;
      });
      
      // Forzar re-render para actualizar la UI
      setForceRenderKey(prev => prev + 1);
    }
  }, [selectedPlan, currentRoleId]);

  // Forzar recarga de permisos al cambiar de plan o rol
  useEffect(() => {
    if (currentRoleId && selectedPlan && typeof refetchPermisos === 'function') {
      refetchPermisos();
    }
  }, [currentRoleId, selectedPlan]);
  
  // Ref para controlar el primer render y prevenir bucles
  const isInitialized = useRef(false);
  const lastProcessedKey = useRef('');
  const lastToastTimeRef = useRef(0); // Para debounce de toasts

  // Función helper para mostrar toasts con debounce
  const showToastWithDebounce = useCallback((message, type = 'success') => {
    const now = Date.now();
    const timeSinceLastToast = now - lastToastTimeRef.current;
    
    // Solo mostrar toast si han pasado al menos 500ms desde el último
    if (timeSinceLastToast > 500) {
      if (type === 'success') {
        toast.success(message);
      } else if (type === 'error') {
        toast.error(message);
      }
      lastToastTimeRef.current = now;
    }
  }, []);
  
  const {
    modulosConSubmodulos,
    planEmpresa,
    loading: rutasLoading,
    error: rutasError,
    expandedModulos,
    toggleExpand,
    expandAll,
    collapseAll
  } = useGetRutasPorPlan();

  const { roles, loading: rolesLoading, error: rolesError } = useRolesPorPlan();
  const { planes, loading: planesLoading } = usePlanesDisponibles();
  
  
  const { permisos, loading: permisosLoading, refetchPermisos } = usePermisosByRolGlobal(currentRoleId, selectedPlan);
  const { savePermisos, saving: savingPermisos } = useSavePermisosGlobales();

  // Memoizar el cálculo de isDeveloper - verificar múltiples campos con más flexibilidad
  const isDeveloper = useMemo(() => {
    if (!userInfo) {
      return false;
    }
    
    // Múltiples verificaciones más flexibles
    const isDevByUsername = userInfo?.usuario === 'desarrollador' || 
                           userInfo?.nameUser === 'desarrollador';
    
    const isDevByRole = userInfo?.rol === 10 || 
                       userInfo?.rol === '10' ||
                       parseInt(userInfo?.rol) === 10;
    
    const isDevByIdRole = userInfo?.id_rol === 10 || 
                         userInfo?.id_rol === '10' ||
                         parseInt(userInfo?.id_rol) === 10;
    
    const isDev = isDevByUsername || isDevByRole || isDevByIdRole;
    
    return isDev;
  }, [userInfo]);

  // Obtener información del usuario para saber si es desarrollador - solo una vez
  useEffect(() => {
    if (userInfo) return; // Ya tenemos la data
    
    const userDataString = sessionStorage.getItem("user");
    
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        
        // Asegurar que los números sean números
        const normalizedUserData = {
          ...userData,
          rol: parseInt(userData.rol) || userData.rol,
          id_rol: parseInt(userData.id_rol) || userData.id_rol
        };
        
        setUserInfo(normalizedUserData);
      } catch {
        // Error parsing user data
      }
    } else {
      // Intentar obtener de localStorage como fallback
      const userDataFromLocalStorage = localStorage.getItem("user");
      if (userDataFromLocalStorage) {
        try {
          const userData = JSON.parse(userDataFromLocalStorage);
          setUserInfo(userData);
        } catch {
          // Error parsing localStorage data
        }
      }
    }
  }, []); // Sin dependencias para ejecutar solo una vez

  // Manejo inicial de roles y mapeo - más estable
  useEffect(() => {
      
    if (!roles || roles.length === 0) return;

    const tabRoleMapping = {};
    roles.forEach(role => {
      const tabKey = role.nom_rol.toLowerCase();
      tabRoleMapping[tabKey] = role.id_rol;
    });

    const firstRole = roles[0];
    const firstTabKey = firstRole.nom_rol.toLowerCase();

    // Batch all updates
    setRoleMapping(tabRoleMapping);
    setSelectedTab(firstTabKey);
    setCurrentRoleId(firstRole.id_rol);

    isInitialized.current = true;
  }, [roles]);

  // Manejo de cambio de tab seleccionado - simplificado
  const handleTabChange = useCallback((newTab) => {
    if (roleMapping[newTab] && roleMapping[newTab] !== currentRoleId) {
      setSelectedTab(newTab);
      setCurrentRoleId(roleMapping[newTab]);
    }
  }, [roleMapping, currentRoleId]);

  // Procesamiento de permisos - mejorado para asegurar que siempre se procesen
  useEffect(() => {
    if (!currentRoleId || !isInitialized.current || !selectedPlan) {
      return;
    }

    const dataKey = `${currentRoleId}_${selectedPlan}`;
    
    // Si no hay permisos, crear estructura vacía
    if (!permisos || permisos.length === 0) {
      setPermisosData(prev => ({
        ...prev,
        [dataKey]: {}
      }));
      return;
    }

    const rolePermisos = {};

    // Procesar permisos
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

    // Actualizar siempre los datos y forzar re-render
    setPermisosData(prev => ({
      ...prev,
      [dataKey]: rolePermisos
    }));
    
    // Forzar re-render para asegurar que los checkboxes se actualicen
    setForceRenderKey(prev => prev + 1);
  }, [currentRoleId, permisos, selectedPlan]);

  const handlePermissionChange = useCallback((id, field, value, type = 'modulo') => {
    if (!currentRoleId || !selectedPlan) return;

    const isChecked = typeof value === 'boolean'
      ? value
      : (value && typeof value === 'object' ? value.target?.checked : false);
    const key = `${type}_${id}`;
    const dataKey = `${currentRoleId}_${selectedPlan}`;

    setPermisosData(prev => {
      const currentRolePerms = { ...prev[dataKey] };
      const currentPermission = {
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
        desactivar: false,
        generar: false,
        ...currentRolePerms[key]
      };
      
      // Solo actualizar si el valor realmente cambió
      if (currentPermission[field] === isChecked) {
        return prev;
      }
      
      currentPermission[field] = isChecked;
      currentRolePerms[key] = currentPermission;

      const newState = {
        ...prev,
        [dataKey]: currentRolePerms
      };

      return newState;
    });
  }, [currentRoleId, selectedPlan]);

  const handleSavePermissions = useCallback(async () => {
    if (!currentRoleId || !selectedPlan) return;

    try {
      const dataKey = `${currentRoleId}_${selectedPlan}`;
      const rolePermisos = permisosData[dataKey] || {};
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

      const success = await savePermisos(currentRoleId, permisosToSave, selectedPlan);

      if (success) {
        showToastWithDebounce(`Permisos globales para plan ${planes.find(p => p.id_plan === selectedPlan)?.descripcion_plan || selectedPlan} guardados correctamente`);
        refetchPermisos();
      } else {
        showToastWithDebounce("Error al guardar los permisos globales", 'error');
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      showToastWithDebounce("Error al guardar los permisos globales", 'error');
    }
  }, [currentRoleId, permisosData, modulosConSubmodulos, savePermisos, refetchPermisos, selectedPlan, planes, showToastWithDebounce]);

  const handleAddAllPermissions = useCallback(() => {
    if (!currentRoleId || !selectedPlan || !modulosConSubmodulos) return;

    const dataKey = `${currentRoleId}_${selectedPlan}`;
    const currentData = permisosData[dataKey] || {};
    
    const allPermissions = {};

    modulosConSubmodulos.forEach(modulo => {
      allPermissions[`modulo_${modulo.id}`] = {
        ver: true,
        crear: true,
        editar: true,
        eliminar: true,
        desactivar: true,
        generar: true
      };

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

    // Solo actualizar y mostrar toast si realmente hay cambios
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(allPermissions);
    
    if (hasChanges) {
      setPermisosData(prev => ({
        ...prev,
        [dataKey]: allPermissions
      }));
      showToastWithDebounce("Todos los permisos han sido agregados");
    }
  }, [currentRoleId, selectedPlan, modulosConSubmodulos, permisosData, showToastWithDebounce]);

  const handleDeleteAllPermissions = useCallback(() => {
    if (!currentRoleId || !selectedPlan) return;

    const dataKey = `${currentRoleId}_${selectedPlan}`;
    const currentData = permisosData[dataKey];
    
    // Solo actualizar y mostrar toast si hay datos para limpiar
    if (currentData && Object.keys(currentData).length > 0) {
      setPermisosData(prev => ({
        ...prev,
        [dataKey]: {}
      }));
      showToastWithDebounce("Todos los permisos han sido eliminados");
    }
  }, [currentRoleId, selectedPlan, permisosData, showToastWithDebounce]);

  const formatRoleName = (roleName) => {
    if (roleName === "ADMIN") return "Administrador";
    if (roleName === "EMPLEADOS") return "Empleado";
    if (roleName === "SUPERVISOR") return "Supervisor";
    return roleName;
  };

  const getPlanColor = (planId) => {
    switch(planId) {
      case 1: return "primary";
      case 2: return "secondary";
      case 3: return "warning";
      default: return "default";
    }
  };

  const renderModulosListing = () => {
    return (
      <ModulosListing 
        rutasLoading={rutasLoading}
        rolesLoading={rolesLoading}
        planesLoading={planesLoading}
        permisosLoading={permisosLoading}
        rutasError={rutasError}
        rolesError={rolesError}
        modulosConSubmodulos={modulosConSubmodulos}
        currentRoleId={currentRoleId}
        selectedPlan={selectedPlan}
        forceRenderKey={forceRenderKey}
        permisosData={permisosData}
        permisos={permisos}
        lastProcessedKey={lastProcessedKey}
        planes={planes}
        planEmpresa={planEmpresa}
        isDeveloper={isDeveloper}
        setSelectedPlan={setSelectedPlan}
        handleAddAllPermissions={handleAddAllPermissions}
        handleDeleteAllPermissions={handleDeleteAllPermissions}
        expandedModulos={expandedModulos}
        toggleExpand={toggleExpand}
        expandAll={expandAll}
        collapseAll={collapseAll}
        handlePermissionChange={handlePermissionChange}
        userInfo={userInfo}
        getPlanColor={getPlanColor}
      />
    );
  };

  return (
    <>
      {/* Validación temprana para evitar errores de renderizado */}
      {(rutasLoading || rolesLoading || !isInitialized.current) && (
        <div className="flex justify-center items-center h-64">
          <Spinner label="Cargando datos iniciales..." color="primary" size="lg" />
        </div>
      )}
      
      {(rutasError || rolesError) && (
        <div className="p-4 text-center text-danger">
          <p>Error al cargar los datos:</p>
          <p>{rutasError || rolesError}</p>
        </div>
      )}
      
      {!rutasLoading && !rolesLoading && isInitialized.current && !rutasError && !rolesError && (
        <>
          <div className="flex flex-col mb-4">
            <h1 className='text-3xl font-extrabold mb-4 text-blue-900 tracking-tight'>
              Gestión de permisos globales por Plan
            </h1>
            <p
              className="text-small text-default-400"
              style={{ fontSize: "16px", userSelect: "none", marginTop: "10px" }}
            >
              Administra los permisos de acceso según el plan de suscripción de cada empresa.
            </p>
           
          </div>
      <Card>
        <CardHeader>
        </CardHeader>
        <CardBody>
          <Tabs
            aria-label="Roles"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
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
                      {role.plan_requerido && (
                        <Chip size="sm" color={getPlanColor(role.plan_requerido)} variant="flat">
                          Plan {role.plan_requerido}+
                        </Chip>
                      )}
                    </div>
                  }
                >
                  <div className="p-4">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      {isAdmin ? <FaUserShield /> : <FaUser />}
                      Permisos de {formatRoleName(role.nom_rol)}
                      {isDeveloper && (
                        <span className="text-sm font-normal text-gray-500">
                          (Plan {planes.find(p => p.id_plan === selectedPlan)?.descripcion_plan || selectedPlan || "Básico"})
                        </span>
                      )}
                    </h3>
                    {renderModulosListing()}
                    {isDeveloper && (
                      <div className="mt-6 flex justify-end">
                        <Button
                          color="primary"
                          isLoading={savingPermisos}
                          onPress={handleSavePermissions}
                        >
                          {savingPermisos ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </div>
                    )}
                  </div>
                </Tab>
              );
            })}
          </Tabs>
        </CardBody>
      </Card>
        </>
      )}
    </>
  );
}

export default TablaPermisosGlobales;
