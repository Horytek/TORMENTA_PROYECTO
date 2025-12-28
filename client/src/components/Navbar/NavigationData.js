import {
  Home, Tags, LineChart, FileBarChart2, User, Users, Warehouse, Building2, UserCog, Phone, Bot, SquareTerminal, Settings2, BookOpen, Frame, PieChart, Map
} from "lucide-react";

export const NAVIGATION_DATA = {
  dashboard: {
    title: "Dashboard",
    url: "/inicio",
    icon: Home,
    allowedRoles: [1, 2, 3, 10]
  },

  operaciones: {
    title: "Operaciones",
    allowedRoles: [1, 3],
    items: [
      { title: "Ventas", url: "/ventas", icon: LineChart, description: "Gestión de ventas y caja" },
      { title: "Nueva Venta", url: "/ventas/registro_venta", icon: LineChart, description: "Punto de venta (POS)" },
      { title: "Guías de Remisión", url: "/almacen/guia_remision", icon: FileBarChart2, description: "Traslado de mercadería" },
    ]
  },

  inventario: {
    title: "Inventario",
    allowedRoles: [1, 3],
    items: [
      { title: "Productos", url: "/productos", icon: Tags, description: "Catálogo de productos" },
      { title: "Kárdex & Almacén", url: "/almacen", icon: Warehouse, description: "Movimientos y stock" },
      { title: "Nota de Almacén", url: "/nota_almacen", icon: Warehouse, description: "Ingresos y salidas manuales" },
      { title: "Almacenes Físicos", url: "/almacenG", icon: Warehouse, description: "Gestión de ubicaciones" },
      { title: "Sucursales", url: "/sucursal", icon: Building2, description: "Sedes y puntos de venta" },
    ]
  },

  terceros: {
    title: "Terceros",
    allowedRoles: [1, 3],
    items: [
      { title: "Clientes", url: "/clientes", icon: User, description: "Directorio de clientes" },
      { title: "Proveedores", url: "/proveedores", icon: Users, description: "Gestión de abastecimiento" },
      { title: "Empleados", url: "/empleados", icon: Users, description: "Personal y accesos" },
    ]
  },

  gestion: {
    title: "Gestión",
    allowedRoles: [1],
    items: [
      { title: "Reportes", url: "/reportes", icon: FileBarChart2, description: "Análisis y estadísticas" },
      { title: "Libro de Ventas", url: "/ventas/libro_ventas", icon: FileBarChart2, description: "Registro contable" },
      { title: "Usuarios (Admin)", url: "/configuracion/usuarios", icon: UserCog, description: "Administración de usuarios" },
      { title: "Roles y Permisos", url: "/configuracion/roles", icon: Users, description: "Control de accesos" },
      { title: "Logs de Sistema", url: "/configuracion/logs", icon: FileBarChart2, description: "Auditoría de acciones" },
      { title: "Config. Negocio", url: "/configuracion/negocio", icon: Tags, description: "Datos de la empresa" },
    ]
  },

  desarrollador: {
    title: "Desarrollador",
    icon: Bot,
    allowedRoles: [10],
    items: [
      { title: "Panel Desarrollo", url: "/desarrollador", icon: Bot },
      { title: "Gestor Módulos", url: "/modulos", icon: SquareTerminal },
      { title: "Permisos Globales", url: "/desarrollador/permisos-globales", icon: Settings2 },
      { title: "Consulta RUC/DNI", url: "/sunat", icon: BookOpen },
    ]
  }
};
