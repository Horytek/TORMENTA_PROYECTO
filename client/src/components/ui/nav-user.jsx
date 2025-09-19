"use client";

import React, { useState, useEffect } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
} from "lucide-react";

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

export function NavUser() {
  const { isMobile, state } = useSidebar();
  const { user, logout } = useAuth();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      const data = await getRoles();
      setRoles(data);
    };
    fetchRoles();
  }, []);

  if (!user) return null;

  const formatRoleName = (name) => {
    if (!name) return "Rol desconocido";
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const userRole = formatRoleName(
    roles.find((role) => String(role.id_rol) === String(user.rol))?.nom_rol
  );

  const displayName = user.usuario || user.name || "Usuario";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Oculta el texto cuando el sidebar está colapsado
  const showText = state !== "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={`
                data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground
                hover:bg-gray-100 transition-all duration-150
                px-2 py-1.5 rounded-xl
                flex items-center gap-3
                ${!showText ? "justify-center" : ""}
              `}
              style={{
                minHeight: "48px",
                minWidth: showText ? 0 : "48px",
                boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)",
              }}
            >
              <Avatar className="h-9 w-9 rounded-lg shadow-sm ring-1 ring-gray-200">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={displayName} />
                ) : (
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                )}
              </Avatar>
              {showText && (
                <div className="grid flex-1 text-left text-[15px] leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs text-gray-500">{userRole}</span>
                </div>
              )}
              <ChevronsUpDown className={`ml-auto size-4 text-gray-400 ${!showText ? "hidden" : ""}`} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="z-[9999] min-w-56 rounded-xl bg-white text-black shadow-xl border border-gray-100"
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
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs text-gray-500">{userRole}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2" />
                Cuenta
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2" />
                Facturación
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2" />
                Notificaciones
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-red-600 hover:bg-red-50 active:bg-red-100 font-medium"
            >
              <LogOut className="mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default NavUser;