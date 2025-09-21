import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import BarraSearch from "@/components/Search/Search";
import CommandDemo from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/Sidebar";
import EnhancedBreadcrumb from "@/components/ui/EnhancedBreadcrumb";

function Navbar({ routes }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCommand, setShowCommand] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const handleCloseCommand = () => setShowCommand(false);

  return (
<header
  className="sticky top-0 z-30 w-full"
  id="main-navbar"
>
     <nav className="flex items-center justify-between py-3 gap-2 max-w-[1900px] mx-auto w-full">
        {/* Izquierda: Sidebar trigger + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger
            className="ml-1 rounded-lg hover:bg-gray-100 transition-all duration-150 h-9 w-9 flex items-center justify-center text-gray-700"
          />
          <div className="hidden md:block min-w-0">
            <EnhancedBreadcrumb />
          </div>
          {/* Mobile: botón menú para mostrar breadcrumb */}
          <button className="md:hidden ml-2" onClick={toggleMenu} aria-label="Abrir menú">
            {menuOpen ? <FaTimes className="text-gray-700" /> : <FaBars className="text-gray-700" />}
          </button>
        </div>

        {/* Centro: Breadcrumb en mobile */}
        {menuOpen && (
          <div className="absolute left-0 top-full w-full bg-white border-b border-gray-100 shadow-md md:hidden animate-fade-in">
            <div className="px-4 py-3">
              <EnhancedBreadcrumb />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;