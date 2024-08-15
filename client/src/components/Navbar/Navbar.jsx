import './Navbar.css';
import { useState } from 'react';
import { FaBars, FaTimes, FaUser } from 'react-icons/fa';
import { IoIosSearch } from "react-icons/io";
//import { Link } from 'react-router-dom';
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, User} from "@nextui-org/react";
import { Link} from "@nextui-org/react";
// Auth Context
import { useAuth } from '@/context/Auth/AuthProvider';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Contexto de autenticación
  const { logout, user } = useAuth();

  return (
    <div className="bg-white p-4 pb-2 flex justify-between items-center relative">
      <div className="flex items-center space-x-4 mr-3">
        {/* Botón de menú desplegable */}
        <button className="md:hidden" onClick={toggleMenu}>
          {menuOpen ? <FaTimes className="text-gray-700" /> : <FaBars className="text-gray-700" />}
        </button>
        {/* Menú desplegable */}
        <div className={`w-full md:flex md:items-center ${menuOpen ? 'block shadow-md' : 'hidden'} md:block absolute md:static`}>
          <Link  href="/ventas" color="primary" isBlock
      as={Link} className="block md:inline-block text-gray-600 text-center py-2 ">
            Venta
          </Link>
          <Link as={Link} color="primary" isBlock href="/almacen" className="block md:inline-block text-center text-gray-600 px-2 py-2">
            Almacén
          </Link>
          <Link as={Link} color="primary" isBlock href="/empleados" className="block md:inline-block text-gray-600 px-2 py-2 ">
            Empleados
          </Link>
          <Link as={Link} color="primary" isBlock href="/productos" className="block md:inline-block text-gray-600 px-2 py-2">
            Productos
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="border pl-10 pr-2 py-1 border-gray-300 text-gray-900 text-sm rounded-lg"
          />
        </div>

        {/* Iconos de notificaciones, carrito y usuario */}
        <div className="flex items-center gap-4">
        
          <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <User
              as="button"
              avatarProps={{
                isBordered: true,
                icon: <FaUser style={{ fontSize: '20px', color:'gray' }} />,
                size: 'sm',
              }}
              className="transition-transform"
              description={user?.rol === 1 ? "Administrador" : user?.rol === 3 ? "Empleado" : "Rol desconocido"}
              name={user?.usuario.toUpperCase()}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="logout" color="danger" onClick={logout}>
              Cerrar sesión
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
          
        </div>
      </div>
    </div>
  );
}

export default Navbar;
