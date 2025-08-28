import React, { lazy } from 'react';

const Inicio = lazy(() => import('@/layouts/Inicio/Inicio'));
const Ventas = lazy(() => import('@/pages/Ventas/Venta/Ventas'));
const Registro_venta = lazy(() => import('@/pages/Ventas/Registro_Venta/Registro_venta'));
const LibroVentas = lazy(() => import('@/pages/Ventas/Reporte_Venta/Libro_Ventas'));
const Empleados = lazy(() => import('@/pages/Empleados/Empleados'));
const Sunat = lazy(() => import('@/pages/Sunat/Sunat'));
const Proveedores = lazy(() => import('@/pages/Proveedores/Proveedores'));
const Productos = lazy(() => import('@/pages/Productos/Productos'));
const ProductosWrapper = lazy(() => import('@/pages/Productos/ProductosWrapper'));
const Almacenes = lazy(() => import('@/pages/AlmacenG/AlmacenG'));
const Marcas = lazy(() => import('@/pages/Marcas/Marcas'));
const Categorias = lazy(() => import('@/pages/Categorias/Categorias'));
const Subcategorias = lazy(() => import('@/pages/Subcategorias/Subcategorias'));
const Almacen = lazy(() => import('@/pages/Almacen/Almacén'));
const Historico = lazy(() => import('@/pages/Almacen/Kardex/Historico/Historico'));
const Nota_Ingreso = lazy(() => import('@/pages/Almacen/Nota_Ingreso/Nota_ingreso'));
const Nueva_Nota_Ingreso = lazy(() => import('@/pages/Almacen/Nota_Ingreso/Registro_Ingreso/Registro_ingreso'));
const Nota_Salida = lazy(() => import('@/pages/Almacen/Nota_Salida/Nota_salida'));
const Nueva_Nota_Salida = lazy(() => import('@/pages/Almacen/Nota_Salida/Nueva_Nota_Salida/Nueva_Nota_salida'));
const Guia_Remision = lazy(() => import('@/pages/Almacen/Guia_Remision/Guia_Remision'));
const RegistroGuia = lazy(() => import('@/pages/Almacen/Guia_Remision/Registro_Guia/Registro_Guia'));
const ReporteVentas = lazy(() => import('@/pages/ReporteVentas/ReporteVentas'));
const Usuarios = lazy(() => import('@/pages/Usuarios/Usuarios'));
const Roles = lazy(() => import('@/pages/Roles/Roles'));
const Global = lazy(() => import('@/pages/Global/Global'));
const Sucursal = lazy(() => import('@/pages/Sucursal/Sucursal'));
const Clientes = lazy(() => import('@/pages/Clientes/Clientes'));
const Permisos = lazy(() => import('@/pages/Roles/Roles'));
const Modulos = lazy(() => import('@/pages/Modulos/Modulos'));


const moduleComponentMap = {
  1: Inicio,
  2: ProductosWrapper,
  3: Almacenes,
  4: Clientes,
  5: Empleados,
  6: Ventas,
  7: ReporteVentas,
  8: Sucursal,
  9: null, 
  10: Almacen,
  12: Proveedores,
  13: Sunat
  // proximo mapeo de modulos
};

const submoduleComponentMap = {
  // 1: Marcas, // Ahora es parte de ProductosWrapper
  // 2: Categorias, // Ahora es parte de ProductosWrapper
  // 3: Subcategorias, // Ahora es parte de ProductosWrapper
  4: Registro_venta,
  5: LibroVentas,
  6: Usuarios,
  7: Roles,
  8: Modulos,
  10: Nota_Ingreso,
  11: Nota_Salida,
  12: Nueva_Nota_Salida,
  13: Guia_Remision,
  14: RegistroGuia,
  15: Nueva_Nota_Ingreso,
  16: Historico,
  // proximo mapeo de submodulos
};



export { moduleComponentMap, submoduleComponentMap };