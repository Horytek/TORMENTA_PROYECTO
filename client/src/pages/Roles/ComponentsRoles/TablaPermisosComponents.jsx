import { useState, useEffect } from "react";
import { useGetRutas, useRoles, usePermisosByRol, useSavePermisos } from '@/services/permisos.services';
import TablaPermisosContent from './TablaPermisosContent';

// Componente que usa hooks de API
export function TablaPermisosWithAPI() {
  const [selectedTab, setSelectedTab] = useState("administrador");
  const [userInfo, setUserInfo] = useState(null);
  
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

  return (
    <TablaPermisosContent
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      userInfo={userInfo}
      setUserInfo={setUserInfo}
      modulosConSubmodulos={modulosConSubmodulos}
      roles={roles}
      expandedModulos={expandedModulos}
      toggleExpand={toggleExpand}
      expandAll={expandAll}
      collapseAll={collapseAll}
      rutasLoading={rutasLoading}
      rutasError={rutasError}
      rolesLoading={rolesLoading}
      rolesError={rolesError}
      roleMapping={roleMapping}
      setRoleMapping={setRoleMapping}
      currentRoleId={currentRoleId}
      setCurrentRoleId={setCurrentRoleId}
      permisos={permisos}
      permisosLoading={permisosLoading}
      refetchPermisos={refetchPermisos}
      savePermisos={savePermisos}
      savingPermisos={savingPermisos}
      permisosData={permisosData}
      setPermisosData={setPermisosData}
    />
  );
}

// Componente que usa datos externos (sin hooks API)
export function TablaPermisosWithExternalData({ externalData, onPermisosUpdate }) {
  const [selectedTab, setSelectedTab] = useState("administrador");
  const [userInfo, setUserInfo] = useState(null);
  
  const [roleMapping, setRoleMapping] = useState({});
  const [currentRoleId, setCurrentRoleId] = useState(null);
  
  // Solo estos hooks porque se necesitan para funcionalidad específica de permisos
  const { permisos, loading: permisosLoading, refetchPermisos } = usePermisosByRol(currentRoleId);
  const { savePermisos, saving: savingPermisos } = useSavePermisos();

  const [permisosData, setPermisosData] = useState(externalData?.permisos || {});

  return (
    <TablaPermisosContent
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      userInfo={userInfo}
      setUserInfo={setUserInfo}
      modulosConSubmodulos={externalData?.rutas}
      roles={externalData?.roles}
      expandedModulos={externalData?.expandedModulos}
      toggleExpand={externalData?.toggleExpand}
      expandAll={externalData?.expandAll}
      collapseAll={externalData?.collapseAll}
      rutasLoading={false}
      rutasError={null}
      rolesLoading={false}
      rolesError={null}
      roleMapping={roleMapping}
      setRoleMapping={setRoleMapping}
      currentRoleId={currentRoleId}
      setCurrentRoleId={setCurrentRoleId}
      permisos={permisos}
      permisosLoading={permisosLoading}
      refetchPermisos={refetchPermisos}
      savePermisos={savePermisos}
      savingPermisos={savingPermisos}
      permisosData={permisosData}
      setPermisosData={setPermisosData}
      onPermisosUpdate={onPermisosUpdate}
    />
  );
}
