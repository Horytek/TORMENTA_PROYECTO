import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';


// Services
import { getModulosConSubmodulos } from '@/services/rutas.services';
import { ScrollShadow, Spinner } from "@heroui/react";

import { moduleComponentMap, submoduleComponentMap, COMPONENT_REGISTRY } from "@/utils/componentRegistry";
import DeepSeekOpenRouterChatbot from "@/components/Chatbot/DeepSeekChatbot";
// Contexts
import { CategoriaContextProvider } from '@/context/Categoria/CategoriaProvider';
import { SubcategoriaContextProvider } from '@/context/Subcategoria/SubcategoriaProvider';
import { MarcaContextProvider } from '@/context/Marca/MarcaProvider';

import { RouteProtectedRol, RoutePermission } from '../../routes';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const Global = lazy(() => import('@/pages/Global/Global'));
const Sunat = lazy(() => import('@/pages/Sunat/Sunat'));
const Modulo = lazy(() => import('@/pages/Modulos/Modulos'));
const Permisos = lazy(() => import('@/pages/Roles/Roles'));
const PermisosGlobales = lazy(() => import('@/pages/Global/PermisosGlobales/TablaPermisosGlobales'));
const Historico = lazy(() => import('@/pages/Kardex/Historico/Historico'));
const Logs = lazy(() => import('@/pages/SystemLogs/Logs'));
const Negocio = lazy(() => import('@/pages/Negocio/Negocio'));
const DatabaseCleaner = lazy(() => import('@/pages/Developer/DatabaseCleaner'));
const ActionCatalog = lazy(() => import('@/pages/Developer/ActionCatalog'));
const AttributesPage = lazy(() => import('@/pages/Configuracion/Attributes/AttributesPage'));

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
                const subName = sub.nombre_submodulo ? sub.nombre_submodulo.toLowerCase() : '';
                // Check ID 10/11 OR Name match for robustness
                if (sub.id_submodulo === 10 || sub.id_submodulo === 11 || (subName.includes('nota') && subName.includes('almacen'))) {
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
      return [
        <Route
          key="loading"
          path="*"
          element={
            <div className="flex flex-col items-center justify-center w-full h-[70vh]">
              <div className="flex flex-col items-center justify-center gap-4">
                <Spinner size="lg" color="primary" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                  Cargando rutas...
                </p>
              </div>
            </div>
          }
        />
      ];
    }

    const dynamicRoutes = [];

    // Add module routes
    if (routes && routes.length) {
      routes.forEach(module => {
        if (!module) return;

        // Hybrid Approach:
        // 1. Try Registry (Scalable, Route-based)
        // 2. Try ID Map (Legacy, Fallback)
        let Component = COMPONENT_REGISTRY[module.ruta];

        if (!Component && module.id) {
          Component = moduleComponentMap[module.id];
          if (Component && process.env.NODE_ENV === 'development') {
            console.warn(`Module used Legacy ID fallback: ${module.nombre_modulo} (ID: ${module.id}). Add '${module.ruta}' to COMPONENT_REGISTRY.`);
          }
        }

        if (Component && module.ruta) {
          // Normaliza la ruta
          const normalizedPath = module.ruta.startsWith('/') ? module.ruta : `/${module.ruta}`;

          // Si es el módulo de productos (ID 2), agregar wildcard para subrutas
          // Note: Ideally, specific logic like ID 2 check should be moved to metadata too, but keeping for now.
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

            // Hybrid Approach for Submodules
            let SubComponent = COMPONENT_REGISTRY[submodule.ruta];

            if (!SubComponent && submodule.id_submodulo) {
              SubComponent = submoduleComponentMap[submodule.id_submodulo];
            }

            if (SubComponent && submodule.ruta) {
              const normalizedSubPath = submodule.ruta.startsWith('/') ? submodule.ruta : `/${submodule.ruta}`;

              const isWrapper = normalizedSubPath.includes('variantes');
              const routePath = isWrapper ? `${normalizedSubPath}/*` : normalizedSubPath;

              dynamicRoutes.push(
                <Route
                  key={`submodule-${submodule.id_submodulo}`}
                  path={routePath}
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
        key="database-cleaner"
        path="/desarrollador/database-cleaner"
        element={
          <RouteProtectedRol allowedRoles={[DESARROLLO_ROL]}>
            <DatabaseCleaner />
          </RouteProtectedRol>
        }
      />
    );

    dynamicRoutes.push(
      <Route
        key="action-catalog"
        path="/desarrollador/actions"
        element={
          <RouteProtectedRol allowedRoles={[DESARROLLO_ROL]}>
            <ActionCatalog />
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
    <div className="h-full w-full bg-transparent">
      <ScrollShadow className="h-full w-full" hideScrollBar>
        <div className="flex flex-col min-h-screen transition-all duration-300">
          <Navbar routes={routes} />
          <div className="w-full px-0 sm:px-4 contenido-cambiante flex-1">
            <SubcategoriaContextProvider>
              <CategoriaContextProvider>
                <MarcaContextProvider>
                  <Suspense
                    fallback={
                      <div className="flex flex-col items-center justify-center w-full h-[70vh]">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <Spinner size="lg" color="primary" />
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                            Cargando componentes...
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <Routes>
                      {renderDynamicRoutes()}
                    </Routes>
                  </Suspense>
                </MarcaContextProvider>
              </CategoriaContextProvider>
            </SubcategoriaContextProvider>
          </div>

        </div>
      </ScrollShadow>

      {/* Widget global del chatbot (siempre visible sobre el contenido) */}
      <ChatbotWrapper routes={routes} />
    </div>
  );
}

// Wrapper to handle hook conditional internally without re-rendering huge Dashboard on every hook change
function ChatbotWrapper({ routes }) {
  const { allowed } = useFeatureAccess('CHATBOT');
  if (!allowed) return null;
  return <DeepSeekOpenRouterChatbot routes={routes} />;
}

export default Dashboard;