import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { Toaster } from 'react-hot-toast';

// Contexts
import { CategoriaContextProvider } from '@/context/Categoria/CategoriaProvider';
import { SubcategoriaContextProvider } from '@/context/Subcategoria/SubcategoriaProvider';
import { MarcaContextProvider } from '@/context/Marca/MarcaProvider';

// Rutas protegidas por rol
import { RouteProtectedRol } from '../../routes';

// Componentes cargados dinámicamente
const Inicio = lazy(() => import('@/layouts/Inicio/Inicio'));
const Ventas = lazy(() => import('@/pages/Ventas/Venta/Ventas'));
const Registro_venta = lazy(() => import('@/pages/Ventas/Registro_Venta/Registro_venta'));
const LibroVentas = lazy(() => import('@/pages/Ventas/Reporte_Venta/Libro_Ventas'));
const Empleados = lazy(() => import('@/pages/Empleados/Empleados'));
const Productos = lazy(() => import('@/pages/Productos/Productos'));
const Marcas = lazy(() => import('@/pages/Marcas/Marcas'));
const Categorias = lazy(() => import('@/pages/Categorias/Categorias'));
const Subcategorias = lazy(() => import('@/pages/Subcategorias/Subcategorias'));
const Almacen = lazy(() => import('@/pages/Almacen/Almacén'));
const Historico = lazy(() => import('@/pages/Almacen/Kardex/Historico/Historico'));
const Nota_Ingreso = lazy(() => import('@/pages/Almacen/Nota_Ingreso/Nota_ingreso'));
const Nueva_Nota_Ingreso = lazy(() => import('@/pages/Almacen/Nota_Ingreso/Registro_Ingreso/Registro_ingreso'));
const Nota_Salida = lazy(() => import('@/pages/Almacen/Nota_Salida/Nota_salida'));
const Nueva_Nota_Salida = lazy(() => import('@/pages/Almacen/Nota_Salida/Nueva_Nota_Salida/Nueva_Nota_salida'));
const Guia_Remision = lazy(() => import('@/pages/Almacen/Guia_Remision/Guia_Remision'));
const RegistroGuia = lazy(() => import('@/pages/Almacen/Guia_Remision/Registro_Guia/Registro_Guia'));
const ReporteVentas = lazy(() => import('@/pages/ReporteVentas/ReporteVentas'));
const Usuarios = lazy(() => import('@/pages/Usuarios/Usuarios'));
const Historial = lazy(() => import('@/pages/Ventas/Historial_Venta/Historial'));
const Roles = lazy(() => import('@/pages/Roles/Roles'));
const Global = lazy(() => import('@/pages/Global/Global'));
const Sucursal = lazy(() => import('@/pages/Sucursal/Sucursal'));

function Dashboard() {
  const ADMIN_ROL = 1;
  const EMP_ROL = 3;
  const DESARROLLO_ROL = 10;
  

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
                <Suspense fallback={<div>Cargando...</div>}>
                  <Routes>
                    <Route path="/inicio" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
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
                    <Route path="/ventas/libro_ventas" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <LibroVentas />
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
                    <Route path="/sucursal" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Sucursal />
                      </RouteProtectedRol>
                    } />
                    <Route path="/configuracion/usuarios" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Usuarios />
                      </RouteProtectedRol>
                    } />
                    <Route path="/configuracion/roles" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Roles />
                      </RouteProtectedRol>
                    } />
                    <Route path="/configuracion/historial" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL, EMP_ROL]}>
                        <Historial />
                      </RouteProtectedRol>
                    } />
                      <Route path="/desarrollador" element={
                      <RouteProtectedRol allowedRoles={[DESARROLLO_ROL]}>
                        <Global />
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
