import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import Inicio from '@/layouts/Inicio/Inicio';
import Ventas from '@/pages/Ventas/Venta/Ventas';
import Empleados from '@/pages/Empleados/Empleados';
import Productos from '@/pages/Productos/Productos';
import Categorias from '@/pages/Categorias/Categorias';
import Subcategorias from '@/pages/Subcategorias/Subcategorias';
import Almacen from '@/pages/Almacen/Almacén';
import Nota_Ingreso from '@/pages/Almacen/Nota_Ingreso/Nota_ingreso';
import Nueva_Nota_Ingreso from '@/pages/Almacen/Nota_Ingreso/Registro_Ingreso/Registro_ingreso';
import Nota_Salida from '@/pages/Almacen/Nota_Salida/Nota_salida';
import Nueva_Nota_Salida from '@/pages/Almacen/Nota_Salida/Nueva_Nota_Salida/Nueva_Nota_salida';
import Usuarios from '@/pages/Usuarios/Usuarios';
import Registro_venta from '@/pages/Ventas/Registro_Venta/Registro_venta';
import Guia_Remision from '@/pages/Almacen/Guia_Remision/Guia_Remision';
import RegistroGuia from '@/pages/Almacen/Guia_Remision/Registro_Guia/Registro_Guia';
import Historico from '@/pages/Almacen/Kardex/Historico/Historico';
import Marcas from '@/pages/Marcas/Marcas';
import ReporteVentas from '@/pages/ReporteVentas/ReporteVentas';
import { Toaster } from "react-hot-toast";

// Contexts
import { CategoriaContextProvider } from "@/context/Categoria/CategoriaProvider";
import { SubcategoriaContextProvider } from "@/context/Subcategoria/SubcategoriaProvider";
import { MarcaContextProvider } from "@/context/Marca/MarcaProvider";

// Rutas protegidas por rol
import {RouteProtectedRol} from '../../routes';

function Dashboard() {

  const ADMIN_ROL = 1;
  const EMP_ROL = 3;

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-center" reverseOrder={true} />
      {/* Componente Sidebar que contiene el menú de navegación */}
      <Sidebar />
      <div className="flex flex-col flex-1 ml-5">
        {/* Componente Navbar que contiene la barra de navegación superior */}
        <Navbar />
        {/* Contenedor para los componentes de las páginas que cambiarán */}
        <div className="p-4 contenido-cambiante">
          {/* Configuración de rutas para diferentes páginas dentro del dashboard */}
          <SubcategoriaContextProvider>
            <CategoriaContextProvider>
              <MarcaContextProvider>
                <Routes>
                  {/* Rutas accesibles para todos los roles */}
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
              </MarcaContextProvider>
            </CategoriaContextProvider>
          </SubcategoriaContextProvider>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;