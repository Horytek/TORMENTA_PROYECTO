import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUserStore } from "@/store/useUserStore";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Home,
  Tags,
  LineChart,
  Warehouse,
  FileSpreadsheet,
  Settings,
  Terminal,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Building,
  User,
  Users
} from "lucide-react";
import { removeToken } from "@/utils/authStorage";
import { resetVerifyTokenCache } from "@/api/auth";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  capability?: string;
}

interface SidebarGroupSection {
  label: string;
  items: SidebarItem[];
}

export default function AppSidebar() {
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const capabilities = useUserStore((state) => state.capabilities);
  const clearUser = useUserStore((state) => state.clearUser);

  const handleLogout = async () => {
    await removeToken();
    resetVerifyTokenCache();
    clearUser();
  };

  // Helper to check module access
  const hasAccess = (item: SidebarItem) => {
    console.log("AppSidebar Access check:", {
      title: item.title,
      capability: item.capability,
      userRole: user?.roleId,
      capabilitiesLoaded: Array.from(capabilities)
    });
    if (user?.roleId === 10) return true; // Developer always has access
    if (!item.capability) return true; // Public item
    return capabilities.has(`${item.capability}.view`) || capabilities.has("*");
  };

  const navigation: SidebarGroupSection[] = [
    {
      label: "General",
      items: [
        { title: "Inicio", url: "/dashboard", icon: Home },
        { title: "Productos", url: "/products", icon: Tags, capability: "productos" },
        { title: "Punto de Venta (POS)", url: "/sales/pos", icon: LineChart, capability: "ventas" },
      ],
    },
    {
      label: "Logística",
      items: [
        { title: "Movimientos Kárdex", url: "/logistics/kardex", icon: Warehouse, capability: "almacen" },
        { title: "Almacenes", url: "/logistics/warehouses", icon: Warehouse, capability: "almaceng" },
        { title: "Sucursales", url: "/logistics/branches", icon: Building, capability: "sucursal" },
      ],
    },
    {
      label: "Personas",
      items: [
        { title: "Clientes", url: "/people/clients", icon: User, capability: "clientes" },
        { title: "Proveedores", url: "/people/providers", icon: Users, capability: "proveedores" },
        { title: "Empleados", url: "/people/employees", icon: Users, capability: "empleados" },
      ],
    },
    {
      label: "Reportes",
      items: [
        { title: "Historial de Ventas", url: "/reports/sales", icon: FileSpreadsheet, capability: "reportes" },
      ],
    },
    {
      label: "Ajustes",
      items: [
        { title: "Usuarios", url: "/settings/users", icon: Users, capability: "configuracion/usuarios" },
        { title: "Roles y Permisos", url: "/settings/roles", icon: ShieldAlert, capability: "configuracion/roles" },
        { title: "Configuración", url: "/settings/system", icon: Settings, capability: "configuracion/negocio" },
      ],
    },
  ];

  // Developer module (role ID 10)
  if (user?.roleId === 10) {
    navigation.push({
      label: "Developer Only",
      items: [
        { title: "Módulos y Rutas", url: "/developer/modules", icon: Terminal },
        { title: "Permisos Globales", url: "/developer/global-permissions", icon: Settings },
      ],
    });
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950">
      <SidebarHeader className="h-16 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Warehouse className="h-5 w-5" />
          </div>
          <span className="font-bold text-md tracking-tight group-data-[collapsible=icon]:hidden">
            Horytek ERP
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {navigation.map((group) => {
          // Filter out items that the user doesn't have access to
          const allowedItems = group.items.filter(hasAccess);
          if (allowedItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="px-3 mb-4">
              <SidebarGroupLabel className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu>
                  {allowedItems.map((item) => {
                    const isActive = location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-zinc-900",
                            isActive 
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 dark:bg-purple-500/20" 
                              : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          <Link to={item.url}>
                            <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-slate-500")} />
                            <span className="group-data-[collapsible=icon]:hidden truncate">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-200/50 dark:border-zinc-800/50">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* User profile card in sidebar footer */}
            <div className="flex items-center gap-3 p-2 rounded-xl group-data-[collapsible=icon]:hidden">
              <div className="h-9 w-9 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.username}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.sucursal || "Sucursal Central"}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          
          <SidebarMenuItem className="mt-1">
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 font-medium text-sm transition-all duration-200"
            >
              <LogOut className="h-4 w-4 shrink-0 text-destructive/70" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
