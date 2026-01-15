import {
  Tabs,
  Tab,
  Spinner,
} from "@heroui/react";
import { FaUserShield, FaUser } from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import { useUserStore } from "@/store/useStore";
import { UnifiedPermissionsTable } from "@/pages/Global/PermisosGlobales/UnifiedPermissionsTable";
import { useUnifiedPermissions } from '@/hooks/useUnifiedPermissions';
import { useRoles } from '@/services/permisos.services';

// Componente de contenido compartido - AHORA USA useUnifiedPermissions para sincronización
export default function TablaPermisosContent() {
  // Fetch roles list
  const { roles, loading: rolesLoading } = useRoles();

  // Filter out Administrator role (id_rol === 1) - Admin permissions are managed globally
  const filteredRoles = useMemo(() => {
    return (roles || []).filter(r => r.id_rol !== 1);
  }, [roles]);

  // Local state for Tabs (UI only)
  const [activeTab, setActiveTab] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // Plan ID - default to 1 (can be extended to read from user context if needed)
  const planId = 1;

  // Unified Permissions Hook - SAME source as Global Permissions page
  const {
    data,
    loading: permissionsLoading,
    saving: permissionsSaving,
    updateLocalPermission,
    saveChanges
  } = useUnifiedPermissions(selectedRoleId, planId);

  // Initialize first non-admin role
  useEffect(() => {
    if (filteredRoles && filteredRoles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(filteredRoles[0].id_rol);
      setActiveTab(filteredRoles[0].nom_rol.toLowerCase());
    }
  }, [filteredRoles, selectedRoleId]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (roles) {
      const found = roles.find(r => r.nom_rol.toLowerCase() === key);
      if (found) setSelectedRoleId(found.id_rol);
    }
  };

  const userStore = useUserStore(state => state.user);
  const currentUser = userStore?.original || userStore;

  const formatRoleName = (roleName) => {
    if (roleName === "ADMIN") return "Administrador";
    if (roleName === "EMPLEADOS") return "Empleado";
    if (roleName === "SUPERVISOR") return "Supervisor";
    return roleName;
  };

  if (rolesLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {currentUser?.usuario === 'desarrollador' && (
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
          selectedKey={activeTab}
          onSelectionChange={handleTabChange}
          color="primary"
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider mb-6",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary"
          }}
        >
          {filteredRoles?.map(role => {
            const tabKey = role.nom_rol.toLowerCase();

            return (
              <Tab
                key={tabKey}
                title={
                  <div className="flex items-center gap-2">
                    <FaUser className="mb-0.5" />
                    <span className="text-base">{formatRoleName(role.nom_rol)}</span>
                  </div>
                }
              >
                <div className="py-2">
                  <UnifiedPermissionsTable
                    data={data}
                    loading={permissionsLoading}
                    isSaving={permissionsSaving}
                    onToggle={updateLocalPermission}
                    onSave={saveChanges}
                  />
                </div>
              </Tab>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
