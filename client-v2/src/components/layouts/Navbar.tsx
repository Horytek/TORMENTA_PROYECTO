import React, { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUserStore } from "@/store/useUserStore";
import { Sun, Moon, Bell, Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const user = useUserStore((state) => state.user);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync theme with HTML class list
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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 border-b border-slate-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Toggle button to collapse/expand sidebar */}
        <SidebarTrigger className="h-9 w-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl" />
        
        {/* Branch / Store Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium text-xs">
          <Store className="h-3.5 w-3.5" />
          <span>Sucursal: {user?.sucursal || "Matriz Central"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Search Trigger (Mocked) */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications (Mocked) */}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
        </Button>

        {/* Theme Toggler (Light/Dark Mode) */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
