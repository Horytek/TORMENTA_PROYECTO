import { useState } from 'react';
import { FaRegBell, FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { HiOutlineShoppingCart } from "react-icons/hi";
import { LuUserCircle } from "react-icons/lu";
import './Navbar.css';
import { Link } from 'react-router-dom';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="bg-white p-4 pb-2 flex justify-between items-center relative">
      <div className="flex items-center space-x-4 mr-3">
        {/* Botón de menú desplegable */}
        <button className="md:hidden" onClick={toggleMenu}>
          {menuOpen ? <FaTimes className="text-gray-700" /> : <FaBars className="text-gray-700" />}
        </button>
        {/* Menú desplegable */}
        <div className={`menu-desplegable w-full md:flex md:items-center ${menuOpen ? 'block shadow-md' : 'hidden'} md:block absolute md:static`}>
          <Link to="/ventas" >
            <a href="#" className="block md:inline-block text-gray-600 px-2 py-2 hover:bg-gray-200">Venta</a>
          </Link>
          <Link to="/almacen" >
            <a href="#" className="block md:inline-block text-gray-600 px-2 py-2 hover:bg-gray-200">Almacén</a>

          </Link>
          <Link to="/empleados" >
            <a href="#" className="block md:inline-block text-gray-600 px-2 py-2 hover:bg-gray-200">Empleados</a>

          </Link>
          <Link to="/productos" >
            <a href="#" className="block md:inline-block text-gray-600 px-2 py-2 hover:bg-gray-200">Productos</a>

          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="border rounded pl-10 pr-2 py-1"
          />
        </div>

        {/* Iconos de notificaciones, carrito y usuario */}
        <div className="flex items-center space-x-2">
          <FaRegBell className="text-gray-700 text-xl cursor-pointer" style={{ fontSize: "25px" }} />
          <HiOutlineShoppingCart className="text-gray-700 text-xl cursor-pointer" style={{ fontSize: "25px" }} />
          <LuUserCircle className="text-gray-700 text-xl cursor-pointer" style={{ fontSize: "25px" }} />
        </div>
      </div>
    </div>
  );
}

export default Navbar;