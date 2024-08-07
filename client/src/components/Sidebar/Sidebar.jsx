import { useState } from 'react';
import { FaHome, FaBox, FaUsers, FaChartLine, FaWarehouse, FaCog, FaArrowRight, FaArrowLeft, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import {BiSolidReport} from 'react-icons/bi';
import { Link } from 'react-router-dom';
import './sidebar.css';
import img from '@/assets/icono.ico';

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState({});

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleLink = (link) => {
    setExpandedLinks((prevState) => ({
      ...prevState,
      [link]: !prevState[link],
    }));
  };

  return (
    <div className={`sidebar bg-blue-700 text-white flex flex-col relative ${collapsed ? 'w-16' : 'w-60'} transition-all duration-300`}>
      <div className="flex justify-between items-center p-4">
        {!collapsed ? (
          <h2 className="font-bold flex items-center text-base md:text-md lg:text-md xl:text-2xl">
            <img src={img} alt="Logo" className="h-8 w-8 mr-2" />
            TORMENTA
          </h2>


        ) : (
          <img src={img} alt="Logo" className="h-8 w-8 m-auto" />
        )}
        <button onClick={toggleSidebar} className="toggle-button">
          {collapsed ? <FaArrowRight /> : <FaArrowLeft />}
        </button>
      </div>
      <nav className="mt-4 flex-1">
        <ul className="space-y-2">
          {[
            { to: '/inicio', icon: <FaHome className="text-xl" />, text: 'Inicio' },
            { to: '/productos', icon: <FaChartLine className="text-xl" />, text: 'Productos' , subLinks: [
              { to: '/productos/marcas', text: 'Marcas' },
              { to: '/productos/categorias', text: 'Categorias'},
              { to: '/productos/subcategorias', text: 'Subcategorias'},

            ]},
            
            { to: '/empleados', icon: <FaUsers className="text-xl" />, text: 'Empleados' },
            {
              to: '/ventas', icon: <FaChartLine className="text-xl" />, text: 'Ventas', subLinks: [
                { to: '/ventas/registro_venta', text: 'Nueva Venta' },
              ]
            },
            { to: '/almacen', icon: <FaWarehouse className="text-xl" />, text: 'Almacén', subLinks: [
              { to: '/almacen/nota_ingreso', text: 'Nota de ingreso' },
              { to: '/almacen/guia_remision', text: 'Guia de remisión' },
              { to: '/almacen/nota_salida', text: 'Nota de salida' }
            ]

            },
            { to: '/reportes', icon: <BiSolidReport className="text-xl" />, text: 'Reportes'
              
            },
            { to: '/configuracion', icon: <FaCog className="text-xl" />, text: 'Configuración' },
          ].map(({ to, icon, text, subLinks }) => (
            <div key={to}>
              <li className={`flex items-center ${collapsed ? 'justify-center' : 'pl-4'} py-2 px-2 w-full`}>
                <Link to={to} className={`flex items-center ${collapsed ? 'justify-center' : 'w-full'}`}>
                  {icon}
                  {!collapsed && <span className="ml-4">{text}</span>}
                </Link>
                {!collapsed && subLinks && (
                  <button onClick={() => toggleLink(to)} className="ml-auto">
                    {expandedLinks[to] ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                )}
              </li>


              {!collapsed && expandedLinks[to] && subLinks && (
                <ul className="ml-10 mt-2 space-y-2">
                  {subLinks.map((subLink) => (
                    <li key={subLink.to}>
                      <Link to={subLink.to} className="flex items-center pl-4 py-2 px-2 w-full ">
                        <span>{subLink.text}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
