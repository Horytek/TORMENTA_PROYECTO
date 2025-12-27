import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { Toaster } from 'react-hot-toast';

// Services
import { getModulosConSubmodulos } from '@/services/rutas.services';

import { moduleComponentMap, submoduleComponentMap } from '@/utils/componentMapping';
import DeepSeekOpenRouterChatbot from "@/components/Chatbot/DeepSeekChatbot";
// Contexts
import { CategoriaContextProvider } from '@/context/Categoria/CategoriaProvider';
import { SubcategoriaContextProvider } from '@/context/Subcategoria/SubcategoriaProvider';
import { MarcaContextProvider } from '@/context/Marca/MarcaProvider';

import { RouteProtectedRol, RoutePermission } from '../../routes';

const Global = lazy(() => import('@/pages/Global/Global'));
const Sunat = lazy(() => import('@/pages/Sunat/Sunat'));
const Modulo = lazy(() => import('@/pages/Modulos/Modulos'));
const Permisos = lazy(() => import('@/pages/Roles/Roles'));
const PermisosGlobales = lazy(() => import('@/pages/Global/PermisosGlobales/TablaPermisosGlobales'));
const Historico = lazy(() => import('@/pages/Kardex/Historico/Historico'));
const Logs = lazy(() => import('@/pages/SystemLogs/Logs'));
const Negocio = lazy(() => import('@/pages/Negocio/Negocio'));

function Dashboard() {
  const ADMIN_ROL = 1;
  const EMP_ROL = 3;
  const DESARROLLO_ROL = 10;

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const modulesData = await getModulosConSubmodulos();

        if (Array.isArray(modulesData)) {
          // Override routes for Nota Almacen refactoring (Submodules)
          const processedRoutes = modulesData.map(m => {
            if (m.submodulos && m.submodulos.length > 0) {
              const newSubmodulos = m.submodulos.map(sub => {
                if (sub.id_submodulo === 10 || sub.id_submodulo === 11) {
                  return { ...sub, ruta: '/nota_almacen' };
                }
                return sub;
              });
              return { ...m, submodulos: newSubmodulos };
            }
            return m;
          });
          setRoutes(processedRoutes);
        } else {
          setRoutes([]);
        }
      } catch (error) {
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const renderDynamicRoutes = () => {
    if (loading) {
      return [<Route key="loading" path="*" element={<div>Cargando rutas...</div>} />];
    }

    const dynamicRoutes = [];

    // Add module routes
    if (routes && routes.length) {
      routes.forEach(module => {
        if (!module) return;

        // Try to find component by route first, then by ID (Hybrid approach)
        const Component = moduleComponentMap[module.ruta] || moduleComponentMap[module.id];

        if (Component && module.ruta) {
          // Normaliza la ruta
          const normalizedPath = module.ruta.startsWith('/') ? module.ruta : `/${module.ruta}`;

          // Si es el módulo de productos (ID 2), agregar wildcard para subrutas
          const routePath = module.id === 2 ? `${normalizedPath}/*` : normalizedPath;

          dynamicRoutes.push(
            <Route
              key={`module-${module.id}`}
              path={routePath}
              element={
                <RoutePermission idModulo={module.id}>
                  <Component />
                </RoutePermission>
              }
            />
          );
        }

        if (module.submodulos && module.submodulos.length > 0) {
          module.submodulos.forEach(submodule => {
            if (!submodule) return;

            // Try to find component by route first, then by ID (Hybrid approach)
            const SubComponent = submoduleComponentMap[submodule.ruta] || submoduleComponentMap[submodule.id_submodulo];

            if (SubComponent && submodule.ruta) {
              const normalizedSubPath = submodule.ruta.startsWith('/') ? submodule.ruta : `/${submodule.ruta}`;

              dynamicRoutes.push(
                <Route
                  key={`submodule-${submodule.id_submodulo}`}
                  path={normalizedSubPath}
                  element={
                    <RoutePermission idModulo={module.id} idSubmodulo={submodule.id_submodulo}>
                      <SubComponent />
                    </RoutePermission>
                  }
                />
              );
            }
          });
        }
      });
    }

    dynamicRoutes.push(
      <Route
        key="desarrollador"
        path="/desarrollador"
        element={
          <RouteProtectedRol allowedRoles={[DESARROLLO_ROL]}>
            <Global />
          </RouteProtectedRol>
        }
      />
    );

    dynamicRoutes.push(
      <Route
        key="sunat"
        path="/sunat"
        element={
          <RouteProtectedRol allowedRoles={[DESARROLLO_ROL]}>
            <Sunat />
          </RouteProtectedRol>
        }
      />
    );

    dynamicRoutes.push(
      <Route
        key="modulos"
        path="/modulos"
        element={
          <RouteProtectedRol allowedRoles={[DESARROLLO_ROL]}>
            <Modulo />
          </RouteProtectedRol>
        }
      />
    );

    dynamicRoutes.push(
      <Route
        key="permisos"
        path="/configuracion/roles"
        element={
          <RouteProtectedRol allowedRoles={[ADMIN_ROL, DESARROLLO_ROL]}>
            <Permisos />
          </RouteProtectedRol>
        }
      />
    );

    dynamicRoutes.push(
      <Route
        key="roles-permisos"
        path="/configuracion/roles/permisos"
        element={
          <RouteProtectedRol allowedRoles={[ADMIN_ROL, DESARROLLO_ROL]}>
            <Permisos />
          </RouteProtectedRol>
        }
      />
    );
    dynamicRoutes.push(
      <Route
        key="roles-paginas"
        path="/configuracion/roles/paginas"
        element={
          <RouteProtectedRol allowedRoles={[ADMIN_ROL, DESARROLLO_ROL]}>
            <Permisos />
          </RouteProtectedRol>
        }
      />
    );


    dynamicRoutes.push(
      <Route
        key="permisos-globales"
        path="/desarrollador/permisos-globales"
        element={
          <RouteProtectedRol allowedRoles={[DESARROLLO_ROL]}>
            <PermisosGlobales />
          </RouteProtectedRol>
        }
      />
    );

    dynamicRoutes.push(
      <Route
        key="logs"
        path="/configuracion/logs"
        element={
          <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
            <Logs />
          </RouteProtectedRol>
        }
      />
    );

    dynamicRoutes.push(
      <Route
        key="negocio"
        path="/configuracion/negocio"
        element={
          <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
            <Negocio />
          </RouteProtectedRol>
        }
      />
    );



    dynamicRoutes.push(
      <Route
        key="historico-with-id"
        path="/almacen/kardex/historico/:id"
        element={
          <RoutePermission idModulo={10} idSubmodulo={16}>
            <Suspense fallback={<div>Cargando...</div>}>
              <Historico />
            </Suspense>
          </RoutePermission>
        }
      />
    );

    // Añade una ruta de inicio por defecto
    dynamicRoutes.push(
      <Route
        key="default"
        path="/"
        element={<Navigate to="/inicio" replace />}
      />
    );

    // Agrega una ruta 404
    dynamicRoutes.push(
      <Route
        key="not-found"
        path="*"
        element={<div className="p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">Página no encontrada</h2>
          <p>La ruta que buscas no existe.</p>
        </div>}
      />
    );

    return dynamicRoutes;
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <Toaster position="top-center" reverseOrder={true} />
      <div className="flex flex-col transition-all duration-300">
        <Navbar routes={routes} />
        <div className="p-4 contenido-cambiante">
          <SubcategoriaContextProvider>
            <CategoriaContextProvider>
              <MarcaContextProvider>
                <Suspense fallback={<div>Cargando componentes...</div>}>
                  <Routes>
                    {renderDynamicRoutes()}
                  </Routes>
                </Suspense>
              </MarcaContextProvider>
            </CategoriaContextProvider>
          </SubcategoriaContextProvider>
        </div>

        {/* Widget global del chatbot (siempre visible sobre el contenido) */}

        <DeepSeekOpenRouterChatbot routes={routes} />
      </div>
    </div>
  );
}

export default Dashboard;