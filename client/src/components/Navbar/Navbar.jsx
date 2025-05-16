import { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

import { Separator } from "@/components/ui/separator"

import BarraSearch from "@/components/Search/Search";
import CommandDemo from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/sidebar";
import EnhancedBreadcrumb from "@/components/ui/EnhancedBreadcrumb"; // Importamos el componente

function Navbar({ routes }) {
  // const [roles, setRoles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCommand, setShowCommand] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Agrega esta función:
  const handleCloseCommand = () => {
    setShowCommand(false);
  };

  return (
    <div className="bg-white p-4 pb-2 flex justify-between items-center relative">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="-ml-1" />
          
        <button className="md:hidden" onClick={toggleMenu}>
          {menuOpen ? <FaTimes className="text-gray-700" /> : <FaBars className="text-gray-700" />}
        </button>

        <div
          className={`${menuOpen ? "block shadow-md" : "hidden"
            } bg-white max-w-max rounded-lg absolute top-12 left-0 md:flex md:items-center md:static md:block`}
        >
          <div className="px-2 py-2">
            <EnhancedBreadcrumb />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <BarraSearch
          placeholder="Buscar en el sistema"
          readOnly
          style={{ cursor: 'pointer' }}
          isClearable
          className="h-9 text-sm cursor-pointer"
          onFocus={() => setShowCommand(true)} 
          onClick={() => setShowCommand(true)} 
        />

        {/* Modal CommandDemo */}
        {showCommand && (
          <div
            id="command-modal-bg"
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
            onClick={handleCloseCommand}
          >
            <div className="bg-white rounded-lg shadow-lg p-4" onClick={e => e.stopPropagation()}>
              <CommandDemo routes={routes} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Navbar;
