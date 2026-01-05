import React, { useMemo, useEffect, useState } from "react";
import {
  AudioWaveform, BookOpen, Bot, Command, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal,
  Home, Tags, Warehouse, Users, User, LineChart, Building2, FileBarChart2, UserCog, Phone, Database
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
import { getEmpresas } from "@/services/empresa.services";
import { getPlanes } from "@/services/planes.services";
import { useUserStore } from "@/store/useStore";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/Sidebar";

// Sidebar navigation data
const SIDEBAR_DATA = {
  teams: [
    { name: "Horytek Inc", logo: GalleryVerticalEnd, plan: "Enterprise" },
    { name: "Horytek Corp.", logo: AudioWaveform, plan: "Startup" },
    { name: "Misterius Corp.", logo: Command, plan: "Free" },
  ],
  navMain: [
    { title: "Dashboard", url: "/inicio", icon: Home },
    { title: "Productos", url: "/productos", icon: Tags },
    {
      title: "Ventas",
      url: "/ventas",
      icon: LineChart,
      items: [{ title: "Nueva venta", url: "/ventas/registro_venta" }],
    },
  ],
  reportes: [
    { title: "Análisis de ventas", url: "/reportes", icon: FileBarChart2 },
    { title: "Libro de ventas", url: "/ventas/libro_ventas", icon: FileBarChart2 },
  ],
  terceros: [
    { title: "Clientes", url: "/clientes", icon: User },
    { title: "Empleados", url: "/empleados", icon: Users },
    { title: "Proveedores", url: "/proveedores", icon: Users },
  ],
  logistica: [
    {
      title: "Kárdex",
      url: "/almacen",
      icon: Warehouse,
      items: [
        { title: "Nota de Almacen", url: "/nota_almacen" },
        { title: "Guía Remisión", url: "/almacen/guia_remision" },
      ],
    },
    { title: "Almacenes", url: "/almacenG", icon: Warehouse },
    { title: "Sucursal", url: "/sucursal", icon: Building2 },
  ],
  configuracion: [
    { title: "Usuarios", url: "/configuracion/usuarios", icon: UserCog },
    { title: "Roles y permisos", url: "/configuracion/roles", icon: Users },
    { title: "Logs", url: "/configuracion/logs", icon: FileBarChart2 },
    { title: "Negocio", url: "/configuracion/negocio", icon: Tags },
    { title: "Llamadas", url: "/configuracion/llamadas", icon: Phone },
  ],
  desarrollador: [
    { title: "Desarrollo", url: "/desarrollador", icon: Bot },
    { title: "Módulos", url: "/modulos", icon: SquareTerminal },
    { title: "Permisos Globales", url: "/desarrollador/permisos-globales", icon: Settings2 },
    { title: "Limpiador DB", url: "/desarrollador/database-cleaner", icon: Database },
    { title: "Inf. empresas", url: "/sunat", icon: BookOpen },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ],
};

export function AppSidebar(props) {
  const id_tenant = useUserStore(state => state.id_tenant);
  const plan_pago = useUserStore(state => state.plan_pago);
  const [empresasTenant, setEmpresasTenant] = useState([]);
  const [planes, setPlanes] = useState([]);
  const data = useMemo(() => SIDEBAR_DATA, []);

  useEffect(() => {
    const fetchEmpresasYPlanes = async () => {
      if (!id_tenant) return;
      try {
        const [empresas, planesData] = await Promise.all([
          getEmpresas(),
          getPlanes()
        ]);
        setPlanes(planesData || []);
        const empresasLigadas = empresas.filter(e => String(e.id_tenant) === String(id_tenant));
        setEmpresasTenant(empresasLigadas);
      } catch (e) {
        setEmpresasTenant([]);
        setPlanes([]);
      }
    };
    fetchEmpresasYPlanes();
  }, [id_tenant]);

  // Empresa principal del tenant (la primera empresa del tenant)
  const empresaPrincipal = empresasTenant[0];

  // Función para capitalizar la primera letra del plan
  const capitalize = (str) =>
    typeof str === "string" && str.length > 0
      ? str.charAt(0).toUpperCase() + str.slice(1)
      : str;

  // Busca el plan por id_tenant y retorna la descripción capitalizada
  const getPlanDescripcion = (planId) => {
    const plan = planes.find(p => String(p.id_plan) === String(planId));
    return plan ? capitalize(plan.descripcion_plan) : "Desconocido";
  };

  // Construye el array de teams: primero la empresa principal, luego otras empresas, luego las opciones por defecto
  const teams = [
    ...(empresaPrincipal
      ? [{
        name: empresaPrincipal.razonSocial || empresaPrincipal.nombreComercial || "Empresa",
        logo: empresaPrincipal.logotipo || GalleryVerticalEnd,
        plan: getPlanDescripcion(plan_pago), // <-- usa el plan del usuario
      }]
      : []),
    ...empresasTenant
      .slice(1)
      .map(emp => ({
        name: emp.razonSocial || emp.nombreComercial || "Empresa",
        logo: emp.logotipo || GalleryVerticalEnd,
        plan: getPlanDescripcion(plan_pago), // <-- usa el plan del usuario
      })),
    ...SIDEBAR_DATA.teams,
  ];

  // El primer equipo será la empresa principal seleccionada por defecto
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={teams}
          nameClassName="truncate max-w-[120px] md:max-w-[180px] block"
        />
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