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
} from "lucide-react";
import { FaHome, FaTags, FaWarehouse, FaUserFriends, FaUsers, FaChartLine, FaBuilding, FaCog } from "react-icons/fa";
import { BiSolidReport } from "react-icons/bi";

import { NavMain } from "@/components/ui/nav-main";
import { NavProjects } from "@/components/ui/nav-projects";
import { NavUser } from "@/components/ui/nav-user";
import { TeamSwitcher } from "@/components/ui/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Sample data with your routes and icons
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    { name: "Acme Inc", logo: GalleryVerticalEnd, plan: "Enterprise" },
    { name: "Acme Corp.", logo: AudioWaveform, plan: "Startup" },
    { name: "Evil Corp.", logo: Command, plan: "Free" },
  ],
  navMain: [
    { title: "Inicio", url: "/inicio", icon: FaHome, items: [] },
    {
      title: "Productos",
      url: "/productos",
      icon: FaTags,
      items: [
        { title: "Marcas", url: "/productos/marcas" },
        { title: "Categorías", url: "/productos/categorias" },
        { title: "Subcategorías", url: "/productos/subcategorias" },
      ],
    },
    { title: "Almacenes", url: "/almacenG", icon: FaWarehouse, items: [] },
    { title: "Clientes", url: "/clientes", icon: FaUserFriends, items: [] },
    { title: "Empleados", url: "/empleados", icon: FaUsers, items: [] },
    { title: "Proveedores", url: "/proveedores", icon: FaUsers, items: [] },
    {
      title: "Ventas",
      url: "/ventas",
      icon: FaChartLine,
      items: [
        { title: "Nueva Venta", url: "/ventas/registro_venta" },
        { title: "Libro Ventas", url: "/ventas/libro_ventas" },
      ],
    },
    {
      title: "Kárdex",
      url: "/almacen",
      icon: FaWarehouse,
      items: [
        { title: "Nota Ingreso", url: "/almacen/nota_ingreso" },
        { title: "Guía Remisión", url: "/almacen/guia_remision" },
        { title: "Nota Salida", url: "/almacen/nota_salida" },
      ],
    },
    { title: "Reportes", url: "/reportes", icon: BiSolidReport, items: [] },
    { title: "Sucursal", url: "/sucursal", icon: FaBuilding, items: [] },
    {
      title: "Configuración",
      url: "#",
      icon: FaCog,
      items: [
        { title: "Usuarios", url: "/configuracion/usuarios" },
        { title: "Roles y Permisos", url: "/configuracion/roles" },
      ],
    },
    { title: "Desarrollador", url: "/desarrollador", icon: FaCog, items: [] },
    { title: "Inf. Empresas", url: "/sunat", icon: BiSolidReport, items: [] },
    { title: "Módulos", url: "/modulos", icon: FaCog, items: [] },
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
        <NavMain items={data.navMain} />  
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
