import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RolesForm from './RolesForm';
import TablaRoles from './ComponentsRoles/TablaRoles';
import TablaPermisos from './ComponentsRoles/TablaPermisos';
import TablaAsignacion from './ComponentsRoles/TablaAsignacion';
import { Tabs, Tab, Spinner } from "@heroui/react";
import { useGetRutas, useRoles } from '@/services/permisos.services';
import axios from '@/api/axios';
import { FaUserTag } from "react-icons/fa";

function Roles() {
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

  if (rutasError || rolesError) {
    return (
      <div className="w-full h-full p-6 flex items-center justify-center">
        <div className="p-4 text-center text-rose-500 bg-rose-50 rounded-xl">
          <p className="font-bold">Error al cargar los datos del módulo de roles</p>
          <p className="text-sm">{rutasError || rolesError}</p>
        </div>
      </div>
    );
  }

  if (isLoadingData || rutasLoading || rolesLoading) {
    return (
      <div className="w-full h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950">
        <Spinner size="lg" color="primary" />
        <p className="text-slate-500 mt-4 text-sm animate-pulse">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 flex flex-col gap-6 bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-200">

      {/* Premium Header - Transparent */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <FaUserTag size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
              Roles y Permisos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Administra los roles de usuario, configura permisos de acceso y define las pantallas de inicio.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col">
        <Tabs
          selectedKey={getCurrentTab}
          onSelectionChange={handleTabChange}
          radius="lg"
          variant="light"
          classNames={{
            tabList: "bg-slate-200/50 dark:bg-zinc-800/50 p-1 gap-1",
            cursor: "bg-white dark:bg-zinc-700 shadow-sm",
            tab: "h-9",
            tabContent: "group-data-[selected=true]:text-slate-900 dark:group-data-[selected=true]:text-white text-slate-500 dark:text-slate-400 font-semibold"
          }}
        >
          <Tab key="roles" title="Roles">
            <div className="mt-4">
              <TablaRoles
                externalData={allData.roles}
                skipApiCall={true}
              />
            </div>
          </Tab>
          <Tab key="permisos" title="Permisos">
            <div className="mt-4">
              {getCurrentTab === 'permisos' && (
                <TablaPermisos />
              )}
            </div>
          </Tab>
          <Tab key="paginas" title="Pantalla de inicio">
            <div className="mt-4">
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
            </div>
          </Tab>
        </Tabs>
      </div>

      {activeAdd && (
        <RolesForm modalTitle={'Nuevo Rol'} onClose={handleModalAdd} />
      )}
    </div>
  );
}

export default Roles;