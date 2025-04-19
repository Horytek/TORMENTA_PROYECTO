import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaUser } from 'react-icons/fa';
import { getRoles } from '@/services/rol.services';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, User } from "@nextui-org/react";
import { Link } from "@nextui-org/react";
import { useAuth } from '@/context/Auth/AuthProvider';
import BarraSearch from "@/components/Search/Search";

function Navbar() {
  const [roles, setRoles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const { logout, user } = useAuth();

  useEffect(() => {
    const fetchRoles = async () => {
      const data = await getRoles();
      setRoles(data);
    };

    fetchRoles();
  }, []);

  const formatRoleName = (roleName) => {
    if (!roleName) return "Rol desconocido";
    return roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
  };

  const userRoleName = formatRoleName(roles.find((role) => role.id_rol === user?.rol)?.nom_rol);

  return (
    <div className="bg-white p-4 pb-2 flex justify-between items-center relative">
      {/* Menú desplegable */}
      <div className="flex items-center space-x-4 mr-3">
        <button className="md:hidden" onClick={toggleMenu}>
          {menuOpen ? <FaTimes className="text-gray-700" /> : <FaBars className="text-gray-700" />}
        </button>
        <div
          className={`${menuOpen ? "block shadow-md" : "hidden"
            } bg-white max-w-max rounded-lg absolute top-12 left-0 md:flex md:items-center md:static md:block`}
        >
          <Link
            href="/ventas"
            color="primary"
            isBlock
            as={Link}
            className="block md:inline-block text-gray-600 text-center py-2 hover:bg-[#4069e5] hover:text-white transition-colors duration-200 rounded"
          >
            Venta
          </Link>
          <Link
            as={Link}
            color="primary"
            isBlock
            href="/almacen"
            className="block md:inline-block text-center text-gray-600 px-2 py-2 hover:bg-[#4069e5] hover:text-white transition-colors duration-200 rounded"
          >
            Kardex
          </Link>
          <Link
            as={Link}
            color="primary"
            isBlock
            href="/empleados"
            className="block md:inline-block text-gray-600 px-2 py-2 hover:bg-[#4069e5] hover:text-white transition-colors duration-200 rounded"
          >
            Empleados
          </Link>
          <Link
            as={Link}
            color="primary"
            isBlock
            href="/productos"
            className="block md:inline-block text-gray-600 px-2 py-2 hover:bg-[#4069e5] hover:text-white transition-colors duration-200 rounded"
          >
            Productos
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <BarraSearch
          placeholder="Buscar..."
          isClearable
          className="h-9 text-sm"  
        />

        {/* Iconos de usuario */}
        <div className="flex items-center gap-4">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <User
                as="button"
                avatarProps={{
                  isBordered: true,
                  icon: <FaUser style={{ fontSize: '20px', color: 'gray' }} />,
                  size: 'sm',
                }}
                className="transition-transform"
                description={userRoleName}
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
