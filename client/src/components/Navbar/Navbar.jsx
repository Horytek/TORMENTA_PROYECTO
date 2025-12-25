import { useTheme } from "@heroui/use-theme";
import { Switch } from "@heroui/react";
import { useState, useCallback } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { SidebarTrigger } from "@/components/ui/Sidebar";
import EnhancedBreadcrumb from "@/components/ui/EnhancedBreadcrumb";
import DeepSeekChatbot from "@/components/Chatbot/DeepSeekChatbot";
import { Moon, Sun } from "lucide-react";

// Componente optimizado para el switch de modo oscuro
function DarkModeSwitch() {
  const { theme, setTheme } = useTheme();

  // Usar una función manejadora optimizada
  const handleThemeChange = useCallback((isSelected) => {
    setTheme(isSelected ? "dark" : "light");
  }, [setTheme]);

  return (
    <div className="flex items-center">
      <Switch
        isSelected={theme === "dark"}
        onValueChange={handleThemeChange}
        color="secondary"
        size="sm"
        thumbIcon={({ isSelected, className }) =>
          isSelected ? (<Sun className={className} />) : (<Moon className={className} />)
        }
        aria-label="Cambiar modo oscuro"
        className="ml-2"
      />
    </div>
  );
}

function Navbar({ routes }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <>
      <header className="sticky top-0 z-30 w-full transition-all duration-300 border-b border-slate-200/60 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-lg" id="main-navbar">
        <nav className="flex items-center justify-between px-6 py-3 max-w-[1920px] mx-auto w-full">
          {/* Izquierda: Sidebar trigger + breadcrumb + DarkMode */}
          <div className="flex items-center gap-4 min-w-0">
            <SidebarTrigger
              className="rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200 h-8 w-8 flex items-center justify-center text-slate-600 dark:text-zinc-300"
            />
            <div className="hidden md:flex items-center gap-3 min-w-0">
              <div className="h-4 w-[1px] bg-slate-200 dark:bg-zinc-800 mx-1"></div>
              <EnhancedBreadcrumb />
              <div className="ml-2 pl-2 border-l border-slate-200 dark:border-zinc-800">
                <DarkModeSwitch />
              </div>
            </div>
            {/* Mobile: botón menú */}
            <button className="md:hidden ml-2 text-slate-700 dark:text-slate-200" onClick={toggleMenu} aria-label="Abrir menú">
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Derecha: User menu or global search placeholders if any */}
          <div className="flex items-center gap-3">
            {/* Espacio para futuros elementos o dejar vacío si el switch ya se movió */}
          </div>

          {/* Mobile Menu Content */}
          {menuOpen && (
            <div className="absolute left-0 top-full w-full bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 shadow-xl md:hidden animate-fade-in p-4">
              <div className="flex flex-col gap-4">
                <EnhancedBreadcrumb />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Modo Oscuro</span>
                  <DarkModeSwitch />
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
      <DeepSeekChatbot />
    </>
  );
}

export default Navbar;
