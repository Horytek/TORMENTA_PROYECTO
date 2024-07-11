import { useState } from 'react';
import { FaHome, FaBox, FaUsers, FaChartLine, FaWarehouse, FaCog, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './sidebar.css';
import img from '@/assets/icono.ico';

function Sidebar() {
  // Estado para controlar si el sidebar está colapsado o no
  const [collapsed, setCollapsed] = useState(false);

  // Función para alternar entre colapsado y expandido
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`sidebar bg-blue-700 text-white flex flex-col relative ${collapsed ? 'w-16' : 'w-60'} transition-all duration-300`}>
      {/* Encabezado del sidebar */}
      <div className="flex justify-between items-center p-4">
        {/* Título del sidebar que se muestra solo cuando no está colapsado */}
        {!collapsed ? (
          <h2 className="text-2xl font-bold flex items-center">
            <img src={img} alt="Logo" className="h-8 w-8 mr-2" />
            TORMENTA
          </h2>
        ) : (
          <img src={img} alt="Logo" className="h-8 w-8 m-auto" />
        )}        {/* Botón de toggle para colapsar o expandir el sidebar */}
        <button onClick={toggleSidebar} className="toggle-button">
          {collapsed ? <FaArrowRight /> : <FaArrowLeft />}
        </button>
      </div>
      {/* Navegación del sidebar */}
      <nav className="mt-4 flex-1">
        <ul className="space-y-2">
          {/* Lista de enlaces dentro del sidebar */}
          {[
            { to: '/inicio', icon: <FaHome className="text-xl" />, text: 'Inicio' },
            { to: '/productos', icon: <FaBox className="text-xl" />, text: 'Productos' },
            { to: '/empleados', icon: <FaUsers className="text-xl" />, text: 'Empleados' },
            { to: '/ventas', icon: <FaChartLine className="text-xl" />, text: 'Ventas' },
            { to: '/almacen', icon: <FaWarehouse className="text-xl" />, text: 'Almacén' },
            { to: '/configuracion', icon: <FaCog className="text-xl" />, text: 'Configuración' },
          ].map(({ to, icon, text }) => (
            // Elementos de la lista de enlaces
            <li key={to} className={`flex items-center ${collapsed ? 'justify-center' : 'pl-4'} py-2 px-2 `}>
              <Link to={to} className="flex items-center">
                {icon} {/* Icono del enlace */}
                {/* Texto del enlace que se muestra solo cuando no está colapsado */}
                {!collapsed && <span className="ml-4">{text}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;