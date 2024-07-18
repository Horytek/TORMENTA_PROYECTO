// src/components/Dashboard/Dashboard.jsx

import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar from '../../components/Navbar/Navbar';
import Inicio from '@/pages/Inicio/Inicio';
import Ventas from '@/pages/Ventas/Venta/Ventas';
import Empleados from '@/pages/Empleados/Empleados';
import Productos from '@/pages/Productos/Productos';
import Marcas from '@/pages/Productos/Marcas/Marcas';
import Almacen from '@/pages/Almacen/Almacén';
import Nota_Ingreso from '@/pages/Almacen/Nota_Ingreso/Nota_ingreso';
import Nueva_Nota_Ingreso from '@/pages/Almacen/Nota_Ingreso/Registro_Ingreso/Registro_ingreso';
import Nota_Salida from '@/pages/Almacen/Nota_Salida/Nota_salida';
import Nueva_Nota_Salida from '@/pages/Almacen/Nota_Salida/Nueva_Nota_Salida/Nueva_Nota_salida';
import Configuracion from '@/pages/Configuración';
import Registro_venta from '@/pages/Ventas/Registro_Venta/Registro_venta';
import Guia_Remision from '@/pages/Almacen/Guia_Remision/Guia_Remision';
import RegistroGuia from '@/pages/Almacen/Guia_Remision/Registro_Guia/Registro_Guia';
import Historico from '@/pages/Almacen/Kardex/Historico/Historico';
import Kardex from '@/pages/Almacen/Kardex/Kardex';
function Dashboard() {
  return (
    <div className="flex min-h-screen">
      {/* Componente Sidebar que contiene el menú de navegación */}
      <Sidebar/>
      <div className="flex-1 flex flex-col ml-5">
        {/* Componente Navbar que contiene la barra de navegación superior */}
        <Navbar />
        {/* Contenedor para los componentes de las páginas que cambiarán */}
        <div className="p-4 contenido-cambiante">
          {/* Configuración de rutas para diferentes páginas dentro del dashboard */}
          <Routes>
            {/* Ruta para la página de inicio */}
            <Route path="/inicio" element={<Inicio />} />
            {/* Ruta para la página de ventas */}
            <Route path="/ventas" element={<Ventas />} />
            {/* Ruta para la página de configuración */}
            <Route path="/ventas/registro_venta" element={<Registro_venta />} />
            {/* Ruta para la página de empleados */}
            <Route path="/empleados" element={<Empleados />} />
            {/* Ruta para la página de productos */}
            <Route path="/productos" element={<Productos />} />
            {/* Ruta para la página de marcas */}	
            <Route path="/productos/marcas" element={<Marcas />} />
            {/* Ruta para la página de almacén */}
            <Route path="/almacen" element={<Almacen />} />
            {/* Ruta para la página de Historico */}
            <Route path="/almacen/kardex/historico/:id" element={<Historico />} />
            {/* Ruta para la página de Kardex */}
            <Route path="/almacen/kardex" element={<Kardex />} />
            {/* Ruta para la página de nota de ingreso */}
            <Route path="/almacen/nota_ingreso" element={<Nota_Ingreso />} />
            {/* Ruta para la página de nueva nota de ingreso */}
            <Route path="/almacen/nota_ingreso/registro_ingreso" element={<Nueva_Nota_Ingreso />} />
            {/* Ruta para la página de nota de salida */}
            <Route path="/almacen/nota_salida" element={<Nota_Salida />} />
            {/* Ruta para la página de nueva nota de salida */}
            <Route path="/almacen/nota_salida/nueva_nota_salida" element={<Nueva_Nota_Salida />} />
            {/* Ruta para la página de guia de remision */}
            <Route path="/almacen/guia_remision" element={<Guia_Remision />} />
            {/* Ruta para la página de guia de remision */}
            <Route path="/almacen/guia_remision/registro_guia" element={<RegistroGuia />} />
            {/* Ruta para la página de configuración */}
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
