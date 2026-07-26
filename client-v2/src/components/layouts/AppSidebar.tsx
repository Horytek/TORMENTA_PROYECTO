import React, { useMemo } from "react";
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
  Terminal,
  LogOut,
  BadgeCheck,
  CreditCard,
  ChevronsUpDown,
  ScrollText,
  FileCheck2,
  Plug,
} from "lucide-react";
import { removeToken } from "@/utils/authStorage";
import { resetVerifyTokenCache } from "@/api/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDrawer } from "@/features/account/components/AccountDrawer";
import { BillingDrawer } from "@/features/account/components/BillingDrawer";
import { usePermissions } from "@/hooks/usePermissions";
import { buildNavSections, type NavItem } from "@/lib/navigationCatalog";

export default function AppSidebar() {
  const location = useLocation();
  const user = useUserStore((state) => state.user);
  const globalModuleConfigs = useUserStore((state) => state.globalModuleConfigs);
  const clearUser = useUserStore((state) => state.clearUser);
  const { can, isDeveloper, isAdmin } = usePermissions();
  const [showAccount, setShowAccount] = React.useState(false);
  const [showBilling, setShowBilling] = React.useState(false);

  const handleLogout = async () => {
    await removeToken();
    resetVerifyTokenCache();
    clearUser();
  };

  const canManageAccount = isAdmin;

  const hasAccess = (item: NavItem) => {
    if (isDeveloper) return true;
    if (!item.capability) return true; // "Inicio" siempre visible
    return can(`${item.capability}.view`);
  };

  // Navegación derivada del catálogo real de módulos (GET /rutas/modulos, ya
  // cargado al login) en vez de un array hardcodeado — ver navigationCatalog.ts.
  const navigation = useMemo(() => {
    const sections = [...buildNavSections(globalModuleConfigs)];
    // Comprobantes electrónicos: no tiene fila propia en `modulo`/`submodulos`
    // (reusa la capability `ventas`, igual que /api/cpe en el backend), así que
    // el catálogo dinámico no lo emite — se inyecta acá, como los Logs.
    if (isDeveloper || can("ventas.view")) {
      const cpeItem = {
        title: "Comprobantes electrónicos",
        url: "/sales/comprobantes",
        icon: FileCheck2,
        group: "Reportes",
        keywords: ["sunat", "factura", "boleta", "cdr", "cpe", "facturación electrónica"],
      };
      const reportes = sections.find((s) => s.label === "Reportes");
      if (reportes) reportes.items.push(cpeItem);
      else sections.push({ label: "Reportes", items: [cpeItem] });
    }
    // Integraciones: sin módulo/capability en BD; gate por rol admin, igual que
    // los Logs del Sistema y que /api/integraciones en el backend.
    if (isAdmin) {
      const item = {
        title: "Integraciones",
        url: "/settings/integrations",
        icon: Plug,
        group: "Ajustes",
        keywords: ["sunat", "credenciales", "certificado", "estado", "diagnóstico", "conexión"],
      };
      const ajustes = sections.find((s) => s.label === "Ajustes");
      if (ajustes) ajustes.items.push(item);
      else sections.push({ label: "Ajustes", items: [item] });
    }
    // Logs de auditoría: sin módulo/capability en BD (gate por rol admin, como en v1).
    if (isAdmin) {
      const logsItem = { title: "Logs del Sistema", url: "/settings/logs", icon: ScrollText, group: "Ajustes" };
      const ajustes = sections.find((s) => s.label === "Ajustes");
      if (ajustes) ajustes.items.push(logsItem);
      else sections.push({ label: "Ajustes", items: [logsItem] });
    }
    if (isDeveloper) {
      sections.push({
        label: "Developer Only",
        items: [
          { title: "Panel de Desarrollador", url: "/developer", icon: Terminal, group: "Developer Only" },
        ],
      });
    }
    return sections;
  }, [globalModuleConfigs, isAdmin, isDeveloper, can]);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <img
            src="/horycore.svg"
            alt="Horytek"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-md object-contain group-data-[collapsible=icon]:mx-auto"
          />
          <span className="font-display text-lg font-extrabold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Horytek
          </span>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto w-full gap-3 rounded-md p-2 group-data-[collapsible=icon]:hidden">
                  <div className="num flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 font-bold text-brand ring-1 ring-brand/25">
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="truncate text-xs font-semibold text-sidebar-foreground">
                      {user?.username}
                    </span>
                    <span className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Usuario activo
                    </span>
                  </div>
                  <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-semibold">{user?.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.sucursal || "Sucursal Central"}</p>
                </DropdownMenuLabel>
                {canManageAccount && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setShowAccount(true)}>
                        <BadgeCheck className="mr-2 h-4 w-4" /> Cuenta
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowBilling(true)}>
                        <CreditCard className="mr-2 h-4 w-4" /> Facturación
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          <SidebarMenuItem className="mt-1 hidden group-data-[collapsible=icon]:block">
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar Sesión"
              className="w-full gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 shrink-0 text-destructive/70" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AccountDrawer isOpen={showAccount} onClose={() => setShowAccount(false)} />
      <BillingDrawer isOpen={showBilling} onClose={() => setShowBilling(false)} />
    </Sidebar>
  );
}
