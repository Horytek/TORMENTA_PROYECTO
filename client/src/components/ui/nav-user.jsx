"use client";

import React, { useState, useEffect } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
} from "lucide-react";
import UserNotifications from "@/components/ui/UserNotifications";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/Sidebar";
import { useAuth } from "@/context/Auth/AuthProvider";
import { getRoles } from "@/services/rol.services";
import { getNotificaciones } from "@/services/dashboard.services";
import { Badge } from "@heroui/react";
import BillingDrawer from "@/components/ui/BillingDrawer";
import AccountDrawer from "@/components/ui/AccountDrawer";

export function NavUser() {
  const { isMobile, state } = useSidebar();
  const { user, logout } = useAuth();
  const [roles, setRoles] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [billingData, setBillingData] = useState(null);

  // nuevo: contador de notificaciones
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetchRoles = async () => {
      const data = await getRoles();
      setRoles(data);
    };
    fetchRoles();
  }, []);

  // Normaliza la respuesta como en UserNotifications
  const normalizeItems = (resp) => {
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp?.data?.data)) return resp.data.data;
    if (Array.isArray(resp?.data?.notificaciones)) return resp.data.notificaciones;
    if (Array.isArray(resp?.data)) return resp.data;
    return [];
  };

  // Trae el conteo de notificaciones al montar y al cambiar el drawer
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const resp = await getNotificaciones();
        const items = normalizeItems(resp);
        if (mounted) setNotifCount(Array.isArray(items) ? items.length : 0);
      } catch (e) {
        if (mounted) setNotifCount(0);
      }
    };
    fetchCount();

    // refresca al abrir/cerrar para mantener sincronizado
    return () => {
      mounted = false;
    };
  }, [showNotifications]);

  useEffect(() => {
    if (showBilling) {
      // Aquí deberías hacer la petición real, ejemplo:
      setBillingData({
        empresa: user?.empresa || "Empresa S.A.C.",
        correo: user?.correo || user?.email || "correo@empresa.com",
        costo: user?.plan_pago === "1" ? "S/ 120" : user?.plan_pago === "2" ? "S/ 60" : "S/ 30",
        vencimiento: user?.fecha_vencimiento || "2024-12-31",
        estado: "Activo"
      });
    }
  }, [showBilling, user]);

  if (!user) return null;

  const formatRoleName = (name) => {
    if (!name) return "Rol desconocido";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const userRole = formatRoleName(
    roles.find((role) => String(role.id_rol) === String(user.rol))?.nom_rol
    || (String(user.rol) === "1" ? "Administrador" : "Rol desconocido")
  );

  const displayName = user.usuario || user.name || "Usuario";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Oculta el texto cuando el sidebar está colapsado
  const collapsed = state === "collapsed";
  const showText = !collapsed;

  return (
    <>
      <UserNotifications open={showNotifications} onClose={() => setShowNotifications(false)} />
      <BillingDrawer open={showBilling} onClose={() => setShowBilling(false)} billingData={billingData} />
      <AccountDrawer open={showAccount} onClose={() => setShowAccount(false)} accountData={billingData} /> 
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className={`
                  ${collapsed ? "sidebar-icon-btn" : ""}
                  data-[state=open]:bg-blue-50/80 data-[state=open]:text-blue-900
                  hover:bg-blue-50/60 transition-all duration-150
                  px-2 py-2 rounded-xl
                  flex items-center gap-3
                  shadow-none border border-gray-100
                  bg-white/80
                `}
                style={{
                  minHeight: collapsed ? "40px" : "48px",
                  minWidth: collapsed ? "40px" : 0,
                  width: collapsed ? "40px" : undefined,
                  boxShadow: "0 1px 4px 0 rgba(59,130,246,0.04)",
                }}
              >
                <Avatar className={`rounded-lg shadow-sm ring-1 ring-gray-200 ${collapsed ? "h-8 w-8" : "h-9 w-9"}`}>
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={displayName} />
                  ) : (
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  )}
                </Avatar>
                {showText && (
                  <div className="sidebar-user-text grid flex-1 text-left text-[15px] leading-tight">
                    <span className="truncate font-semibold text-blue-900">{displayName}</span>
                    <span className="truncate text-xs text-blue-500">{userRole}</span>
                  </div>
                )}
                <ChevronsUpDown className={`ml-auto size-4 text-blue-400 ${!showText ? "hidden" : ""}`} />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="z-[9999] min-w-56 rounded-xl bg-white/95 text-blue-900 shadow-xl border border-blue-100/60 p-1"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={6}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                  <Avatar className="h-9 w-9 rounded-lg shadow ring-1 ring-gray-200">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={displayName} />
                    ) : (
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="grid flex-1 text-left text-[15px] leading-tight">
                    <span className="truncate font-semibold text-blue-900">{displayName}</span>
                    <span className="truncate text-xs text-blue-500">{userRole}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="hover:bg-blue-50/80 focus:bg-blue-100/80 transition-colors rounded-lg"
                  onClick={() => setShowAccount(true)} // abre el drawer de cuenta
                >
                  <BadgeCheck className="mr-2 text-blue-400" />
                  Cuenta
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hover:bg-blue-50/80 focus:bg-blue-100/80 transition-colors rounded-lg"
                  onClick={() => setShowBilling(true)}
                >
                  <CreditCard className="mr-2 text-blue-400" />
                  Facturación
                </DropdownMenuItem>
                {/* Notificaciones: badge minimalista a la derecha */}
                <DropdownMenuItem
                  onClick={() => setShowNotifications(true)}
                  className="hover:bg-blue-50/80 focus:bg-blue-100/80 transition-colors rounded-lg flex items-center gap-2 pr-2"
                  style={{ minHeight: 38 }}
                >
                  <Bell className="text-blue-400 mr-2" />
                  <span className="text-sm text-blue-900 flex-1">Notificaciones</span>
                  <Badge
                    color="primary"
                    content={notifCount}
                    className="ml-1 mr-1 px-1 py-0 text-[10px] font-bold min-w-[18px] h-4 rounded-full flex items-center justify-center shadow-none bg-blue-500/90 text-white"
                    style={{
                      lineHeight: "16px",
                      height: 16,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  />
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-red-600 hover:bg-red-50 active:bg-red-100 font-medium rounded-lg"
              >
                <LogOut className="mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}

export default NavUser;
