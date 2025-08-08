import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { Toaster } from 'react-hot-toast';

// Services
import { getModulosConSubmodulos } from '@/services/rutas.services';

import { moduleComponentMap, submoduleComponentMap } from '@/utils/componentMapping';

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
const Historico = lazy(() => import('@/pages/Almacen/Kardex/Historico/Historico'));

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
          setRoutes(modulesData);
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

        const Component = moduleComponentMap[module.id];
        if (Component && module.ruta) {
          // Normaliza la ruta
          const normalizedPath = module.ruta.startsWith('/') ? module.ruta : `/${module.ruta}`;

          dynamicRoutes.push(
            <Route
              key={`module-${module.id}`}
              path={normalizedPath}
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

            const SubComponent = submoduleComponentMap[submodule.id_submodulo];
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
      </div>
    </div>
  );
}

export default Dashboard;