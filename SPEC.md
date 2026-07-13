# SPEC.md — Horytek/TORMENTA ERP & POS

> **Objetivo:** Documentación estructurada tipo Spec-Driven Development (SDD) para consumo de agentes IA.
> Toda la información aquí contenida se deriva del análisis del código fuente en `client/src/`.

---

## 1. ARQUITECTURA GENERAL

### 1.1 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend Framework | React 18+ (Vite), React Router v6 |
| UI Components | @heroui/react (HeroUI) — en transición a shadcn/ui |
| State Management | Zustand (`useStore`), React Context |
| HTTP Client | Axios con interceptores (Bearer token en IndexedDB) |
| Forms | react-hook-form (mixto con Controller) |
| Notifications | react-hot-toast |
| Charts | Recharts (probable) |
| Tables | HeroUI Table con pagination custom |
| Auth | Cookie httpOnly + JWT Bearer token |
| Styling | TailwindCSS 4 + CSS custom properties |
| PDF Generation | jsPDF + html2canvas |
| Excel Import/Export | xlsx (SheetJS) |

### 1.2 Estructura de Rutas (`src/main.jsx`)

```
/ (Login)
  /status
  /landing/* (Landing pages públicas)
  /express/* (POS Express — standalone)
    /express/dashboard
    /express/pos
    /express/inventory
    /express/users
    /express/subscription
    /express/settings
    /express/history
  /* (Protected — Dashboard + dynamic routes)
```

### 1.3 Sistema de Routing Dinámico

El `Dashboard` (`layouts/Dashboard/Dashboard.jsx`) obtiene módulos desde `getModulosConSubmodulos()` (`services/rutas.services.js`).
Las rutas se renderizan dinámicamente desde el backend según los permisos del usuario.

**Ruta especial:** `id_submodulo 10 u 11` → forza `/nota_almacen` (override para Nota de Almacen).

**Lazy loading:** Todas las páginas usan `lazy()` + `Suspense`.

---

## 2. AUTENTICACIÓN Y USUARIOS

### 2.1 AuthProvider (`context/Auth/AuthProvider.jsx`)

Módulo que envuelve toda la app. Gestiona:
- `login(credentials)` → POST `/auth/login`
- `logout()`
- `isAuthenticated` (boolean)
- `user` (objeto con datos del usuario logueado)
- `sendAuthCode()` → envío de código OTP para activación de cuentas

### 2.2 useUserStore (`store/useStore.js`)

**Zustand store** con campos legacy y nuevos:

```js
{
  // Legacy (usan en componentes)
  nombre: "",       // username
  usuario: "",      // username
  rol: "",          // roleId numérico
  sur: "",          // nombre sucursal
  almacen: "",
  id_tenant: "",
  id_empresa: "",
  plan_pago: "",

  // Normalizado
  user: { id, username, roleId, sucursal, id_tenant, id_empresa, plan_pago },

  // Permisos (nuevo sistema capability-based)
  permissions: [],           // array legacy [{id_modulo, id_submodulo, ver, crear, editar, eliminar, generar, desactivar}]
  capabilities: new Set(),   // Set<string> nuevo: "productos.view", "productos.create", ...
  globalModuleConfigs: [],   // configs con active_actions por módulo

  // Setters
  setUserRaw(raw)            // normaliza y asigna todo
  setCapabilities(capabilities)  // acepta Array o Set
  setGlobalModuleConfigs(configs)
  clearUser()
}
```

### 2.3 Permisos — RoutePermission (`routes.jsx`)

**Dos sistemas coexistiendo:**

1. **Sistema Legacy** (por `idModulo`/`idSubmodulo`): busca en `permissions[]` por `id_modulo` + `id_submodulo`, verifica `ver=1`, luego `crear/editar/eliminar/generar/desactivar` contra `active_actions`.

2. **Sistema Capability** (por `capability`): verifica `capabilities.has("${capability}.view")`, y deriva create/edit/delete/generate/deactivate.

```jsx
// Uso en componentes:
<RoutePermission idModulo={5} idSubmodulo={null}>
  {children}
</RoutePermission>

// Nuevo (preferido):
<RoutePermission capability="productos">
  {children}
</RoutePermission>
```

**Excepción:** `rol === 10` (Desarrollo) → todos los permisos siempre `true`.

### 2.4 API Axios (`api/axios.js`)

```js
baseURL: VITE_API_URL + "/api" || window.location.origin + "/api"
withCredentials: true  // cookies HTTPONLY
headers: { "Content-Type": "application/json" }
Interceptor: adjunta Bearer token desde IndexedDB (getToken from utils/authStorage)
```

---

## 3. MÓDULO: VENTAS

### 3.1 Submódulo: Lista de Ventas

**Archivo principal:** `pages/Ventas/Venta/Ventas.jsx`

#### Props / Estado
- `filters`: `{ comprobanteSeleccionado, sucursalSeleccionado, fecha_i, fecha_e, razon }`
- `ventas[]`: lista actual de ventas con paginación
- `currentPage`, `totalPages`, `ventasPerPage`
- `totalRecaudado`, `totalEfectivo`, `totalPagoElectronico`
- `ventasOnline[]`: ventas desde `tesis_db` (canal online)
- `SelectedRowId`: ID de venta seleccionada para acciones
- `modalOpen`, `deleteOptionSelected`, `confirmDeleteModalOpen`

#### Hooks de Datos (`@/services/ventas.services.js`)
```js
useVentasData(filters)        // ventas locales con paginación + stats
useVentasOnlineData(filters)  // ventas del canal online
useSucursalData()             // sucursales del usuario
```

#### Componentes Hijos
- `VentasTable.jsx` — tabla principal de ventas locales
- `VentasOnlineTable.jsx` — tabla de ventas online (tesis_db)
- `FiltrosVentas.jsx` — barra de filtros (comprobante, sucursal, rango fechas, razón social)
- `VentasStats.jsx` — cards con totales (recaudado, efectivo, electrónico)
- `StatsFilters.jsx` — filtros de stats
- `InventoryCalendar/InventoryCalendar.jsx` — calendario de inventario
- `InventoryCalendar/DayDetailDrawer.jsx` — drawer de detalle del día
- `Modals/OptionsModal.jsx` — modal de opciones por fila (ver, editar, anular, imprimir)
- `Modals/ConfirmationModal.jsx` — confirmación de anulación
- `Modals/IntercambioModal.jsx` — gestión de intercambios

#### API Endpoints (services/ventas.services.js + api/api.ventas.js)
```js
getVentasRequest(filters)           // GET /ventas
getVentasOnlineRequest(filters)     // GET /ventas/online
getVentaByIdRequest(id)             // GET /ventas/:id
getClienteVentasRequest()           // GET /clientes/ventas
getComprobanteRequest()             // GET /comprobantes
getProductosVentasRequest({id_sucursal})  // GET /productos/ventas
getSucursalRequest()               // GET /sucursales
addVentaRequest(datosVenta)        // POST /ventas
updateVentaEstadoRequest({id_venta, ...})  // PUT /ventas/:id/estado
deleteVentaRequest(id)             // DELETE /ventas/:id
getNumeroComprobanteRequest()      // GET /ventas/comprobante/next
getLastVentaRequest()              // GET /ventas/last
```

#### Funciones de Negocio (`ventas.services.js`)
```js
handleCobrar(datosVenta, callback, datosVentaSunat, uselessParam, nombreUsuario)
  // 1. Registra venta (addVentaRequest)
  // 2. Si tipo=Boleta|Factura → handleSunat (envío SUNAT)
  // 3. Si SUNAT ok → updateVentaEstadoRequest con estado_sunat=1
  // 4. Toast según resultado (éxito total / éxito BD / error)

handleSunat(datosVenta, details, showSuccessToast)
  // POST /sunat/cpe/invoice/emit
  // Retorna boolean

handleSunatPDF(venta, detalles, nombreUsuario)
  // POST /sunat/cpe/invoice/pdf → blob PDF
  // Calcula: totalGravada = detalles/(1.18), IGV=18%, total

handleGuardarCliente(clienteData)
  // POST /clientes

anularVentaEnSunatB(venta)
  // POST /sunat/cpe/voided/emit (Comunicación de Baja)

handleSunatMultiple(ventas[])
  // Itera handleSunat sobre array de ventas
```

#### Permisos
- `hasPermission`, `hasEditPermission`, `hasDeletePermission`, `hasGeneratePermission`

---

### 3.2 Submódulo: Registro de Ventas (POS)

**Archivo principal:** `pages/Ventas/Registro_Venta/RegistroVentaNew.jsx`
**Hook principal:** `hooks/usePOS.js`

#### Arquitectura del POS

```
RegistroVentaNew (layout 2 columnas: catálogo 65% | carrito 35%)
├── ProductCatalog (catálogo con búsqueda + filtro categoría)
│   └── VariantSelectionModal (cuando producto tiene variantes)
└── POSCart (carrito con gestión de pagos)
    └── PaymentModal (métodos de pago múltiples)
```

#### usePOS Hook (`hooks/usePOS.js`)

**Data Sources:**
```js
useProductosData()   // productos filtrados por sucursal del usuario
useClientesData()    // clientes locales + externos (Fusionados)
useSucursalData()    // sucursales disponibles
```

**Estado del Carrito:**
```js
cart[]                    // [{ uniqueKey, codigo, nombre, cantidad, precio, subtotal, stock, id_sku, ... }]
client                   // { id, nombre, documento, direccion, tipo }
documentType             // 'Boleta' | 'Factura' | 'Nota de venta'
comprobanteNumber        // número de comprobante generado
globalFilter             // búsqueda de producto
selectedCategory         // filtro por categoría
empresaData              // datos de empresa para SUNAT
stockOriginal{}          // mapa {codigo: stockOriginal} para validaciones
```

**Funciones Clave:**
```js
addToCart(product)           // Agrega producto al carrito
removeFromCart(uniqueKey)    // Elimina item
updateQuantity(uniqueKey, cantidad, codigo)  // Cambia cantidad (valida stock)
clearCart()                 // Limpia todo
setClient(client)           // Asigna cliente a la venta
setDocumentType(type)       // Cambia tipo de comprobante
generateComprobanteNumber() // Solicita siguiente número
processSale()               // Ejecuta handleCobrar → registra venta + SUNAT
handlePrint(venta)          // Impresión térmica (handlePrintThermal)
```

#### ProductCatalog (`components/ProductCatalog.jsx`)

- Grid de productos con imagen, nombre, precio, stock
- Búsqueda por nombre/código
- Filtro por categoría
- Click en producto → si tiene variantes muestra `VariantSelectionModal`, si no agrega directo al carrito
- `getProductVariants(codigo, includeZero, almacen, id_sucursal)` → determina si necesita selección de variante

#### POSCart (`components/POSCart.jsx`)

- Lista de items del carrito
- Cantidad editable (input numérico con validación de stock)
- Subtotales por item y total general
- Selector de cliente (Autocomplete + AddClientModal para crear nuevo)
- Selector de tipo de comprobante
- Botón "Cobrar" → abre PaymentModal

#### PaymentModal (`components/PaymentModal.jsx`)

- Métodos de pago: EFECTIVO, YAPE, PLIN, VISA, TRANSFERENCIA
- Pagos múltiples (split payment)
- Cálculo automático de vuelto
- Observación libre (Textarea)
- Validación: total pagado >= total venta
- Al confirmar → `processSale()`

#### VariantSelectionModal (`components/Modals/VariantSelectionModal.jsx`)

- Para productos con tonalidad/talla
- Muestra grid de variantes con stock
- Permite seleccionar cantidad por variante
- Al confirmar → agrega cada variante como línea independiente en el carrito

---

### 3.3 Submódulo: Reporte de Ventas (Libro de Ventas)

**Archivo principal:** `pages/Ventas/Reporte_Venta/Libro_Ventas.jsx`

#### Componentes
- `TablaLibro.jsx` — tabla con columnas: Serie, Correlativo, Fecha, Cliente, Doc, Base Imp., IGV, Total, Estado SUNAT
- `FiltroLibro.jsx` — filtros: rango de fechas, tipo comprobante
- `ExportarExcel.jsx` — exportación XLSX del libro

#### API
```js
getLibroVentasSunat(params)  // GET /reportes/libro-ventas (desde reporte.services.js)
```

---

## 4. MÓDULO: PRODUCTOS

### 4.1 Página Principal

**Archivo:** `pages/Productos/Productos.jsx`

#### Estado
```js
data: { productos[], marcas[], categorias[], subcategorias[], tonalidades[], tallas[] }
loaded: boolean
isLoading: boolean
searchTerm: string
showForm: boolean
editItem: producto | null
selectedProducts[]  // bulk actions
activeTab: 'productos' | 'marcas' | 'categorias' | 'subcategorias'
```

#### Funciones
```js
loadData()           // Parallel: productos → marcas/categorias/subcategorias
handleAdd(producto)  // POST /productos
handleEdit(id, fields)  // PUT /productos/:id
handleDelete(id)     // DELETE /productos/:id
handleImportExcel(data)  // POST /productos/import
handleExportExcel()  // Genera XLSX con xlsx (SheetJS)
bulkDelete(ids[])    // DELETE masivo
bulkActivate(ids[])  // PUT con estado_producto: 1
bulkDeactivate(ids[]) // PUT con estado_producto: 0
```

#### Sub-páginas embebidas (via Tabs)
- `Marcas` → `../Marcas/Marcas.jsx`
- `Categorias` → `../Categorias/Categorias.jsx`
- `Subcategorias` → `../Subcategorias/Subcategorias.jsx`
- `ViewVariantsModal` → modal para ver/editar variantes de un producto

#### Servicio (`services/productos.services.js`)
```js
getProductos()                        // GET /productos → transformData()
getProducto(id)                      // GET /productos/:id
addProducto(producto)                 // POST /productos → {success, id_producto}
updateProducto(id, newFields)         // PUT /productos/:id → boolean
deleteProducto(id)                    // DELETE /productos/:id → boolean
importExcel(data)                     // POST /productos/import
bulkUpdateProductos(action, ids[])   // delete|activate|deactivate
getProductVariants(id, includeZero, almacen, id_sucursal)  // GET /productos/:id/variants
registerProductVariants(id_producto, tonalidades[], tallas[])  // POST
getProductAttributes(id)             // GET /productos/:id/attributes → {tonalidades[], tallas[]}
generateSKUs(id_producto, attributes)  // POST /productos/:id/generate-skus
getLastIdProducto()                  // GET /productos/last-id
```

### 4.2 Formulario de Producto

**Archivo:** `pages/Productos/ProductosForm.jsx`

#### Campos
- `nom_producto` (Input, requerido)
- `descripcion` (Textarea)
- `id_categoria` (Select)
- `id_marca` (Select)
- `precio` (NumberInput con formato S/)
- `codigo_barras` (Input)
- `codigo` (Input, generado o manual)
- `undm` (unidad de medida: Select)
- Variantes: tonalidades y tallas (selección múltiple con `getProductAttributes`)
- Imágenes (ImageKit upload)

#### Validación de SKU
- Si el producto tiene tonalidades o tallas → genera combinaciones SKU automáticamente
- `generateSKUs()` → backend genera los SKU en tabla `producto_variants`

---

## 5. MÓDULO: CLIENTES

### 5.1 Página Principal

**Archivo:** `pages/Clientes/Clientes.jsx`

#### Componentes
- `ShowClient.jsx` — tabla de clientes con paginación
- `TablaCliente.jsx` — tabla (refactorizable a componente único)
- `AddClient.jsx` — modal de creación
- `EditClient.jsx` — modal de edición
- `FiltroCliente.jsx` — filtros de búsqueda

#### Campos de Cliente
- `nombre` / `razon_social`
- `documento` (DNI/RUC)
- `direccion`
- `telefono`
- `email`
- `tipo` (natural/jurídica)
- `estado` (Activo/Inactivo)

#### Servicio (`services/clientes.services.js` o `cliente.services.js`)
```js
getClientes(filters)      // GET /clientes
addCliente(data)          // POST /clientes
updateCliente(id, data)   // PUT /clientes/:id
deleteCliente(id)        // DELETE /clientes/:id
getClientesExternosRequest()  // GET /clientes/externos (para fusión en POS)
```

---

## 6. MÓDULO: NOTA DE ALMACÉN

### 6.1 Página Principal

**Archivo:** `pages/Nota_Almacen/Nota_Almacen.jsx`

#### Arquitectura con Tabs
```
Tabs: [Ingreso | Salida]
├── Tab Ingreso
│   ├── NotaAlmacenTable (ingresos)
│   ├── FiltrosAlmacen
│   └── Botones: Exportar Excel, Exportar PDF
└── Tab Salida
    ├── NotaAlmacenTable (salidas)
    ├── FiltrosAlmacen
    └── similar export
```

#### Estado
```js
filtersIngreso: {}, filtersSalida: {}
ingresos[], salidas[]
almacenSeleccionado
tabActiva: "ingreso" | "salida"
isInitialLoadingIngresos, isInitialLoadingSalidas
NOTA_ALMACEN_FETCH_LIMIT = 500
```

#### Submódulo Registro de Nota

**Archivo:** `pages/Nota_Almacen/registration/RegistroNota.jsx`

**Componentes:**
- `RegistroNotaTable.jsx` — tabla de productos a incluir
- `modals/BuscarProductoForm.jsx` — búsqueda de producto para agregar
- `modals/AgregarProovedor.jsx` — modal de proveedor (para ingreso)

#### Servicios
```js
// notaIngreso.services.js
getNotasIngreso({filters})   // GET /nota-ingreso
addNotaIngreso(data)          // POST /nota-ingreso
updateNotaIngreso(id, data)   // PUT /nota-ingreso/:id

// notaSalida.services.js
getNotasSalida({filters})    // GET /nota-salida
addNotaSalida(data)           // POST /nota-salida
updateNotaSalida(id, data)   // PUT /nota-salida/:id
```

---

## 7. MÓDULO: KARDEX

### 7.1 Página Principal

**Archivo:** `pages/Kardex/Kardex.jsx`

#### Filtros
- Almacén (Select)
- Categoría → Subcategoría (cascada)
- Marca (Select)
- Rango de fechas (DateRangePicker — @internationalized/date)
- Producto (Input con búsqueda)

#### Columnas de Tabla
- Fecha
- Tipo (Ingreso/Salida)
- Número de documento
- Cantidad entrada
- Cantidad salida
- Saldo (stock actual)
- Precio unitario
- Total

#### Funcionalidades
- Paginación (page, limit)
- Exportar Excel por mes (`downloadExcelReporteMes`)
- Exportar Excel por rango de fechas (`downloadExcelReporteFechas`)
- Ver detalle de stock (`StockDetailModal`)
- `StockDetailModal` — breakdown por almacén y sucursal

#### API (`services/kardex.services.js`)
```js
getProductosKardex({almacen, categoria, marca, fecha_i, fecha_e, page, limit})
downloadExcelReporteMes(params)
downloadExcelReporteFechas(params)
```

#### Hooks (`hooks/useKardex.js`)
```js
useAlmacenesKardex()
useMarcasKardex()
useCategoriasKardex()
useSubcategoriasKardex(categoriaSeleccionada)
```

---

## 8. MÓDULO: ALMACENES

### 8.1 Página Principal

**Archivo:** `pages/AlmacenG/AlmacenG.jsx`

#### Componentes
- `TablaAlmacen.jsx` — tabla CRUD de almacenes
- `AlmacenesForm.jsx` — form create/edit
- `AlmacenesImportModal.jsx` — importación Excel

#### Campos de Almacén
- `nombre`
- `ubicacion`
- `sucursal` (relación)
- `estado`

#### Servicio (`services/almacen.services.js`)
```js
getAlmacenes()
addAlmacen(data)
updateAlmacen(id, data)
deleteAlmacen(id)
importExcel(data)
```

---

## 9. MÓDULO: GUÍA DE REMISIÓN

### 9.1 Página Principal

**Archivo:** `pages/Guia_Remision/Guia_Remision.jsx`

#### Componentes
- `GuiasTable.jsx` — tabla de guías con filtros
- `FiltrosGuias.jsx` — filtros de búsqueda
- `ComponentsGuias/*`

### 9.2 Submódulo: Registro de Guía

**Archivo:** `pages/Guia_Remision/Registro_Guia/Registro_Guia.jsx`

#### Secciones del Formulario
1. **Datos de Envío**
   - `ClienteForm.jsx` — datos del destinatario/remitente
   - `UbigeoForm.jsx` — selección de ubigeo origen/destino

2. **Transporte**
   - `UndTrans.jsx` — unidades de transporte
   - `ModalGuias/ModalVehiculo.jsx` — datos del vehículo
   - `ModalGuias/ModalTransporte.jsx` — datos de transporte
   - `ModalGuias/ModalTransportista.jsx` — datos del transportista

3. **Productos**
   - `ComponentsRegGuias/NuevaGuiaTable.jsx` — líneas de productos
   - `ComponentsRegGuias/BuscarProdGuiaForm.jsx` — buscador de productos

#### Servicios (`services/guiaRemision.services.js`)
```js
getGuias(params)
addGuia(data)       // POST /guia-remision
updateGuia(id, data)
deleteGuia(id)
```

---

## 10. MÓDULO: USUARIOS Y ROLES

### 10.1 Usuarios

**Archivo:** `pages/Usuarios/Usuarios.jsx`

#### Componentes
- `ShowUsuarios.jsx` — tabla de usuarios
- `UsuariosForm.jsx` — form create/edit
- `UserProfileModal.jsx` — perfil de usuario
- `UserImportModal.jsx` — importación Excel
- `FilterControls.jsx` — controles de filtro/búsqueda

#### Campos
- `usuario`, `nombre`, `email`
- `password` (solo en creación)
- `rol` (Select)
- `sucursal` (Select, solo para empleados)
- `estado`

#### Servicio (`services/usuario.services.js`)
```js
getUsuarios(params)
addUsuario(data)
updateUsuario(id, data)
deleteUsuario(id)
importExcel(data)
```

### 10.2 Roles

**Archivo:** `pages/Roles/Roles.jsx`

#### Componentes
- `ShowRoles.jsx` — lista de roles
- `RolesForm.jsx` — form create/edit
- `TablaRoles.jsx` — tabla de roles
- `TablaAsignacion.jsx` — asignación de permisos a rol
- `TablaPermisosContent.jsx` — contenido de permisos

#### Campos
- `nom_rol`
- `permisos[]` (relación módulos × acciones: ver, crear, editar, eliminar, generar, desactivar)

#### Servicio (`services/rol.services.js`)
```js
getRoles()
addRol(data)
updateRol(id, data)
deleteRol(id)
```

---

## 11. MÓDULO: EMPLEADOS

**Archivo:** `pages/Empleados/Empleados.jsx`

#### Componentes
- `TablaEmpleado.jsx` — tabla CRUD empleados
- `VendedoresForm.jsx` — form create/edit vendedor
- `PagosEmpleados.jsx` — gestión de pagos

#### Campos
- `nombre`, `apellido`, `dni`
- `telefono`, `email`
- `sucursal`
- `cargo` / `rol`
- `estado`

#### Servicio (`services/vendedor.services.js`)
```js
getVendedores(params)
addVendedor(data)
updateVendedor(id, data)
deleteVendedor(id)
```

---

## 12. MÓDULO: SUCURSALES

**Archivo:** `pages/Sucursal/Sucursal.jsx`

#### Componentes
- `TablaSucursal.jsx` — tabla CRUD
- `SucursalForm.jsx` — form create/edit
- `SucursalesImportModal.jsx` — importación Excel

#### Campos
- `nombre`
- `ubicacion`
- `departamento`, `provincia`, `distrito`
- `telefono`
- `email`
- `estado`

#### Servicio (`services/sucursal.services.js`)
```js
getSucursales()
addSucursal(data)
updateSucursal(id, data)
deleteSucursal(id)
importExcel(data)
```

---

## 13. MÓDULO: PROVEEDORES

**Archivo:** `pages/Proveedores/Proveedores.jsx`

#### Componentes
- `TablaProveedor.jsx` — tabla CRUD
- `DestinatariosForm.jsx` — form destinatarios (para guías)
- `ProveedoresImportModal.jsx` — importación

#### Campos
- `razon_social`
- `ruc` / `dni`
- `direccion`
- `telefono`, `email`, `contacto`

#### Servicio
```js
getProveedores(params)
addProveedor(data)
updateProveedor(id, data)
deleteProveedor(id)
```

---

## 14. MÓDULO: CATÁLOGO DE PRODUCTO (Categorización)

### 14.1 Categorías

**Archivos:** `pages/Categorias/Categorias.jsx` (contenedor), `CategoriasForm.jsx`, `ShowCategorias.jsx`, `EditCat.jsx`

#### Campos
- `nom_categoria`
- `estado_categoria` (1=Activo, 0=Inactivo)

#### Servicio (`services/categoria.services.js`)
```js
getCategorias()
addCategoria(data)       // POST
updateCategoria(id, data) // PUT
deleteCategoria(id)      // DELETE
deactivateCategoria(id)
importExcel(data)
bulkUpdateCategorias(action, ids[])
```

### 14.2 Subcategorías

**Archivos:** `pages/Subcategorias/Subcategorias.jsx`, `SubcategoriaForm.jsx`, `ShowSubcategoria.jsx`, `EditSubcat.jsx`

#### Campos
- `id_categoria` (FK, Select)
- `nom_subcat`
- `estado_subcat`

#### Servicio (`services/subcategoria.services.js`)
```js
getSubcategorias()
getSubcategoriasForCategoria(id_categoria)
getSubcategoriaNomCategoria()  // con nombres de categoría
addSubcategoria(data)
updateSubcategoria(id, data)
deleteSubcategoria(id)
deactivateSubcategoria(id)
importExcel(data)
bulkUpdateSubcategorias(action, ids[])
```

### 14.3 Marcas

**Archivos:** `pages/Marcas/Marcas.jsx`, `MarcasForm.jsx`, `ShowMarcas.jsx`, `EditMarca.jsx`

#### Campos
- `nom_marca`
- `estado_marca`

#### Servicio (`services/marca.services.js`)
```js
getMarcas()
addMarca(data)
updateMarca(id, data)
deleteMarca(id)
deactivateMarca(id)
importExcel(data)
bulkUpdateMarcas(action, ids[])
```

### 14.4 Tallas

**Archivos:** `pages/Tallas/TallasForm.jsx`, `ShowTallas.jsx`, `EditTalla.jsx`

#### Campos
- `nombre`
- `orden` (number, para ordenar visualmente)

#### Servicio (`services/talla.services.js`)
```js
getTallas()
createTalla(data)
updateTalla(id, data)
deleteTalla(id)
```

### 14.5 Tonalidades

**Archivos:** `pages/Tonalidades/TonalidadesForm.jsx`, `ShowTonalidades.jsx`, `EditTonalidad.jsx`

#### Campos
- `nombre`
- `codigo_hex` (color picker input + hex)

#### Servicio (`services/tonalidad.services.js`)
```js
getTonalidades()
createTonalidad(data)
updateTonalidad(id, data)
deleteTonalidad(id)
```

---

## 15. MÓDULO: SUNAT / FACTURACIÓN ELECTRÓNICA

### 15.1 Página Principal

**Archivo:** `pages/Sunat/Sunat.jsx`

#### Submódulos
- `EmpresaTab.jsx` — datos de la empresa para SUNAT
- `ApiSunat.jsx` — configuración de API SUNAT

#### Campos de Empresa para SUNAT
- RUC, Razón Social, Nombre Comercial
- Dirección, ubigeo (departamento, provincia, distrito)
- Certificados digitales (para signing)
- Secundario: otros datos de contacto

#### Endpoints Involucrados
```
POST /sunat/cpe/invoice/emit    → Emitir CPE (Boleta/Factura)
POST /sunat/cpe/voided/emit    → Comunicación de Baja
POST /sunat/cpe/invoice/pdf     → Generar PDF del CPE
```

#### Funciones en `ventas.services.js`
```js
handleSunat(datosVenta, details, showSuccessToast)
anularVentaEnSunatB(venta)
handleSunatPDF(venta, detalles, nombreUsuario)
handleSunatMultiple(ventas[])
```

---

## 16. MÓDULO: NEGOCIO / CONFIGURACIÓN

**Archivo:** `pages/Negocio/Negocio.jsx`

#### Componentes
- `BusinessInfoForm.jsx` — formulario datos generales del negocio
- `LogoUploader.jsx` — subida de logo
- `ReceiptPreviewModal.jsx` — preview de ticket/recibo
- `FormActions.jsx` — botones guardar/cancelar
- `LoadingSpinner.jsx`

#### Campos
- Nombre comercial
- RUC
- Dirección
- Teléfono, email
- Logo
- Configuración de tickets (nombre del negocio, pies de página, etc.)

#### Servicio (`services/negocio.services.js`)
```js
getNegocio()
updateNegocio(data)
uploadLogo(file)
```

---

## 17. MÓDULO: REPORTES DE VENTAS (Avanzado)

**Archivo:** `pages/ReporteVentas/ReporteVentas.jsx`

#### Componentes
- `KPIS.jsx` — indicadores clave (total ventas, promedio, etc.)
- `Overview.jsx` — overview general
- `TendenciaVentas.jsx` — gráfico de tendencia
- `TopProductosMargen.jsx` — productos con mayor margen
- `CategoriaProducto.jsx` — ventas por categoría
- `Comparativa.jsx` — comparativa de períodos

#### Servicios (`services/reportes.services.js`, `services/reporte.services.js`)
```js
getReportesVentas(params)
getLibroVentasSunat(params)
downloadExcelReporteMes(params)
downloadExcelReporteFechas(params)
```

---

## 18. MÓDULO: CONFIGURACIÓN / ATRIBUTOS

**Archivo:** `pages/Configuracion/Attributes/AttributesPage.jsx`

#### Sistema Genérico de Atributos
Permite definir atributos custom por categoría de producto (ej: Color, Material, Estilo).

#### Servicio (`services/attributes.services.js`)
```js
getAttributes()                      // GET /attributes
createAttribute(data)                // POST /attributes
updateAttribute(id, data)            // PUT /attributes/:id
getAttributeValues(id_atributo)      // GET /attributes/:id/values
createAttributeValue(data)           // POST /attributes/:id/values
updateAttributeValue(id, data)       // PUT /attributes/:id/values
deleteAttributeValue(id)            // DELETE /attribute-values/:id
getCategoryAttributes(id_categoria)  // GET /categorias/:id/attributes
linkCategoryAttributes(id_categoria, attributes[])  // POST
```

---

## 19. MÓDULO: PERMISOS GLOBALES

**Archivo:** `pages/Global/PermisosGlobales/TablaPermisosGlobales.jsx`

#### Componentes
- `ModulosListing.jsx` — lista de módulos con sus submódulos
- `ModuloPermisos.jsx` — permisos de un módulo específico
- `UnifiedPermissionsTable.jsx` — tabla unificada de permisos
- `ActionCatalogTab.jsx` — catálogo de acciones disponibles
- `ModuleConfigModal.jsx` — modal de configuración de módulo
- `PermissionsToolbar.jsx` — toolbar de filtros/búsqueda

#### Servicio (`services/permisosGlobales.services.js`)
```js
getPermisosGlobales()
updatePermisosGlobales(data)
getModules()
getSubmodules(id_modulo)
getActions()
```

#### Servicio de Acciones (`services/actionCatalog.services.js`)
```js
getActions()
createAction(data)
updateAction(id, data)
deleteAction(id)
```

---

## 20. MÓDULO: ROLES / MÓDULOS (Admin)

### 20.1 Módulos

**Archivo:** `pages/Modulos/Modulos.jsx`

#### Componentes
- `TablaModulos.jsx` — tabla CRUD módulos
- `AddModulo.jsx` / `EditModulo.jsx` — forms
- `AddSubModulo.jsx` / `EditSubModulo.jsx` — forms de submodules

#### Campos Módulo
- `nombre_modulo`
- `ruta` (path)
- `icono`
- `orden`
- `estado`

#### Campos Submódulo
- `nombre_submodulo`
- `ruta`
- `id_modulo` (FK)
- `orden`

#### Servicio (`services/rutas.services.js`)
```js
getModulos()
getModulosConSubmodulos()   // ← CRÍTICO: usado por Dashboard para routing dinámico
addModulo(data)
updateModulo(id, data)
deleteModulo(id)
addSubModulo(data)
updateSubModulo(id, data)
deleteSubModulo(id)
```

### 20.2 Roles

(Véase Sección 10.2 — Roles de Usuarios)

---

## 21. MÓDULO: SYSTEM LOGS

**Archivo:** `pages/SystemLogs/Logs.jsx`

#### Componentes
- `TablaLogs.jsx` — tabla de logs con paginación

#### Campos
- `usuario`
- `acción`
- `módulo`
- `fecha`
- `detalles` (JSON expandible)
- `ip`

#### Servicio
```js
getLogs(params)   // GET /logs
```

---

## 22. MÓDULO: GESTOR DE CONTENIDOS / VARIANTES

### 22.1 Estado Actual

> **Nota:** El directorio `pages/GestorContenidos/` **no existe** como tal. La gestión de variantes se hace desde el formulario de producto (`ProductosForm.jsx`) y mediante `VariantSelectionModal`.

### 22.2 Unidades de Medida

**Archivo:** `pages/GestorContenidos/Variantes/Unidades/Unidades.jsx`
**Servicio:** `services/unidades.services.js`

```js
getUnidades()
addUnidad(data)
updateUnidad(id, data)
deleteUnidad(id)
```

---

## 23. MÓDULO: VERIFICACIÓN DE INVENTARIO

**Archivo:** `pages/VerificacionInventario.jsx`

- Permite verificar stock real vs. stock en sistema
- Genera reportes de diferencias

---

## 24. MÓDULO: SOLICITUD DE INVENTARIO

**Archivo:** `pages/SolicitudInventario.jsx`

- Creación de solicitudes de inventario (transferencias entre almacenes)
- Estados: pendiente, aprobado, rechazado

---

## 25. MÓDULO: INVENTARIO CALENDARIO

Integrado dentro de `Ventas.jsx`:

**Archivo:** `pages/Ventas/Venta/ComponentsVentas/InventoryCalendar/InventoryCalendar.jsx`

- Vista de calendario mensual
- `DayDetailDrawer.jsx` — drawer con detalle de productos del día seleccionado

---

## 26. MÓDULO: GLOBAL / ADMIN PLAN

**Archivo:** `pages/Global/Global.jsx`

#### Submódulos
- `PlanUsers.jsx` — usuarios por plan
- `PlanFeatures.jsx` — features por plan
- `EditPlanUserModal.jsx` — editar plan de usuario
- `ConfigurationSection.jsx` — sección de configuración
- `FeatureModals.jsx` — modales de features

#### Servicios
```js
// planes.services.js
getPlanes()
getPlanFeatures()
assignPlanToUser(userId, planId)

// subscription.services.js
getSubscriptionStatus()
```

---

## 27. MÓDULO: DEVELOPER / ADMIN

### 27.1 Database Cleaner

**Archivo:** `pages/Developer/DatabaseCleaner.jsx`
- Herramienta de limpieza de datos (solo rol DESARROLLO = 10)

### 27.2 Action Catalog

**Archivo:** `pages/Developer/ActionCatalog.jsx`
- CRUD del catálogo de acciones del sistema

---

## 28. MÓDULO: EXPRESS POS (Standalone)

### 28.1 Arquitectura

Rutas independientes en `/express/*` con `ExpressLayout`:
```
/express/layout (Layout con navbar lateral)
  /express/dashboard
  /express/pos
  /express/inventory
  /express/users
  /express/subscription
  /express/settings
  /express/history
```

### 28.2 Páginas

- `ExpressDashboard` — dashboard con `StatsCards`, `WeeklyChart`, `TopProduct`, `ActionsGrid`, `DashboardHeader`
- `ExpressPOS` — POS simplificado
- `ExpressInventory` — gestión de inventario express
- `ExpressUsers` — usuarios del plan express
- `ExpressSubscription` — gestión de suscripción
- `ExpressSettings` — configuración del negocio express
- `ExpressSalesHistory` — historial de ventas

### 28.3 Servicio

```js
// services/express.services.js
expressLogin(email, password)
expressRegister(data)
expressLogout()
getExpressData()
updateExpressSettings(data)
```

---

## 29. LAYOUTS

### 29.1 Dashboard Layout

**Archivo:** `layouts/Dashboard/Dashboard.jsx`

#### Responsabilidades
- Carga dinámica de rutas desde `getModulosConSubmodulos()`
- Renderizado de `Navbar` con menú de módulos
- Renderizado de rutas dinámicas basadas en módulos del backend
- Inyección de `CategoriaContextProvider`, `SubcategoriaContextProvider`, `MarcaContextProvider`
- Wrapper `ChatbotWrapper` (DeepSeek chatbot, comentado)

#### Contextos Proveídos
```jsx
<CategoriaContextProvider>   // para productos
<SubcategoriaContextProvider>
<MarcaContextProvider>
```

### 29.2 Inicio (Home Dashboard)

**Archivo:** `layouts/Inicio/Inicio.jsx`

#### Componentes
- `LineChart.jsx` — gráfico de línea de ventas
- `RecentTransactionsTable.jsx` — últimas transacciones
- `QuickActionsCard.jsx` — acciones rápidas
- `NotasPendientesModal.jsx` — notas de almacén pendientes

### 29.3 Login Layout

**Archivo:** `layouts/Login/Login.jsx`

#### Formas de Login Soportadas
1. **Login clásico** — usuario + contraseña → POST `/auth/login`
2. **Login Express** — email + password (para planes Express)
3. **Activación de cuenta** — código OTP enviado por email

#### Campos (clásico)
- `usuario`
- `password` (con toggle show/hide)

#### Campos (express)
- `email`
- `password`
- `business name` (solo registro)

#### Redirección Post-Login
- `response.data.defaultPage` → `/Inicio`

---

## 30. COMPONENTES COMPARTIDOS UI

### 30.1 shadcn/ui Wrappers (`components/ui/`)

> **Estado (jul 2026):** En transición de @heroui/react a shadcn/ui. Wrapper disponibles:

| Componente | Notas |
|------------|-------|
| `Button` | `startContent`, `isLoading`, `isIconOnly` OK. **NO** `color` prop |
| `Card`, `CardBody`, `CardHeader`, `CardTitle`, `CardContent` | — |
| `chip` | `color` + `variant` OK |
| `dialog` | `ModalContent` obligatorio |
| `dropdown-menu` | `DropdownMenuContent` obligatorio. `DropdownMenuItem` NO `startContent` |
| `Select` | `disabled`, `isInvalid` OK. **NO** `isDisabled` |
| `Spinner` | `size` OK. **NO** `color` |
| `Input` | estándar |
| `Separator` |替**代** HeroUI `Divider` |
| `Tabs`, `Accordion`, `Avatar` | estándar |
| `Sheet`, `Popover`, `Autocomplete` | estándar |
| `NumberInput`, `DateRangePicker` | personalizados |
| `Collapsible` | — |
| `Drawer` | — |

### 30.2 Componentes Comunes

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `AppSidebar` | `components/Sidebar/AppSidebar.jsx` | Sidebar de navegación |
| `Navbar` | `components/Navbar/Navbar.jsx` | Barra superior |
| `NavLinks` | `components/Navbar/NavLinks.jsx` | Links de navegación |
| `NavProfile` | `components/Navbar/NavProfile.jsx` | Perfil de usuario |
| `NavCompany` | `components/Navbar/NavCompany.jsx` | Info empresa |
| `MobileNav` | `components/Navbar/MobileNav.jsx` | Navegación móvil |
| `Search` | `components/Search/Search.jsx` | Barra de búsqueda |
| `Pagination` | `components/Pagination/Pagination.jsx` | Paginación custom |
| `TableSkeleton` | `components/Skeletons/TableSkeleton.jsx` | Skeleton de tabla |
| `ConfirmationModal` | `components/Modals/ConfirmationModal.jsx` | Modal confirmación genérico |
| `AlertModal` | `components/Modals/AlertModal.jsx` | Modal alerta genérico |
| `VariantSelectionModal` | `components/Modals/VariantSelectionModal.jsx` | Selección de variantes |
| `DeepSeekChatbot` | `components/Chatbot/DeepSeekChatbot.jsx` | Chatbot IA (comentado en producción) |
| `GooglePlacesAutocomplete` | `components/GooglePlacesAutocomplete/GooglePlacesAutocomplete.jsx` | Autocompletado direcciones |
| `BillingDrawer` | `components/ui/BillingDrawer.jsx` | Drawer de facturación |
| `AccountDrawer` | `components/ui/AccountDrawer.jsx` | Drawer de cuenta |
| `UserNotifications` | `components/ui/UserNotifications.jsx` | Notificaciones |
| `FloatingActionsPanel` | `components/FloatingActionsPanel/FloatingActionsPanel.jsx` | Panel acciones flotantes |
| `LogotipoPopoverInfo` | `components/common/LogotipoPopoverInfo.jsx` | Info del Logo |
| `SimpleCrud` | `components/SimpleCrud.jsx` | CRUD genérico simple |
| `GlobalErrorBoundary` | `components/GlobalErrorBoundary.jsx` | Error boundary |

---

## 31. SERVICES — MAPA COMPLETO

| Servicio | Archivo | Métodos Principales |
|---------|---------|---------------------|
| `ventas.services` | `services/ventas.services.js` | `handleCobrar`, `handleSunat`, `handleSunatPDF`, `handleGuardarCliente`, `useClientesData`, `useComprobanteData`, `useProductosData`, `useSucursalData`, `useVentasData`, `useVentasOnlineData` |
| `productos.services` | `services/productos.services.js` | CRUD + variantes (`getProductVariants`, `registerProductVariants`, `generateSKUs`) |
| `clientes.services` / `cliente.services` | `services/clientes.services.js` | CRUD clientes |
| `almacen.services` | `services/almacen.services.js` | CRUD almacenes |
| `kardex.services` | `services/kardex.services.js` | Consulta + exportación Excel |
| `guiaRemision.services` | `services/guiaRemision.services.js` | CRUD guías |
| `notaIngreso.services` | `services/notaIngreso.services.js` | CRUD notas ingreso |
| `notaSalida.services` | `services/notaSalida.services.js` | CRUD notas salida |
| `categoria.services` | `services/categoria.services.js` | CRUD + import/export Excel |
| `subcategoria.services` | `services/subcategoria.services.js` | CRUD + import/export |
| `marca.services` | `services/marca.services.js` | CRUD + import/export |
| `talla.services` | `services/talla.services.js` | CRUD |
| `tonalidad.services` | `services/tonalidad.services.js` | CRUD |
| `unidades.services` | `services/unidades.services.js` | CRUD unidades de medida |
| `attributes.services` | `services/attributes.services.js` | Sistema genérico de atributos |
| `usuario.services` | `services/usuario.services.js` | CRUD usuarios |
| `rol.services` | `services/rol.services.js` | CRUD roles |
| `vendedor.services` | `services/vendedor.services.js` | CRUD vendedores |
| `sucursal.services` | `services/sucursal.services.js` | CRUD sucursales |
| `negocio.services` | `services/negocio.services.js` | GET/PUT datos negocio + logo |
| `empresa.services` | `services/empresa.services.js` | GET/PUT datos empresa |
| `reportes.services` | `services/reportes.services.js` | Reportes avanzados |
| `reporte.services` | `services/reporte.services.js` | Reporte libro ventas |
| `rutas.services` | `services/rutas.services.js` | `getModulosConSubmodulos()` |
| `permisos.services` | `services/permisos.services.js` | Permisos legacy |
| `permisosV2.services` | `services/permisosV2.services.js` | Permisos V2 |
| `permisosGlobales.services` | `services/permisosGlobales.services.js` | Permisos globales admin |
| `actionCatalog.services` | `services/actionCatalog.services.js` | Catálogo de acciones |
| `planes.services` | `services/planes.services.js` | Gestión de planes |
| `subscription.services` | `services/subscription.services.js` | Suscripciones |
| `express.services` | `services/express.services.js` | Login/register Express |
| `print.services` | `services/print.services.js` | `handlePrintThermal` |
| `payment.services` | `services/payment.services.js` | Pagos |
| `imagekit.services` | `services/imagekit.services.js` | Subida de imágenes |
| `health.services` | `services/health.services.js` | Health check |
| `resend.services` | `services/resend.services.js` | Envío de emails (Resend) |

---

## 32. CONSTANTES Y CONVENCIONES

### 32.1 Nombres de Campo DB (normalizados)

| Entidad | Campos clave |
|---------|-------------|
| Producto | `id_producto`, `nom_producto`, `codigo`, `codigo_barras`, `precio`, `estado_producto` |
| Categoría | `id_categoria`, `nom_categoria`, `estado_categoria` |
| Subcategoría | `id_subcat`, `id_categoria`, `nom_subcat`, `estado_subcat` |
| Marca | `id_marca`, `nom_marca`, `estado_marca` |
| Talla | `id_talla`, `nombre`, `orden` |
| Tonalidad | `id_tonalidad`, `nombre`, `codigo_hex` |
| Cliente | `id_cliente`, `nombre`, `documento`, `direccion`, `telefono`, `email`, `tipo` |
| Venta | `id_venta`, `fecha`, `id_comprobante`, `id_cliente`, `id_usuario`, `total`, `estado_venta`, `estado_sunat` |
| Usuario | `id_usuario`, `usuario`, `nombre`, `rol`, `sucursal`, `estado` |
| Rol | `id_rol`, `nom_rol` |
| Almacén | `id_almacen`, `nombre`, `ubicacion`, `id_sucursal` |
| Nota Almacén | `id_nota`, `tipo` (ingreso/salida), `id_almacen`, `id_usuario`, `fecha`, `observacion` |
| Guía Remisión | `id_guia`, `serie`, `correlativo`, `fecha`, `remitente`, `destinatario`, `estado` |

### 32.2 Estados

```
estado_producto: 1=Activo, 0=Inactivo
estado_cliente: 1=Activo, 0=Inactivo
estado_usuario: 1=Activo, 0=Inactivo
estado_venta: 0=Pendiente, 1=Completada, 2=Anulada
estado_sunat: 0=No enviado, 1=Enviado/Aceptado, 2=Rechazado
estado_guia: similar a venta
```

### 32.3 Permisos (legacy bits)
```
ver=1, crear=1, editar=1, eliminar=1, generar=1, desactivar=1 (por fila en permissions[])
active_actions[]: array de strings: ['ver', 'crear', 'editar', 'eliminar', ...]
```

### 32.4 Capability Naming Convention
```
"${recurso}.${accion}"  →  ej: "productos.view", "productos.create", "ventas.delete"
```

### 32.5 Response Format (Backend)
```js
// Éxito:
{ code: 1, data: [...], message: "..." }

// Error:
{ code: 0, message: "Error description" }

// Especiales:
{ code: 2, ... }  // some deletes
{ ok: true, ... } // SUNAT endpoints
```

---

## 33. UI / DISEÑO — TOKENS ACTUALES

### 33.1 Colores
```
Background principal: #1a1d27 (cards)
Border: border-white/5
Accent primario: #06b6d4 (cyan-500)
Text primary: text-slate-800 / dark:text-zinc-100
Background: bg-zinc-950 (dark)
```

### 33.2 Patrón Card UI Estándar
```jsx
<Card className="bg-[#1a1d27] border border-white/5 rounded-2xl p-4">
```

### 33.3 Libraries de Iconos
- `react-icons/fa` — Font Awesome
- `lucide-react` — Lucide icons
- `react-icons/io` — Ionicons

### 33.4 Animaciones
- `framer-motion` — para animaciones de componentes (ej: ProductCatalog)

---

## 34. NOTAS DE MIGRACIÓN (HeroUI → shadcn/ui)

### 34.1 Errores Conocidos
1. **Barrel import** `@/components/ui` falla sin `index.js` → usar imports individuales
2. **`Divider`** HeroUI → `Separator` shadcn
3. **`isDisabled`** en Select shadcn → usar `disabled` (no `isDisabled`)
4. **`startContent`** en `DropdownMenuItem` no funciona → mover a `DropdownMenuContent`

### 34.2 Módulos con residuos HeroUI pendientes
- `Registro_Venta`
- `Reporte_Venta`
- `Venta` (VentasTable, FiltrosVentas, modals)
- `InventoryCalendar`

---

*Documento generado automáticamente a partir del análisis del código fuente.*
*Última actualización: Julio 2026.*
*Versión del SPEC: 1.0*
