export default {
  user: {
    required: ["Rol (id_rol)", "Usuario (usua)", "Contraseña (contra)", "Estado (estado_usuario)"],
    optional: [],
    developerExtras: ["Empresa (id_empresa)", "Plan (plan_pago)", "Fecha de pago (fecha_pago)"],
    notes: "Los extras solo aplican para el rol desarrollador."
  },
  product: {
    // Basado en tu modal “Nuevo Producto” (captura adjunta)
    required: ["Descripción", "Categoría", "Subcategoría", "Marca", "Precio", "Unidad de Medida", "Estado"],
    optional: [],
    developerExtras: [],
    notes: "Estos son los campos visibles en la pantalla actual de producto."
  },
    category: {
    required: ["Nombre de Categoría (nom_categoria)"],
    optional: [],
    developerExtras: [],
    notes: "Solo se requiere el nombre de la categoría."
  },
  subcategory: {
    required: ["Categoría (id_categoria)", "Nombre de la subcategoría (nom_subcat)"],
    optional: [],
    developerExtras: [],
    notes: "Debe seleccionar una categoría y definir el nombre de la subcategoría."
  },
  brand: {
    required: ["Marca (nom_marca)"],
    optional: [],
    developerExtras: [],
    notes: "Solo se requiere el nombre de la marca."
  },
    sale: {
    required: [
      "Productos (detalle: código, nombre, cantidad, precio, subtotal)",
      "Tipo de comprobante (boleta, factura, nota de venta)",
      "Cliente (nombre o selección de cliente)",
      "Método de pago",
      "Monto recibido"
    ],
    optional: [
      "Observación",
      "Descuento",
      "Cambio",
      "Total pagado",
      "Faltante"
    ],
    developerExtras: [],
    notes: "El flujo de venta es por pasos: selección de productos, comprobante y pago, confirmación. El comprobante impreso incluye QR, totales y desglose de productos."
  },
  provider: {
    required: [
      "Documento (DNI o RUC)",
      "Ubicación",
    ],
    optional: [
      "Teléfono",
      "Dirección",
      "Email"
    ],
    developerExtras: [],
    notes: "Para registrar un proveedor se requiere documento y ubicación. Teléfono, dirección y email son opcionales."
  },
  seller: {
    required: [
      "DNI",
      "Usuario",
      "Nombre",
      "Apellidos",
      "Estado",
      "Teléfono"
    ],
    optional: [],
    developerExtras: [],
    notes: "Todos los campos son obligatorios para registrar un vendedor."
  },
  client: {
    required: [
      "Tipo de documento (DNI o RUC)",
      "Número de documento",
      "Nombres o Razón social",
      "Dirección"
    ],
    optional: [],
    developerExtras: [],
    notes: "El formulario de cliente permite registrar personas naturales (DNI, nombres, apellidos, dirección) o empresas (RUC, razón social, dirección)."
  },
  role: {
    required: [
      "Nombre del rol (nom_rol)",
      "Estado (estado_rol)"
    ],
    optional: [],
    developerExtras: [],
    notes: "Solo se requiere nombre y estado para crear un rol."
  },
  branch: {
    required: [
      "Vendedor (id_vendedor)",
      "Nombre de la sucursal (nom_sucursal)",
      "Ubicación",
      "Estado"
    ],
    optional: [],
    developerExtras: [],
    notes: "Todos los campos son obligatorios para registrar una sucursal."
  },
  warehouse: {
    required: [
      "Nombre Almacén (nom_almacen)",
      "Sucursal (id_sucursal)",
      "Ubicación",
      "Estado"
    ],
    optional: [],
    developerExtras: [],
    notes: "Todos los campos son obligatorios para registrar un almacén."
  },
  remission: {
    required: [
      "Número de guía",
      "Fecha",
      "Hora",
      "Cliente",
      "DNI/RUC",
      "Sucursal",
      "Cantidad de paquetes",
      "Peso Kg",
      "Transporte",
      "Código Transporte",
      "Ubigeo partida/destino",
      "Glosa",
      "Dirección partida",
      "Dirección destino",
      "Productos"
    ],
    optional: [
      "Observación"
    ],
    developerExtras: [],
    notes: "La guía de remisión requiere datos de cliente, transporte, sucursal y productos. Observación es opcional."
  },
  warehouseNote: {
    required: [
      "Almacén Origen",
      "Almacén Destino",
      "Proveedor/Destinatario",
      "RUC/Documento",
      "Fecha Documento",
      "Número",
      "Glosa",
      "Nombre de nota",
      "Productos"
    ],
    optional: [
      "Observación"
    ],
    developerExtras: [],
    notes: "La nota de almacén requiere datos de almacén, proveedor/destinatario y productos. Observación es opcional."
  },
  logs: {
    required: [
      "Fecha/Hora",
      "Usuario",
      "Acción",
      "Descripción",
      "IP"
    ],
    optional: [],
    developerExtras: [],
    notes: "Solo se pueden visualizar los registros, no editar ni eliminar."
  },
  homepageByRole: {
    required: [
      "Rol",
      "Página de inicio"
    ],
    optional: [],
    developerExtras: [],
    notes: "Solo se puede asignar la página de inicio por rol. No se pueden crear, editar ni eliminar páginas desde aquí."
  },
  permissionsByRole: {
    required: [
      "Rol",
      "Permisos: Ver, Agregar, Editar, Eliminar, Desactivar, Generar"
    ],
    optional: [],
    developerExtras: [],
    notes: "Solo se pueden asignar permisos a cada rol. No se pueden crear, editar ni eliminar módulos desde aquí."
  },
    dashboard: {
    required: [
      "Total Ventas",
      "Nuevos Clientes",
      "Productos Vendidos",
      "Notas Pendientes",
      "Stock Crítico",
      "Rendimiento por sucursal",
      "Promedio general"
    ],
    optional: [
      "Comparativo vs. periodo anterior",
      "Selección de sucursal",
      "Selección de periodo (24h, semana, mes, año)"
    ],
    developerExtras: [],
    notes: "El Panel Principal muestra KPIs de ventas, clientes, productos vendidos, pendientes y stock crítico. Permite filtrar por sucursal y periodo. No es editable, solo visualización."
  },
    salesAnalysis: {
    required: [
      "Total de Ganancias",
      "Total de Productos Vendidos",
      "Producto Más Vendido",
      "Sucursal con Mayor Rendimiento"
    ],
    optional: [
      "Comparativo vs. periodo anterior",
      "Meta anual",
      "Porcentaje de avance",
      "Filtros por sucursal y periodo (semana, mes, año)"
    ],
    developerExtras: [],
    notes: "El módulo de Análisis de ventas muestra KPIs clave: ganancias, productos vendidos, producto top y sucursal top. Permite comparar con periodos anteriores y filtrar por sucursal y rango de fechas. Es solo visualización, no editable."
  },
  navigation: {
    required: [
      "Breadcrumb (ruta de navegación)",
      "Switch de modo oscuro",
      "Sidebar (menú lateral)",
      "Menú de usuario (NavUser)"
    ],
    optional: [
      "Colapsar sidebar en móvil",
      "Acceso rápido a módulos según permisos y plan"
    ],
    developerExtras: [
      "Sección Desarrollador (solo para usuarios con rol desarrollador): Desarrollo, Módulos, Permisos Globales"
    ],
    notes: `
Breadcrumb: Componente que muestra la ruta actual (ejemplo: Inicio > Reportes), siempre visible en la parte superior, permite volver a módulos anteriores con un clic.
Switch de modo oscuro: Permite alternar entre tema claro y oscuro, ubicado junto al breadcrumb, afecta todo el sistema excepto la landing.
Sidebar: Menú lateral con módulos y submódulos principales, estructura dinámica según permisos y plan. Ejemplo:
- General: Dashboard (/inicio), Productos (/productos), Ventas (Nueva venta)
- Reportes: Análisis de ventas, Libro de ventas
- Terceros: Clientes, Empleados, Proveedores
- Logística: Kárdex (Nota de Almacén, Guía Remisión), Almacenes, Sucursal
- Configuración: Usuarios, Roles y permisos, Logs, Negocio, Llamadas
- Desarrollador: (solo visible para desarrollador) Desarrollo, Módulos, Permisos Globales. Estos exponen configuraciones críticas y herramientas avanzadas, no disponibles para usuarios estándar.
Menú de usuario (NavUser): En la parte inferior del sidebar o barra superior, clic en avatar/nombre. Opciones: Cuenta, Facturación, Notificaciones, Cerrar sesión.
¿Cómo llegar?: Breadcrumb y switch siempre arriba; sidebar a la izquierda; menú usuario abajo en sidebar o arriba.
Resumen: La navegación es clara y contextual. El sidebar muestra módulos según permisos/plan. Los módulos de desarrollador solo aparecen para ese rol. El menú usuario permite gestionar cuenta y cerrar sesión. Breadcrumb y switch mejoran la experiencia y orientación.

Adicional: La mayoría de los módulos permiten eliminar y editar registros (según permisos del usuario). Además, cada módulo cuenta con su propio repertorio de filtros para facilitar la búsqueda y gestión de la información.
`
  },
    salesRegisterExport: {
    required: [
      "Sucursal",
      "Mes",
      "Año",
      "Tipo de Comprobante"
    ],
    optional: [],
    developerExtras: [],
    notes: "El formulario para exportar el registro de ventas requiere seleccionar sucursal, mes, año y tipo de comprobante. Permite exportar los datos filtrados a Excel."
  },
  salesRegister: {
    required: [
      "Sucursal (filtro)",
      "Fecha (filtro por rango)",
      "Tipo de comprobante (filtro)",
      "Listado de ventas: N° correlativo, Fecha de emisión, Documento, Cliente, Comprobante, Monto, IGV, Total"
    ],
    optional: [
      "Exportar a Excel",
      "Paginación",
      "Total general"
    ],
    developerExtras: [],
    notes: "El Libro Registro de Ventas muestra los registros oficiales de ventas realizados por la empresa, con filtros por sucursal, fecha y tipo de comprobante. Permite exportar a Excel y visualizar totales."
  },
    kardex: {
    required: [
      "Almacén (filtro)",
      "Código de producto (filtro)",
      "Descripción (filtro)",
      "Línea/Categoría (filtro)",
      "Sub-línea/Subcategoría (filtro)",
      "Marca (filtro)",
      "Inventario de productos: Código, Descripción, Marca, Stock, Estado, Unidad de Medida"
    ],
    optional: [
      "Exportar PDF",
      "Reporte mensual",
      "Reporte semanal",
      "Actualizar listado"
    ],
    developerExtras: [],
    notes: "El Kardex de Movimientos permite consultar el inventario de productos por almacén, con filtros avanzados por código, descripción, línea, sub-línea y marca. Muestra el stock y estado (crítico, bajo, normal, alto) de cada producto. Permite exportar reportes y actualizar la vista. Es identificado también como 'inventario', 'movimientos de almacén' o 'stock'."
  },
    historico: {
    required: [
      "Producto seleccionado (desde Kardex)",
      "Almacén",
      "Rango de fechas",
      "Transacciones: Fecha, Hora, Documento, Nombre, Entra, Sale, Stock, Precio, Glosa"
    ],
    optional: [
      "Stock inicial",
      "Stock actual",
      "Precio unitario",
      "Valor total",
      "Entradas y salidas acumuladas",
      "Rotación de inventario",
      "Velocidad de venta",
      "Margen de ganancia",
      "Próximo pedido",
      "Exportar PDF"
    ],
    developerExtras: [],
    notes: "El histórico de producto se accede desde el Kardex haciendo clic en el registro de un producto. Permite ver todas las transacciones (entradas, salidas, ventas, compras) asociadas al producto en el almacén seleccionado, con análisis financiero y de inventario. Incluye filtros por fecha y almacén, y opciones para exportar el historial."
  },
    clientDetail: {
    required: [
      "Información de contacto (email, teléfono, dirección)",
      "Información adicional (fecha de registro, estado)",
      "Historial de compras (últimas transacciones realizadas)",
      "Historial de cambios (registro de modificaciones)"
    ],
    optional: [
      "Estado del cliente (activo/inactivo)",
      "Tipo de documento y número",
      "Nombre o razón social"
    ],
    developerExtras: [],
    notes: "El detalle del cliente muestra pestañas para información de contacto, información adicional, historial de compras y registro de cambios. Si no hay datos, se indica que no hay información registrada. Se accede desde la tabla/listado de clientes haciendo clic en el botón de ver o detalle."
  },
  salesManagement: {
    required: [
      "Listado de ventas con filtros avanzados (número de comprobante, cliente, tipo de comprobante, sucursal, estado, rango de fechas)",
      "KPIs: Total Ventas, Total Efectivo, Total Pago Electrónico, Cantidad de Ventas",
      "Tabla con columnas: Serie/Número, Tipo de comprobante, Cliente, Fecha de emisión, IGV, Total, Cajero, Estado",
      "Icono de opciones (anular venta, generar PDF)",
      "Icono de impresión (descargar voucher PDF o imprimir voucher)",
      "Detalle de venta al hacer clic en una fila"
    ],
    optional: [
      "Botón para registrar nueva venta",
      "Paginación",
      "Exportar a Excel"
    ],
    developerExtras: [],
    notes: `
La gestión de ventas permite visualizar, filtrar y administrar todas las ventas de manera centralizada. Los KPIs muestran totales y cantidades relevantes. Cada venta registrada tiene dos iconos de acción:
- Opciones (engranaje): permite anular la venta o generar el PDF del comprobante.
- Impresión (impresora): permite descargar el voucher en formato PDF o imprimirlo directamente. Para imprimir, es necesario tener una impresora térmica conectada a la laptop o PC.
Al hacer clic en una venta, se abre el detalle completo de la venta, mostrando comprobante, cliente, fecha, productos/servicios, información de pago, resumen de totales y observaciones.
`
  },
};