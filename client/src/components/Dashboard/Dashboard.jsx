// src/components/Dashboard/Dashboard.jsx

import { Routes, Route } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import Inicio from '@/pages/Inicio/Inicio';
import Ventas from '@/pages/Ventas/Venta/Ventas';
import Empleados from '@/pages/Empleados';
import Productos from '@/pages/Productos';
import Almacen from '@/pages/Almacén';
import Configuracion from '@/pages/Configuración';
import Registro_venta from '@/pages/Ventas/Registro_Venta/Registro_venta';

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
            {/* Ruta para la página de almacén */}
            <Route path="/almacen" element={<Almacen />} />
            {/* Ruta para la página de configuración */}
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
