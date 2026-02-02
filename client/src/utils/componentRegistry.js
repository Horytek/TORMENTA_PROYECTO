import React, { lazy } from 'react';

// Import existing modules for hybrid support
import { moduleComponentMap, submoduleComponentMap } from './componentMapping';

// Lazy load components
const Inicio = lazy(() => import('@/layouts/Inicio/Inicio'));
const Ventas = lazy(() => import('@/pages/Ventas/Venta/Ventas'));
const Registro_venta = lazy(() => import('@/pages/Ventas/Registro_Venta/RegistroVentaNew'));
const LibroVentas = lazy(() => import('@/pages/Ventas/Reporte_Venta/Libro_Ventas'));
const Empleados = lazy(() => import('@/pages/Empleados/Empleados'));
const Sunat = lazy(() => import('@/pages/Sunat/Sunat'));
const Proveedores = lazy(() => import('@/pages/Proveedores/Proveedores'));
const ProductosWrapper = lazy(() => import('@/pages/Productos/ProductosWrapper'));
const Almacenes = lazy(() => import('@/pages/AlmacenG/AlmacenG'));
const Almacen = lazy(() => import('@/pages/Kardex/Kardex'));
const Historico = lazy(() => import('@/pages/Kardex/Historico/Historico'));
const Nota_Almacen = lazy(() => import('@/pages/Nota_Almacen/Nota_Almacen'));
const Nueva_Nota_Ingreso = lazy(() => import('@/pages/Nota_Almacen/registration/RegistroNota'));
const Nueva_Nota_Salida = lazy(() => import('@/pages/Nota_Almacen/registration/RegistroNota'));
const Guia_Remision = lazy(() => import('@/pages/Guia_Remision/Guia_Remision'));
const RegistroGuia = lazy(() => import('@/pages/Guia_Remision/Registro_Guia/Registro_Guia'));
const ReporteVentas = lazy(() => import('@/pages/ReporteVentas/ReporteVentas'));
const Usuarios = lazy(() => import('@/pages/Usuarios/Usuarios'));
const RolesWrapper = lazy(() => import('@/pages/Roles/RolesWrapper'));
const Sucursal = lazy(() => import('@/pages/Sucursal/Sucursal'));
const Clientes = lazy(() => import('@/pages/Clientes/Clientes'));
const Modulos = lazy(() => import('@/pages/Modulos/Modulos'));

// Registry of "Lego Blocks" (Code) mapped to Logical Keys (Routes/Slugs)
// This decouples the Frontend from Database IDs.
export const COMPONENT_REGISTRY = {
    // Main Modules
    '/inicio': Inicio,
    '/productos': ProductosWrapper,
    '/almacenG': Almacenes, // Note: DB route might be /almacenG based on previous reads
    '/clientes': Clientes,
    '/empleados': Empleados,
    '/ventas': Ventas,
    '/reportes': ReporteVentas,
    '/sucursal': Sucursal,
    '/proveedores': Proveedores,
    '/sunat': Sunat,
    '/kardex': Almacen, // Used to be ID 10 "Almacen"
    '/almacen': Almacen, // Alternative route for Almacen module

    // Submodules
    '/ventas/registro': Registro_venta,
    '/ventas/libro': LibroVentas,
    '/configuracion/usuarios': Usuarios, // Assuming route structure
    '/configuracion/roles': RolesWrapper,
    '/configuracion/modulos': Modulos,
    '/configuracion/atributos': lazy(() => import('@/pages/Configuracion/Attributes/AttributesPage')),

    // Note: Some routes might need normalization or checking against DB values.
    // We add common variations just in case.
    '/almacen/nota': Nota_Almacen,
    '/almacen/nota/ingreso': Nueva_Nota_Ingreso,
    '/almacen/nota/salida': Nueva_Nota_Salida,
    '/almacen/historico': Historico,
    '/guia_remision': Guia_Remision,
    '/guia_remision/registro': RegistroGuia,
    '/nota_almacen': Nota_Almacen,

    // Gestor Contenidos
    '/gestor-contenidos/tonalidades': lazy(() => import('@/pages/GestorContenidos/Tonalidades')),
    '/gestor-contenidos/tallas': lazy(() => import('@/pages/GestorContenidos/Tallas')),
    '/gestor-contenidos/variantes': lazy(() => import('@/pages/GestorContenidos/Variantes/VariantesWrapper')),

    // Inventario
    '/inventario/solicitud': lazy(() => import('@/pages/SolicitudInventario')),
    '/inventario/verificacion': lazy(() => import('@/pages/VerificacionInventario')),
};

// Re-export legacy maps for hybrid support in Dashboard
export { moduleComponentMap, submoduleComponentMap };

// Export available routes key list for Auto-Routing UI
export const AVAILABLE_ROUTES = Object.keys(COMPONENT_REGISTRY).sort();
