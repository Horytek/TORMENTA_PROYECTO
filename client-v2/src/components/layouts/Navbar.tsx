import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUserStore } from "@/store/useUserStore";
import { Sun, Moon, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SearchCommandDialog,
  useCommandK,
} from "@/components/layouts/SearchCommandDialog";
import { NotificationsPopover } from "@/components/layouts/NotificationsPopover";

export default function Navbar() {
  const user = useUserStore((state) => state.user);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  // Atajo global Ctrl/Cmd + K para abrir la búsqueda
  useCommandK(() => setSearchOpen(true));

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground" />

          {/* Indicador de sucursal — chip tipo etiqueta, código en mono */}
          <div className="hidden items-center gap-2 rounded-md border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-secondary-foreground sm:flex">
            <Store className="h-3.5 w-3.5 text-brand" />
            <span className="text-muted-foreground">Sucursal</span>
            <span className="num font-semibold">{user?.sucursal || "Matriz Central"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Botón de búsqueda — abre CommandDialog (Ctrl/⌘+K) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Buscar"
            onClick={() => setSearchOpen(true)}
            className="h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Dropdown de notificaciones */}
          <NotificationsPopover />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="h-9 w-9 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <SearchCommandDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
