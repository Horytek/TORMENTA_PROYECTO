import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  FaHome, FaUsers, FaChartLine, FaWarehouse, FaCog,
  FaArrowRight, FaArrowLeft, FaChevronDown, FaChevronUp,
  FaBuilding, FaUserFriends, FaTags
} from 'react-icons/fa';
import { BiSolidReport } from 'react-icons/bi';
import img from '@/assets/icono.ico';

function Sidebar({ onToggle }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedLinks, setExpandedLinks] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  // Close expanded links when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      setExpandedLinks({});
    }
  }, [collapsed]);

  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    // Notify parent component of the change
    if (onToggle) onToggle(newCollapsedState);
  };

  const toggleSubmenu = (link, e) => {
    e.stopPropagation(); // Evita la propagación del evento
    setExpandedLinks((prevState) => ({
      ...prevState,
      [link]: !prevState[link],
    }));
  };

  // Función para navegar a la ruta al hacer clic en el enlace principal
  const handleItemClick = (to, hasSubLinks, e) => {
    // Si hay sublinks y estamos en modo móvil/colapsado, expandimos en vez de navegar
    if (collapsed && hasSubLinks) {
      e.preventDefault();
      setCollapsed(false);
      setTimeout(() => {
        setExpandedLinks((prev) => ({ ...prev, [to]: true }));
      }, 300);
      return;
    }

    // De lo contrario, navegamos a la ruta
    navigate(to);
  };

  // Check if route is active
  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { to: '/inicio', icon: <FaHome className="text-xl" />, text: 'Inicio' },
    {
      to: '/productos',
      icon: <FaTags className="text-xl" />,
      text: 'Productos',
      subLinks: [
        { to: '/productos/marcas', text: 'Marcas' },
        { to: '/productos/categorias', text: 'Categorias' },
        { to: '/productos/subcategorias', text: 'Subcategorias' },
      ]
    },
    { to: '/almacenG', icon: <FaWarehouse className="text-xl" />, text: 'Almacenes' },
    { to: '/clientes', icon: <FaUserFriends className="text-xl" />, text: 'Clientes' },
    { to: '/empleados', icon: <FaUsers className="text-xl" />, text: 'Empleados' },
    { to: '/proveedores', icon: <FaUsers className="text-xl" />, text: 'Proveedores' },
    {
      to: '/ventas',
      icon: <FaChartLine className="text-xl" />,
      text: 'Ventas',
      subLinks: [
        { to: '/ventas/registro_venta', text: 'Nueva Venta' },
        { to: 'ventas/libro_ventas', text: 'Libro de Ventas' },
      ]
    },
    {
      to: '/almacen',
      icon: <FaWarehouse className="text-xl" />,
      text: 'Kardex',
      subLinks: [
        { to: '/almacen/nota_ingreso', text: 'Nota de ingreso' },
        { to: '/almacen/guia_remision', text: 'Guia de remisión' },
        { to: '/almacen/nota_salida', text: 'Nota de salida' }
      ]
    },
    { to: '/reportes', icon: <BiSolidReport className="text-xl" />, text: 'Reportes' },
    { to: '/sunat', icon: <BiSolidReport className="text-xl" />, text: 'Sunat' },
    { to: '/sucursal', icon: <FaBuilding className="text-xl" />, text: 'Sucursal' },
    {
      to: '/configuracion',
      icon: <FaCog className="text-xl" />,
      text: 'Configuración',
      subLinks: [
        { to: '/configuracion/usuarios', text: 'Usuarios' },
        { to: '/configuracion/roles', text: 'Roles y permisos' },
        { to: '/configuracion/modulos', text: 'Modulos' },
        { to: '/configuracion/historial', text: 'Historial' },
      ]
    },
    { to: '/desarrollador', icon: <FaCog className="text-xl" />, text: 'Desarrollador' },
  ];

  return (
    <div
      className={`h-screen bg-gradient-to-b from-blue-800 to-blue-700 text-white flex flex-col 
        fixed left-0 top-0 bottom-0 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 shadow-lg z-30`}
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b border-blue-600 relative">
        {!collapsed ? (
          <div className="flex items-center">
            <img src={img} alt="Logo" className="w-8 h-8 mr-2" />
            <h2 className="font-bold text-lg">TORMENTA</h2>
          </div>
        ) : (
          <img src={img} alt="Logo" className="w-8 h-8 mx-auto" />
        )}

        <button
          onClick={toggleSidebar}
          className="absolute -right-4 top-5 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-500 
            border-2 border-white transition-all duration-200 transform hover:scale-110 z-40"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FaArrowRight size={16} /> : <FaArrowLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav
        className="flex-1 overflow-y-auto py-4 no-scrollbar"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <style jsx>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => (
            <div key={item.to || item.text} className="relative">
              <li className="list-none">
                <div
                  className={`flex items-center rounded-md py-2.5 px-3 transition-colors cursor-pointer
                    ${isActive(item.to)
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-blue-600/50'
                    }
                    ${collapsed ? 'justify-center' : 'justify-between'}`}
                >
                  {/* Texto e icono principal - Navegación */}
                  <div
                    className="flex items-center flex-grow"
                    onClick={(e) => handleItemClick(item.to || '#', !!item.subLinks, e)}
                  >
                    <span className={`${collapsed ? '' : 'mr-3'}`}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.text}</span>}
                  </div>

                  {/* Ícono de flecha - Solo expande/colapsa */}
                  {!collapsed && item.subLinks && (
                    <button
                      onClick={(e) => toggleSubmenu(item.to || item.text, e)}
                      className="ml-2 p-1 hover:bg-blue-500 rounded-full transition-colors focus:outline-none"
                      aria-label={expandedLinks[item.to || item.text] ? "Collapse submenu" : "Expand submenu"}
                    >
                      {expandedLinks[item.to || item.text] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  )}
                </div>
              </li>

              {/* Submenu */}
              {!collapsed && expandedLinks[item.to || item.text] && item.subLinks && (
                <ul className="mt-1 ml-7 space-y-1 border-l-2 border-blue-600 pl-2 z-20">
                  {item.subLinks.map((subLink) => (
                    <li key={subLink.to} className="list-none">
                      <Link
                        to={subLink.to}
                        className={`block px-3 py-2 rounded-md transition-colors text-sm
                          ${isActive(subLink.to)
                            ? 'bg-blue-600/50 text-white'
                            : 'hover:bg-blue-600/30 text-blue-100'
                          }`}
                      >
                        {subLink.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 text-center border-t border-blue-600 mt-auto">
        {!collapsed && <p className="text-xs text-blue-300">TORMENTA ERP v1.0</p>}
      </div>
    </div>
  );
}

export default Sidebar;
