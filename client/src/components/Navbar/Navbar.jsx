import { useTheme } from "@heroui/use-theme";
import { Switch } from "@heroui/react";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import CommandDemo from "@/components/ui/command";
import { SidebarTrigger } from "@/components/ui/Sidebar";
import EnhancedBreadcrumb from "@/components/ui/EnhancedBreadcrumb";

// Iconos personalizados
const MoonIcon = (props) => (
  <svg aria-hidden="true" focusable="false" height="1em" role="presentation" viewBox="0 0 24 24" width="1em" {...props}>
    <path d="M21.53 15.93c-.16-.27-.61-.69-1.73-.49a8.46 8.46 0 01-1.88.13 8.409 8.409 0 01-5.91-2.82 8.068 8.068 0 01-1.44-8.66c.44-1.01.13-1.54-.09-1.76s-.77-.55-1.83-.11a10.318 10.318 0 00-6.32 10.21 10.475 10.475 0 007.04 8.99 10 10 0 002.89.55c.16.01.32.02.48.02a10.5 10.5 0 008.47-4.27c.67-.93.49-1.519.32-1.79z" fill="currentColor" />
  </svg>
);

const SunIcon = (props) => (
  <svg aria-hidden="true" focusable="false" height="1em" role="presentation" viewBox="0 0 24 24" width="1em" {...props}>
    <g fill="currentColor">
      <path d="M19 12a7 7 0 11-7-7 7 7 0 017 7z" />
      <path d="M12 22.96a.969.969 0 01-1-.96v-.08a1 1 0 012 0 1.038 1.038 0 01-1 1.04zm7.14-2.82a1.024 1.024 0 01-.71-.29l-.13-.13a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.984.984 0 01-.7.29zm-14.28 0a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a1 1 0 01-.7.29zM22 13h-.08a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zM2.08 13H2a1 1 0 010-2 1.038 1.038 0 011.04 1 .969.969 0 01-.96 1zm16.93-7.01a1.024 1.024 0 01-.71-.29 1 1 0 010-1.41l.13-.13a1 1 0 011.41 1.41l-.13.13a.984.984 0 01-.7.29zm-14.02 0a1.024 1.024 0 01-.71-.29l-.13-.14a1 1 0 011.41-1.41l.13.13a1 1 0 010 1.41.97.97 0 01-.7.3zM12 3.04a.969.969 0 01-1-.96V2a1 1 0 012 0 1.038 1.038 0 01-1 1.04z" />
    </g>
  </svg>
);

function DarkModeSwitch() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Switch
      isSelected={isDark}
      onValueChange={(checked) => setTheme(checked ? "dark" : "light")}
      color="secondary"
      endContent={<SunIcon />}
      startContent={<MoonIcon />}
      size="md"
      aria-label="Cambiar modo oscuro"
      className="ml-2"
    />
  );
}

function Navbar({ routes }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="sticky top-0 z-30 w-full" id="main-navbar">
      <nav className="flex items-center justify-between py-3 gap-2 max-w-[1900px] mx-auto w-full">
        {/* Izquierda: Sidebar trigger + breadcrumb + darkmode */}
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger
            className="ml-1 rounded-lg hover:bg-gray-100 transition-all duration-150 h-9 w-9 flex items-center justify-center text-gray-700"
          />
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <EnhancedBreadcrumb />
            <DarkModeSwitch />
          </div>
          {/* Mobile: botón menú para mostrar breadcrumb */}
          <button className="md:hidden ml-2" onClick={toggleMenu} aria-label="Abrir menú">
            {menuOpen ? <FaTimes className="text-gray-700" /> : <FaBars className="text-gray-700" />}
          </button>
        </div>

        {/* Centro: Breadcrumb y switch en mobile */}
        {menuOpen && (
          <div className="absolute left-0 top-full w-full bg-white border-b border-gray-100 shadow-md md:hidden animate-fade-in">
            <div className="px-4 py-3 flex items-center gap-3">
              <EnhancedBreadcrumb />
              <DarkModeSwitch />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Navbar;