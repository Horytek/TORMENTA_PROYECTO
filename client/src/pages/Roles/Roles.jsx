import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UsuariosForm from './UsuariosForm';
import { Toaster } from "react-hot-toast";
import TablaRoles from './ComponentsRoles/TablaRoles';
import TablaPermisos from './ComponentsRoles/TablaPermisos';
import TablaAsignacion from './ComponentsRoles/TablaAsignacion';
import { Tabs, Tab, Spinner } from "@heroui/react";
import { useGetRutas, useRoles } from '@/services/permisos.services';
import axios from '@/api/axios';

function Usuarios() {
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);
  
  // Para navegación por URL
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados para datos centralizados
  const [allData, setAllData] = useState({
    rutas: null,
    roles: null,
    permisos: {},
    defaultPages: {}
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Hooks para servicios
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

  // Determinar tab actual basado en la URL
  const getCurrentTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/permisos')) return 'permisos';
    if (path.includes('/paginas')) return 'paginas';
    return 'roles';
  }, [location.pathname]);

  // Cargar todos los datos cuando los servicios estén listos
  useEffect(() => {
    const fetchAllData = async () => {
      if (!modulosConSubmodulos || !roles || rutasLoading || rolesLoading) {
        return;
      }

      try {
        setIsLoadingData(true);
        
        // Fetch default pages for all roles
        const defaultPagesPromises = roles.map(async (role) => {
          try {
            const response = await axios.get(`/rol/pagina-defecto/${role.id_rol}`);
            if (response.data.code === 1) {
              return { 
                roleId: role.id_rol, 
                data: {
                  id_modulo: response.data.data.id_modulo,
                  id_submodulo: response.data.data.id_submodulo
                }
              };
            }
          } catch (error) {
            console.error(`Error fetching default page for role ${role.id_rol}:`, error);
          }
          return { roleId: role.id_rol, data: null };
        });

        const defaultPagesResults = await Promise.all(defaultPagesPromises);
        const defaultPages = {};
        defaultPagesResults.forEach(({ roleId, data }) => {
          if (data) {
            defaultPages[roleId] = data;
          }
        });

        setAllData({
          rutas: modulosConSubmodulos,
          roles: roles,
          permisos: {},
          defaultPages: defaultPages
        });
        
      } catch (error) {
        console.error('Error loading roles data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchAllData();
  }, [modulosConSubmodulos, roles, rutasLoading, rolesLoading]);

  // Manejar cambio de tab con navegación
  const handleTabChange = (tabKey) => {
    const basePath = '/configuracion/roles';
    let newPath = basePath;
    
    if (tabKey === 'permisos') {
      newPath = `${basePath}/permisos`;
    } else if (tabKey === 'paginas') {
      newPath = `${basePath}/paginas`;
    }
    
    navigate(newPath);
  };

  // Función para actualizar permisos en cache
  const _updatePermisosCache = (roleId, permisos) => {
    setAllData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [roleId]: permisos
      }
    }));
  };

  // Función para actualizar default pages en cache
  const _updateDefaultPagesCache = (roleId, pageData) => {
    setAllData(prev => ({
      ...prev,
      defaultPages: {
        ...prev.defaultPages,
        [roleId]: pageData
      }
    }));
  };

  if (rutasError || rolesError) {
    return (
      <div className="mx-2 md:mx-6 my-4">
        <div className="p-4 text-center text-red-500">
          <p>Error al cargar los datos del módulo de roles</p>
          <p>{rutasError || rolesError}</p>
        </div>
      </div>
    );
  }

  if (isLoadingData || rutasLoading || rolesLoading) {
    return (
      <div className="mx-2 md:mx-6 my-4">
        <div className="flex justify-center items-center h-64">
          <Spinner label="Cargando módulo de roles..." color="primary" size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-2 md:mx-6 my-4">
      <Toaster />
      <Tabs
        selectedKey={getCurrentTab}
        onSelectionChange={handleTabChange}
        className="mb-8"
        classNames={{
          tabList: "bg-transparent flex gap-4",
          tab: "rounded-lg px-6 py-3 font-semibold text-base transition-colors text-blue-700 data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-blue-100 data-[selected=true]:to-blue-50 data-[selected=true]:text-blue-900 data-[selected=true]:shadow data-[selected=true]:border data-[selected=true]:border-blue-200",
        }}
      >
        <Tab key="roles" title="Roles">
          <TablaRoles 
            externalData={allData.roles}
            skipApiCall={true}
          />
        </Tab>
        <Tab key="permisos" title="Permisos">
          {getCurrentTab === 'permisos' && (
            <TablaPermisos 
              externalData={{
                rutas: allData.rutas,
                roles: allData.roles,
                permisos: allData.permisos,
                expandedModulos,
                toggleExpand,
                expandAll,
                collapseAll
              }}
              skipApiCall={true}
            />
          )}
        </Tab>
        <Tab key="paginas" title="Pantalla de inicio">
          {getCurrentTab === 'paginas' && (
            <TablaAsignacion 
              externalData={{
                rutas: allData.rutas,
                roles: allData.roles,
                defaultPages: allData.defaultPages,
                expandedModulos,
                toggleExpand,
                expandAll,
                collapseAll
              }}
              skipApiCall={true}
            />
          )}
        </Tab>
      </Tabs>
      {activeAdd && (
        <UsuariosForm modalTitle={'Nuevo Rol'} onClose={handleModalAdd} />
      )}
    </div>
  );
}

export default Usuarios;