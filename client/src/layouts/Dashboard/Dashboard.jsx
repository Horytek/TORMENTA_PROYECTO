import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { Toaster } from "react-hot-toast";
import { Suspense, lazy } from 'react';

// Contexts
import { CategoriaContextProvider } from "@/context/Categoria/CategoriaProvider";
import { SubcategoriaContextProvider } from "@/context/Subcategoria/SubcategoriaProvider";
import { MarcaContextProvider } from "@/context/Marca/MarcaProvider";

// Rutas protegidas por rol
import { RouteProtectedRol } from '../../routes';

// Importación perezosa (lazy) de componentes
const Inicio = lazy(() => import('@/layouts/Inicio/Inicio'));
const Ventas = lazy(() => import('@/pages/Ventas/Venta/Ventas'));
const Empleados = lazy(() => import('@/pages/Empleados/Empleados'));
const Productos = lazy(() => import('@/pages/Productos/Productos'));
const Categorias = lazy(() => import('@/pages/Categorias/Categorias'));
const Subcategorias = lazy(() => import('@/pages/Subcategorias/Subcategorias'));
const Almacen = lazy(() => import('@/pages/Almacen/Almacén'));
const Nota_Ingreso = lazy(() => import('@/pages/Almacen/Nota_Ingreso/Nota_ingreso'));
const Nueva_Nota_Ingreso = lazy(() => import('@/pages/Almacen/Nota_Ingreso/Registro_Ingreso/Registro_ingreso'));
const Nota_Salida = lazy(() => import('@/pages/Almacen/Nota_Salida/Nota_salida'));
const Nueva_Nota_Salida = lazy(() => import('@/pages/Almacen/Nota_Salida/Nueva_Nota_Salida/Nueva_Nota_salida'));
const Usuarios = lazy(() => import('@/pages/Usuarios/Usuarios'));
const Registro_venta = lazy(() => import('@/pages/Ventas/Registro_Venta/Registro_venta'));
const Guia_Remision = lazy(() => import('@/pages/Almacen/Guia_Remision/Guia_Remision'));
const RegistroGuia = lazy(() => import('@/pages/Almacen/Guia_Remision/Registro_Guia/Registro_Guia'));
const Historico = lazy(() => import('@/pages/Almacen/Kardex/Historico/Historico'));
const Marcas = lazy(() => import('@/pages/Marcas/Marcas'));
const ReporteVentas = lazy(() => import('@/pages/ReporteVentas/ReporteVentas'));

function Dashboard() {

  const ADMIN_ROL = 1;
  const EMP_ROL = 3;

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-center" reverseOrder={true} />
      <Sidebar />
      <div className="flex flex-col flex-1 ml-5">
        <Navbar />
        <div className="p-4 contenido-cambiante">
          <SubcategoriaContextProvider>
            <CategoriaContextProvider>
              <MarcaContextProvider>
                <Suspense fallback={
                  <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
                  <span className="sr-only">Loading...</span>
                  </div>
                }>
                  <Routes>
                    <Route path="/inicio" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL, EMP_ROL]}>
                        <Inicio />
                      </RouteProtectedRol>
                    } />
                    <Route path="/ventas" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Ventas />
                      </RouteProtectedRol>
                    } />
                    <Route path="/ventas/registro_venta" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL, EMP_ROL]}>
                        <Registro_venta />
                      </RouteProtectedRol>
                    } />
                    <Route path="/empleados" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Empleados />
                      </RouteProtectedRol>
                    } />
                    <Route path="/productos" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Productos />
                      </RouteProtectedRol>
                    } />
                    <Route path="/productos/marcas" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Marcas />
                      </RouteProtectedRol>
                    } />
                    <Route path="/productos/categorias" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Categorias />
                      </RouteProtectedRol>
                    } />
                    <Route path="/productos/subcategorias" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Subcategorias />
                      </RouteProtectedRol>
                    } />
                    <Route path="/almacen" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Almacen />
                      </RouteProtectedRol>
                    } />
                    <Route path="/almacen/kardex/historico/:id" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Historico />
                      </RouteProtectedRol>
                    } />
                    <Route path="/almacen/nota_ingreso" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Nota_Ingreso />
                      </RouteProtectedRol>
                    } />
                    <Route path="/almacen/nota_ingreso/registro_ingreso" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Nueva_Nota_Ingreso />
                      </RouteProtectedRol>
                    } />
                    <Route path="/almacen/nota_salida" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Nota_Salida />
                      </RouteProtectedRol>
                    } />
                    <Route path="/almacen/nota_salida/nueva_nota_salida" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Nueva_Nota_Salida />
                      </RouteProtectedRol>
                    } />
                    <Route path="/almacen/guia_remision" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Guia_Remision />
                      </RouteProtectedRol>
                    } />
                    <Route path="/almacen/guia_remision/registro_guia" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <RegistroGuia />
                      </RouteProtectedRol>
                    } />
                    <Route path="/reportes" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <ReporteVentas />
                      </RouteProtectedRol>
                    } />
                    <Route path="/configuracion/usuarios" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Usuarios />
                      </RouteProtectedRol>
                    } />
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