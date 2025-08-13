"use client";

import React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Home,
  Tags,
  Warehouse,
  Users,
  User,
  LineChart,
  Building2,
  FileBarChart2,
  UserCog,
  UserRound,
} from "lucide-react";

import { ScrollShadow } from "@heroui/react";

import { NavMain } from "@/components/ui/nav-main";
import { NavProjects } from "@/components/ui/nav-projects";
import { NavReports } from "@/components/ui/nav-reports";
import { NavUser } from "@/components/ui/nav-user";
import { NavLogistica } from "@/components/ui/nav-logistica";
import { NavTerceros } from "@/components/ui/nav-terceros";
import { NavConfig } from "@/components/ui/nav-config";
import { NavDesarrollador } from "@/components/ui/nav-dev";
import { TeamSwitcher } from "@/components/ui/team-switcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    { name: "Hyrotek Inc", logo: GalleryVerticalEnd, plan: "Enterprise" },
    { name: "Hyrotek Corp.", logo: AudioWaveform, plan: "Startup" },
    { name: "Misterius Corp.", logo: Command, plan: "Free" },
  ],
  navMain: [
    { title: "Dashboard", url: "/inicio", icon: Home, items: [] },
    {
      title: "Productos",
      url: "/productos",
      icon: Tags,
      items: [
        { title: "Marcas", url: "/productos/marcas" },
        { title: "Categorías", url: "/productos/categorias" },
        { title: "Subcategorías", url: "/productos/subcategorias" },
      ],
    },
    {
      title: "Ventas",
      url: "/ventas",
      icon: LineChart,
      items: [
        { title: "Nueva venta", url: "/ventas/registro_venta" },
      ],
    },
  ],
  reportes: [
    { title: "Análisis de ventas", url: "/reportes", icon: FileBarChart2, items: [] },
    { title: "Libro de ventas", url: "/ventas/libro_ventas", icon: FileBarChart2, items: [] },
  ],
  terceros: [
    { title: "Clientes", url: "/clientes", icon: User, items: [] },
    { title: "Empleados", url: "/empleados", icon: Users, items: [] },
    { title: "Proveedores", url: "/proveedores", icon: Users, items: [] },
  ],
  logistica: [
    {
      title: "Kárdex",
      url: "/almacen",
      icon: Warehouse,
      items: [
        { title: "Nota de Almacen", url: "/almacen/nota_ingreso" },
        { title: "Guía Remisión", url: "/almacen/guia_remision" },
      ],
    },
    { title: "Almacenes", url: "/almacenG", icon: Warehouse, items: [] },
    { title: "Sucursal", url: "/sucursal", icon: Building2, items: [] },
  ],
  configuracion: [
    { title: "Usuarios", url: "/configuracion/usuarios", icon: UserCog, items: [] },
    { title: "Roles y permisos", url: "/configuracion/roles", icon: Users, items: [] },
    { title: "Logs", url: "/configuracion/logs", icon: FileBarChart2, items: [] },
    { title: "Negocio", url: "/configuracion/negocio", icon: Tags, items: [] }
  ],
  desarrollador: [
    { title: "Desarrollo", url: "/desarrollador", icon: Bot, items: [] },
    { title: "Módulos", url: "/modulos", icon: SquareTerminal, items: [] },
    { title: "Permisos Globales", url: "/desarrollador/permisos-globales", icon: Settings2, items: [] },
    { title: "Inf. empresas", url: "/sunat", icon: BookOpen, items: [] },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ],
};

export function AppSidebar(props) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>

      <SidebarContent>
        <ScrollShadow hideScrollBar className="h-full px-1">
          <NavMain items={data.navMain} />
          <NavReports items={data.reportes} />
          <NavTerceros items={data.terceros} />
          <NavLogistica items={data.logistica} />
          <NavConfig items={data.configuracion} />
          <NavDesarrollador items={data.desarrollador} />
          <NavProjects projects={data.projects} />
        </ScrollShadow>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
