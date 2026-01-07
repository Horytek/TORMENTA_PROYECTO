import { Spinner, Divider } from "@heroui/react";
import ModuloPermisos from './ModuloPermisos';
import PermissionsToolbar from './PermissionsToolbar';

export function ModulosListing({
  rutasLoading,
  rolesLoading,
  planesLoading,
  permisosLoading,
  rutasError,
  rolesError,
  modulosConSubmodulos,
  currentRoleId,
  selectedPlan,
  forceRenderKey,
  permisosData,
  permisos,
  lastProcessedKey,
  planes,
  planEmpresa,
  isDeveloper,
  setSelectedPlan,
  handleAddAllPermissions,
  handleDeleteAllPermissions,
  expandedModulos,
  toggleExpand,
  expandAll,
  collapseAll,
  handlePermissionChange,
  userInfo,
  getPlanColor,
  dynamicActions,
  onConfigUpdate // New prop
}) {

  if (rutasLoading || rolesLoading || planesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Cargando..." color="primary" size="lg" />
      </div>
    );
  }

  if (permisosLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner label="Cargando permisos..." color="primary" size="lg" />
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
        No hay módulos disponibles para este plan.
      </div>
    );
  }

  if (!currentRoleId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Selecciona un rol para ver los permisos.
      </div>
    );
  }

  const dataKey = `${currentRoleId}_${selectedPlan}`;
  let rolePermisos = permisosData[dataKey];

  // Si los permisos están cargando y tenemos datos de la API pero no en nuestro estado local, forzar procesamiento
  if (!rolePermisos && permisos && permisos.length > 0 && !permisosLoading) {
    lastProcessedKey.current = ''; // Reset para forzar procesamiento
  }

  // Si no hay permisos cargados, inicializar vacío SIEMPRE para evitar mostrar permisos de otro plan
  if (!rolePermisos || typeof rolePermisos !== 'object') {
    rolePermisos = {};
  }

  return (
    <>
      <PermissionsToolbar
        modulosConSubmodulos={modulosConSubmodulos}
        selectedPlan={selectedPlan}
        planes={planes}
        planEmpresa={planEmpresa}
        isDeveloper={isDeveloper}
        setSelectedPlan={setSelectedPlan}
        handleAddAllPermissions={handleAddAllPermissions}
        handleDeleteAllPermissions={handleDeleteAllPermissions}
        expandAll={expandAll}
        collapseAll={collapseAll}
        getPlanColor={getPlanColor}
      />

      <Divider className="mb-3" />

      <div className="text-sm text-gray-400 mb-6">
        {isDeveloper
          ? `Configurando permisos globales para el plan ${planes.find(p => p.id_plan === selectedPlan)?.descripcion_plan || selectedPlan}. Recuerda guardar los cambios después de modificar los permisos.`
          : `Visualizando permisos disponibles para tu plan actual: ${planes.find(p => p.id_plan === planEmpresa)?.descripcion_plan || 'Desconocido'}. Los checkboxes están deshabilitados ya que solo el desarrollador puede modificar estos permisos.`
        }
      </div>

      <div className="space-y-5">
        {modulosConSubmodulos.map((modulo) => (
          <ModuloPermisos
            key={`${modulo.id}-${selectedPlan}-${forceRenderKey}`}
            modulo={modulo}
            expandedModulos={expandedModulos}
            toggleExpand={toggleExpand}
            permisosData={permisosData}
            dataKey={dataKey}
            handlePermissionChange={handlePermissionChange}
            isDeveloper={isDeveloper}
            userInfo={userInfo}
            getPlanColor={getPlanColor}
            dynamicActions={dynamicActions}
            onConfigUpdate={onConfigUpdate}
          />
        ))}
      </div>
    </>
  );
}

export default ModulosListing;
