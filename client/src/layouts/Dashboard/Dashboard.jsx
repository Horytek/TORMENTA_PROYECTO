import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import { Toaster } from 'react-hot-toast';

// Contexts
import { CategoriaContextProvider } from '@/context/Categoria/CategoriaProvider';
import { SubcategoriaContextProvider } from '@/context/Subcategoria/SubcategoriaProvider';
import { MarcaContextProvider } from '@/context/Marca/MarcaProvider';

import { RouteProtectedRol, RoutePermission } from '../../routes';

const Inicio = lazy(() => import('@/layouts/Inicio/Inicio'));
const Ventas = lazy(() => import('@/pages/Ventas/Venta/Ventas'));
const Registro_venta = lazy(() => import('@/pages/Ventas/Registro_Venta/Registro_venta'));
const LibroVentas = lazy(() => import('@/pages/Ventas/Reporte_Venta/Libro_Ventas'));
const Empleados = lazy(() => import('@/pages/Empleados/Empleados'));
const Proveedores = lazy(() => import('@/pages/Proveedores/Proveedores'));
const Productos = lazy(() => import('@/pages/Productos/Productos'));
const Almacenes = lazy(() => import('@/pages/AlmacenG/AlmacenG'));
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
const Clientes = lazy(() => import('@/pages/Clientes/Clientes'));
const Permisos = lazy(() => import('@/pages/Roles/Permisos'));
const Modulos = lazy(() => import('@/pages/Modulos/Modulos'));

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
                    {/* INICIO - Módulo 1 */}
                    <Route path="/inicio" element={
                      <RoutePermission idModulo={1}>
                        <Inicio />
                      </RoutePermission>
                    } />
                    
                    {/* VENTAS - Módulo 6 */}
                    <Route path="/ventas" element={
                      <RoutePermission idModulo={6}>
                        <Ventas />
                      </RoutePermission>
                    } />
                    <Route path="/ventas/registro_venta" element={
                      <RoutePermission idModulo={6} idSubmodulo={4}>
                        <Registro_venta />
                      </RoutePermission>
                    } />
                    <Route path="/ventas/libro_ventas" element={
                      <RoutePermission idModulo={6} idSubmodulo={5}>
                        <LibroVentas />
                      </RoutePermission>
                    } />
                    
                    {/* EMPLEADOS - Módulo 5 */}
                    <Route path="/empleados" element={
                      <RoutePermission idModulo={5}>
                        <Empleados />
                      </RoutePermission>
                    } />
                    <Route path="/proveedores" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL]}>
                        <Proveedores />
                      </RouteProtectedRol>
                    } />
                    
                    {/* PRODUCTOS - Módulo 2 */}
                    <Route path="/productos" element={
                      <RoutePermission idModulo={2}>
                        <Productos />
                      </RoutePermission>
                    } />
                    <Route path="/productos/marcas" element={
                      <RoutePermission idModulo={2} idSubmodulo={1}>
                        <Marcas />
                      </RoutePermission>
                    } />
                    <Route path="/productos/categorias" element={
                      <RoutePermission idModulo={2} idSubmodulo={2}>
                        <Categorias />
                      </RoutePermission>
                    } />
                    <Route path="/productos/subcategorias" element={
                      <RoutePermission idModulo={2} idSubmodulo={3}>
                        <Subcategorias />
                      </RoutePermission>
                    } />
                    
                    {/* ALMACENES - Módulo 3 */}
                    <Route path="/almacenG" element={
                      <RoutePermission idModulo={3}>
                        <Almacenes />
                      </RoutePermission>
                    } />
                    
                    {/* ALMACEN/KARDEX - Módulo 10 */}
                    <Route path="/almacen" element={
                      <RoutePermission idModulo={10}>
                        <Almacen />
                      </RoutePermission>
                    } />
                    <Route path="/almacen/kardex/historico/:id" element={
                      <RoutePermission idModulo={10} idSubmodulo={16}>
                        <Historico />
                      </RoutePermission>
                    } />
                    <Route path="/almacen/nota_ingreso" element={
                      <RoutePermission idModulo={10} idSubmodulo={10}>
                        <Nota_Ingreso />
                      </RoutePermission>
                    } />
                    <Route path="/almacen/nota_ingreso/registro_ingreso" element={
                      <RoutePermission idModulo={10} idSubmodulo={15}>
                        <Nueva_Nota_Ingreso />
                      </RoutePermission>
                    } />
                    <Route path="/almacen/nota_salida" element={
                      <RoutePermission idModulo={10} idSubmodulo={11}>
                        <Nota_Salida />
                      </RoutePermission>
                    } />
                    <Route path="/almacen/nota_salida/nueva_nota_salida" element={
                      <RoutePermission idModulo={10} idSubmodulo={12}>
                        <Nueva_Nota_Salida />
                      </RoutePermission>
                    } />
                    <Route path="/almacen/guia_remision" element={
                      <RoutePermission idModulo={10} idSubmodulo={13}>
                        <Guia_Remision />
                      </RoutePermission>
                    } />
                    <Route path="/almacen/guia_remision/registro_guia" element={
                      <RoutePermission idModulo={10} idSubmodulo={14}>
                        <RegistroGuia />
                      </RoutePermission>
                    } />
                    
                    {/* REPORTES - Módulo 7 */}
                    <Route path="/reportes" element={
                      <RoutePermission idModulo={7}>
                        <ReporteVentas />
                      </RoutePermission>
                    } />
                    
                    {/* SUCURSALES - Módulo 8 */}
                    <Route path="/sucursal" element={
                      <RoutePermission idModulo={8}>
                        <Sucursal />
                      </RoutePermission>
                    } />
                    
                    {/* CONFIGURACIÓN - Módulo 9 */}
                    <Route path="/configuracion/usuarios" element={
                      <RoutePermission idModulo={9} idSubmodulo={6}>
                        <Usuarios />
                      </RoutePermission>
                    } />
                    <Route path="/configuracion/roles" element={
                      <RoutePermission idModulo={9} idSubmodulo={7}>
                        <Roles />
                      </RoutePermission>
                    } />
                    <Route path="/configuracion/permisos" element={
                      <RouteProtectedRol allowedRoles={[ADMIN_ROL, DESARROLLO_ROL]}>
                        <Permisos />
                      </RouteProtectedRol>
                    } />
                    <Route path="/configuracion/modulos" element={
                      <RoutePermission idModulo={9} idSubmodulo={8}>
                        <Modulos />
                      </RoutePermission>
                    } />
                    <Route path="/configuracion/historial" element={
                      <RoutePermission idModulo={9} idSubmodulo={9}>
                        <Historial />
                      </RoutePermission>
                    } />
                    
                    {/* aqui se mantiene como antes */}
                    <Route path="/desarrollador" element={
                      <RouteProtectedRol allowedRoles={[DESARROLLO_ROL]}>
                        <Global />
                      </RouteProtectedRol>
                    } />
                    
                    {/* CLIENTES - Módulo 4 */}
                    <Route path="/clientes" element={
                      <RoutePermission idModulo={4}>
                        <Clientes />
                      </RoutePermission>
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
