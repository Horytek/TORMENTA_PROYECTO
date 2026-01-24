import {
  Home, Tags, LineChart, FileBarChart2, User, Users, Warehouse, Building2, UserCog, Bot, SquareTerminal, Settings2, BookOpen, Database, ClipboardCheck
} from "lucide-react";

/**
 * Static navigation structure.
 * The filtering is now done dynamically based on user permissions from the database.
 * `resourceKey` maps to module/submodule routes in the permissions table.
 * Developer-only sections use `developerOnly: true`.
 */
export const NAVIGATION_DATA = {
  dashboard: {
    title: "Dashboard",
    url: "/inicio",
    icon: Home,
    resourceKey: "/inicio" // Always visible if user has any permissions
  },

  operaciones: {
    title: "Operaciones",
    items: [
      { title: "Ventas", url: "/ventas", icon: LineChart, description: "Gestión de ventas y caja", resourceKey: "/ventas" },
      { title: "Nueva Venta", url: "/ventas/registro_venta", icon: LineChart, description: "Punto de venta (POS)", resourceKey: "/ventas" },
      { title: "Guías de Remisión", url: "/almacen/guia_remision", icon: FileBarChart2, description: "Traslado de mercadería", resourceKey: "/guia_remision" },
    ]
  },

  inventario: {
    title: "Inventario",
    items: [
      { title: "Productos", url: "/productos", icon: Tags, description: "Catálogo de productos", resourceKey: "/productos" },
      { title: "Kárdex & Almacén", url: "/almacen", icon: Warehouse, description: "Movimientos y stock", resourceKey: "/almacen" },
      { title: "Nota de Almacén", url: "/nota_almacen", icon: Warehouse, description: "Ingresos y salidas manuales", resourceKey: "/nota_almacen" },
      { title: "Solicitud Inventario", url: "/inventario/solicitud", icon: ClipboardCheck, description: "Registro de lote", resourceKey: "/inventario/solicitud" },
      { title: "Verificación Inventario", url: "/inventario/verificacion", icon: ClipboardCheck, description: "Aprobar movimientos", resourceKey: "/inventario/verificacion" },
      { title: "Almacenes Físicos", url: "/almacenG", icon: Warehouse, description: "Gestión de ubicaciones", resourceKey: "/almacenG" },
      { title: "Sucursales", url: "/sucursal", icon: Building2, description: "Sedes y puntos de venta", resourceKey: "/sucursal" },
    ]
  },

  terceros: {
    title: "Terceros",
    items: [
      { title: "Clientes", url: "/clientes", icon: User, description: "Directorio de clientes", resourceKey: "/clientes" },
      { title: "Proveedores", url: "/proveedores", icon: Users, description: "Gestión de abastecimiento", resourceKey: "/proveedores" },
      { title: "Empleados", url: "/empleados", icon: Users, description: "Personal y accesos", resourceKey: "/empleados" },
    ]
  },

  gestion: {
    title: "Gestión",
    items: [
      { title: "Reportes", url: "/reportes", icon: FileBarChart2, description: "Análisis y estadísticas", resourceKey: "/reportes" },
      { title: "Libro de Ventas", url: "/ventas/libro_ventas", icon: FileBarChart2, description: "Registro contable", resourceKey: "/libro_ventas" },
      // Gestor Contenidos Submodules
      { title: "Tonalidades", url: "/gestor-contenidos/tonalidades", icon: Tags, description: "Gestión de colores/variantes", resourceKey: "/gestor-contenidos/tonalidades" },
      { title: "Tallas", url: "/gestor-contenidos/tallas", icon: Tags, description: "Gestión de dimensiones", resourceKey: "/gestor-contenidos/tallas" },

      // These use submodule routes from the database
      { title: "Usuarios (Admin)", url: "/configuracion/usuarios", icon: UserCog, description: "Administración de usuarios", resourceKey: "/configuracion/usuarios" },
      { title: "Roles y Permisos", url: "/configuracion/roles", icon: Users, description: "Control de accesos", resourceKey: "/configuracion/roles" },
      { title: "Logs de Sistema", url: "/configuracion/logs", icon: FileBarChart2, description: "Auditoría de acciones", resourceKey: "/configuracion/logs" },
      { title: "Config. Negocio", url: "/configuracion/negocio", icon: Tags, description: "Datos de la empresa", resourceKey: "/configuracion/negocio" },
    ]
  },

  // New Section or integrated? Let's Integrate Inventario into Inventario section or create new if distinct?
  // Existing Inventario section has "Verificación Inventario" already at line 34.
  // Wait, I see "Verificación Inventario" at line 34.
  // I need to add "Solicitud Inventario" there too.

  inventario_avanzado: {
    // Merging into existing Inventario section (below) via replacement plan
  },

  desarrollador: {
    title: "Desarrollador",
    icon: Bot,
    developerOnly: true, // Only visible for developer role (id: 10)
    items: [
      { title: "Panel Desarrollo", url: "/desarrollador", icon: Bot, resourceKey: "/desarrollador" },
      { title: "Gestor Módulos", url: "/modulos", icon: SquareTerminal, resourceKey: "/modulos" },
      { title: "Permisos Globales", url: "/desarrollador/permisos-globales", icon: Settings2, resourceKey: "/desarrollador" },
      { title: "Limpiador DB", url: "/desarrollador/database-cleaner", icon: Database, resourceKey: "/desarrollador" },
      { title: "Consulta RUC/DNI", url: "/sunat", icon: BookOpen, resourceKey: "/sunat" },
    ]
  }
};
