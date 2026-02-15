
import {
  Tabs,
  Tab,
  Spinner,
  Chip,
  useDisclosure,
  Select,
  SelectItem
} from "@heroui/react";
import { FaUserShield, FaUser, FaCube } from "react-icons/fa";
import { useState, useMemo, useEffect } from "react";
import { useRolesPorPlan, usePlanesDisponibles } from '@/services/permisosGlobales.services';
import { useUserStore } from "@/store/useStore";
import ActionCatalogTab from './ActionCatalogTab';
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { UnifiedPermissionsTable } from './UnifiedPermissionsTable';
import { ModuleConfigModal } from './ModuleConfigModal';
import { getActions } from '@/services/actionCatalog.services';

export function TablaPermisosGlobales() {
  const [selectedTab, setSelectedTab] = useState("administrador");
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [userInfo, setUserInfo] = useState(null);
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [allActions, setAllActions] = useState([]);

  // Config Modal State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [configModule, setConfigModule] = useState(null);

  // --- External Data (Roles & Plans) ---
  const { roles, loading: rolesLoading } = useRolesPorPlan();
  const { planes } = usePlanesDisponibles();

  // --- User Info & Developer Check ---
  useEffect(() => {
    const userData = useUserStore.getState();
    if (userData) {
      setUserInfo({
        ...userData,
        rol: parseInt(userData.rol) || userData.rol,
        id_rol: parseInt(userData.id_rol) || userData.id_rol
      });
    }

    // Load all actions for config modal (Always load these for config)
    getActions().then(dynamicActions => {
      const standardActions = [
        { key: 'ver', label: 'Ver', isDynamic: false },
        { key: 'crear', label: 'Crear', isDynamic: false },
        { key: 'editar', label: 'Editar', isDynamic: false },
        { key: 'eliminar', label: 'Eliminar', isDynamic: false },
        { key: 'desactivar', label: 'Desactivar', isDynamic: false },
        { key: 'generar', label: 'Generar', isDynamic: false }
      ];

      // Map dynamic actions to match structure
      const formattedDynamic = (dynamicActions || []).map(da => ({
        key: da.action_key,
        label: da.name,
        isDynamic: true
      }));

      setAllActions([...standardActions, ...formattedDynamic]);
    }).catch(console.error);

  }, []);

  const isDeveloper = useMemo(() => {
    if (!userInfo) return false;
    const isDevByUsername = userInfo?.usuario === 'desarrollador' || userInfo?.nameUser === 'desarrollador';
    const isDevByRole = userInfo?.rol === 10 || parseInt(userInfo?.rol) === 10;
    return isDevByUsername || isDevByRole;
  }, [userInfo]);

  const adminRoles = useMemo(() => {
    return (roles || []).filter(r => r.id_rol === 1 || (r.nom_rol || '').toUpperCase() === 'ADMINISTRADOR');
  }, [roles]);

  // --- Tab & Role Selection Logic ---
  useEffect(() => {
    if (!adminRoles || adminRoles.length === 0 || currentRoleId) return;
    setCurrentRoleId(adminRoles[0].id_rol);
  }, [adminRoles, currentRoleId]);

  const handleTabChange = (newTab) => {
    setSelectedTab(newTab);
    if (newTab === "actions_catalog") return;

    const role = adminRoles.find(r => r.nom_rol.toLowerCase() === newTab);
    if (role) setCurrentRoleId(role.id_rol);
  };

  // --- Unified v2 Hook ---
  const { data, loading, saving, updateLocalPermission, saveChanges, refetch } = useUnifiedPermissions(currentRoleId, selectedPlan);

  const formatRoleName = (roleName) => (roleName === "ADMIN" ? "Administrador" : roleName);
  const getPlanColor = (planId) => (planId === 1 ? "primary" : planId === 2 ? "secondary" : "warning");

  // --- Module Configuration Handler ---
  const handleConfigureModule = (item) => {
    setConfigModule(item);
    onOpen();
  };

  const handleConfigSuccess = async () => {
    // Reload permissions tree after config update
    if (refetch) await refetch();
  };


  if (rolesLoading) return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <FaUserShield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Permisos Globales (v2)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Administración unificada de permisos y recursos.
            </p>
          </div>
        </div>

        {/* Plan Selector */}
        <div className="w-full md:w-64">
          <Select
            label="Plan Objetivo"
            placeholder="Seleccionar plan"
            selectedKeys={[String(selectedPlan)]}
            onChange={(e) => setSelectedPlan(Number(e.target.value))}
            variant="bordered"
            color="primary"
            disallowEmptySelection
            className="max-w-xs"
          >
            {planes.map((plan) => (
              <SelectItem key={plan.id_plan} value={plan.id_plan} textValue={plan.descripcion_plan}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${plan.id_plan === 1 ? 'bg-blue-500' :
                    plan.id_plan === 2 ? 'bg-purple-500' : 'bg-emerald-500'
                    }`}></span>
                  {plan.descripcion_plan}
                </div>
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-zinc-800 overflow-hidden mt-8">
        <div className="p-0">
          <Tabs
            aria-label="Roles"
            selectedKey={selectedTab}
            onSelectionChange={handleTabChange}
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 px-6 pt-4 border-b border-slate-100 dark:border-zinc-800 w-full relative",
              cursor: "w-full bg-blue-600",
              tab: "max-w-fit px-0 h-12 text-slate-500",
              tabContent: "group-data-[selected=true]:text-blue-600 group-data-[selected=true]:font-bold"
            }}
          >
            {isDeveloper && (
              <Tab
                key="actions_catalog"
                title={
                  <div className="flex items-center gap-2 pb-1">
                    <span className="font-bold flex items-center gap-2">
                      <FaCube size={16} /> Catálogo
                    </span>
                  </div>
                }
              >
                <ActionCatalogTab />
              </Tab>
            )}

            {adminRoles.map(role => {
              const tabKey = role.nom_rol.toLowerCase();
              return (
                <Tab
                  key={tabKey}
                  title={
                    <div className="flex items-center gap-2 pb-1">
                      <FaUserShield size={16} />
                      <span>{formatRoleName(role.nom_rol)}</span>
                      {role.plan_requerido && (
                        <Chip size="sm" color={getPlanColor(role.plan_requerido)} variant="flat" className="ml-1 h-5 text-[10px]">
                          Plan {role.plan_requerido}+
                        </Chip>
                      )}
                    </div>
                  }
                >
                  <div className="p-6 pt-4">
                    {/* Unified Table Component */}
                    <UnifiedPermissionsTable
                      data={data}
                      loading={loading}
                      isSaving={saving}
                      onToggle={updateLocalPermission}
                      onSave={saveChanges}
                      onConfigure={handleConfigureModule}
                    />
                  </div>
                </Tab>
              );
            })}
          </Tabs>
        </div>
      </div>

      {/* Configuration Modal */}
      {configModule && (
        <ModuleConfigModal
          isOpen={isOpen}
          onClose={onClose}
          moduleData={configModule}
          type={configModule.type} // 'modulo' or 'submodulo' (from unified Item)
          allActions={allActions}
          currentAllowed={configModule.availableActions}
          onSuccess={handleConfigSuccess}
        />
      )}
    </>
  );
}

export default TablaPermisosGlobales;
