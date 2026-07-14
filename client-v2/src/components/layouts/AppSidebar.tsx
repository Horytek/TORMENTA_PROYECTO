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
  Warehouse,
  Package,
  FileSpreadsheet,
  Settings,
  Terminal,
  LogOut,
  ShieldAlert,
  Building,
  User,
  Users,
  ShoppingCart,
  Palette,
  ClipboardList,
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

  const hasAccess = (item: SidebarItem) => {
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
        { title: "Contenidos", url: "/content", icon: Palette, capability: "gestor-contenidos" },
        { title: "Punto de Venta (POS)", url: "/sales", icon: ShoppingCart, capability: "ventas" },
      ],
    },
    {
      label: "Logística",
      items: [
        { title: "Inventario / Kárdex", url: "/inventory", icon: Package, capability: "almacen" },
        { title: "Almacenes", url: "/logistics/warehouses", icon: Warehouse, capability: "almaceng" },
        { title: "Notas de Almacén", url: "/logistics/warehouse-notes", icon: ClipboardList, capability: "nota_almacen" },
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-lg font-extrabold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Horytek
          </span>
          <span className="h-2 w-2 rounded-full bg-brand" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {navigation.map((group) => {
          const allowedItems = group.items.filter(hasAccess);
          if (allowedItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label} className="mb-3 px-3">
              <SidebarGroupLabel className="num px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground group-data-[collapsible=icon]:hidden">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu>
                  {allowedItems.map((item) => {
                    const isActive =
                      location.pathname === item.url || location.pathname.startsWith(`${item.url}/`);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className={cn(
                            "relative w-full gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-brand"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                          )}
                        >
                          <Link to={item.url}>
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-brand" : "text-muted-foreground"
                              )}
                            />
                            <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
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

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 rounded-md p-2 group-data-[collapsible=icon]:hidden">
              <div className="num flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 font-bold text-brand ring-1 ring-brand/25">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-sidebar-foreground">
                  {user?.username}
                </span>
                <span className="num truncate text-[10px] text-muted-foreground">
                  {user?.sucursal || "Sucursal Central"}
                </span>
              </div>
            </div>
          </SidebarMenuItem>

          <SidebarMenuItem className="mt-1">
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
              className="w-full gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
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
