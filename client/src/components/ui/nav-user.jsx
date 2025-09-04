"use client";

import React, { useState, useEffect } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
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
  const { isMobile } = useSidebar();
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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={displayName} />
                ) : (
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{userRole}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="z-[9999] w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-white text-black shadow-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={displayName} />
                  ) : (
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{userRole}</span>
                </div>
              </div>
            </DropdownMenuLabel>

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
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-red-600 hover:bg-red-50 active:bg-red-100"
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
