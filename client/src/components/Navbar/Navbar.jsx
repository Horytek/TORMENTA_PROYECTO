import { useTheme } from "@heroui/use-theme";
import { Switch } from "@heroui/react";
import { useCallback } from "react";
import EnhancedBreadcrumb from "@/components/ui/EnhancedBreadcrumb";
import DeepSeekChatbot from "@/components/Chatbot/DeepSeekChatbot";
import { Moon, Sun } from "lucide-react";
import NavLinks from "./NavLinks";
import MobileNav from "./MobileNav";
import NavProfile from "./NavProfile";
import NavCompany from "./NavCompany";

// Componente optimizado para el switch de modo oscuro
function DarkModeSwitch() {
  const { theme, setTheme } = useTheme();

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
      />
    </div>
  );
}

function Navbar() {
  return (
    <>
      <header className="sticky top-0 z-40 w-full transition-all duration-300 border-b border-slate-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md" id="main-navbar">
        <nav className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Left Section: Mobile Menu, Company Info & Branding */}
          <div className="flex items-center gap-3 flex-1 justify-start">
            {/* Mobile Toggle */}
            <MobileNav />

            {/* Company Info */}
            <NavCompany />

            {/* Separator */}
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-zinc-800 hidden md:block mx-1"></div>

            {/* Branding / Breadcrumbs */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <EnhancedBreadcrumb />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-1">
              <NavLinks />
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <DarkModeSwitch />
            </div>

            {/* Divider */}
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-zinc-800 hidden md:block"></div>

            <NavProfile />
          </div>

        </nav>
      </header>
      <DeepSeekChatbot />
    </>
  );
}

export default Navbar;
