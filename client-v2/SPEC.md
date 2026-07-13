# SPEC.md — client-v2 (Frontend Rewritten)

> **Objetivo:** Documentación tipo Spec-Driven Development (SDD) del frontend rewrite.
> Este proyecto es una reescritura completa desde cero del `client/` original, adoptando TypeScript,
> shadcn/ui (Radix), TanStack Query, Zustand, y React Router v7.
> Estado: **MVP en desarrollo** (Productos, Clientes, Proveedores implementados).
> Comparten el mismo backend (`/api` del servidor Node en puerto 4000).

---

## 1. ARQUITECTURA GENERAL

### 1.1 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 18+ con TypeScript strict |
| Bundler | Vite |
| Routing | React Router DOM v6 (Routes/Outlet) |
| UI Components | shadcn/ui (Radix UI primitives + TailwindCSS) |
| State Management | Zustand (auth + permisos) |
| Server State | TanStack Query v5 (`@tanstack/react-query`) |
| URL State | `nuqs` (React Router adapter para query params) |
| Forms | `react-hook-form` + `@hookform/resolvers/zod` + Zod |
| HTTP Client | Axios (instancia única con interceptores) |
| Auth Storage | IndexedDB (`idb-keyval`) para token Bearer |
| Icons | Lucide React |
| Barcode | `jsbarcode` (generación SVG de códigos de barras) |
| Virtualization | `@tanstack/react-virtual` (tablas virtualizadas) |

### 1.2 Estructura de Archivos

```
client-v2/src/
├── api/
│   ├── axios.ts          # Instancia axios (baseURL, interceptors, auth header)
│   ├── auth.ts           # loginRequest, verifyTokenRequest, resetVerifyTokenCache
│   ├── permisos.ts        # getPermisosByRolRequest
│   └── rutas.ts          # getModulosConSubmodulos → RouteModule[]
├── components/
│   ├── layouts/
│   │   ├── AppSidebar.tsx  # Sidebar con nav basada en capabilities
│   │   ├── DashboardLayout.tsx  # SidebarProvider + Navbar + Outlet
│   │   └── Navbar.tsx
│   ├── shared/
│   │   ├── ConfirmDialog.tsx  # Dialog de confirmación genérico
│   │   ├── FormDialog.tsx
│   │   ├── FormField.tsx
│   │   └── IconAction.tsx  # Botón de acción con tooltip
│   ├── ui/                # Componentes shadcn/ui
│   │   ├── badge.tsx, button.tsx, input.tsx, label.tsx
│   │   ├── checkbox.tsx, switch.tsx, progress.tsx
│   │   ├── dialog.tsx, sheet.tsx, popover.tsx, tooltip.tsx
│   │   ├── table.tsx, tabs.tsx, separator.tsx
│   │   ├── sidebar.tsx, skeleton.tsx
│   │   └── textarea.tsx
│   ├── brand/
│   │   ├── Swatch.tsx     # Tira de colores (para login visual)
│   │   └── SizeCurve.tsx  # Curva de tallas (para login visual)
│   └── ui/Barcode.tsx     # Wrapper JsBarcode
├── features/
│   ├── auth/
│   │   └── pages/LoginPage.tsx
│   ├── dashboard/
│   │   └── pages/DashboardPage.tsx
│   ├── products/
│   │   ├── api/products.ts        # Todas las llamadas API de productos
│   │   ├── types/index.ts         # Interfaces TypeScript
│   │   ├── pages/ProductsPage.tsx  # Contenedor con tabs
│   │   └── components/
│   │       ├── ProductTable.tsx    # Tabla virtualizada
│   │       ├── ProductForm.tsx     # Form create/edit con Zod
│   │       ├── ViewVariantsModal.tsx
│   │       ├── CategoriesPanel.tsx  # CRUD inline categorías
│   │       ├── SubcategoriesPanel.tsx
│   │       └── BrandsPanel.tsx
│   ├── clientes/
│   │   ├── api/clientes.ts
│   │   ├── types/index.ts
│   │   ├── pages/ClientesPage.tsx
│   │   └── components/ClientForm.tsx
│   └── proveedores/
│       ├── api/proveedores.ts
│       ├── types/index.ts
│       ├── pages/ProveedoresPage.tsx
│       └── components/ProveedorForm.tsx
├── hooks/
│   ├── useBarcode.ts
│   └── use-mobile.ts
├── lib/
│   └── utils.ts           # cn() (clsx + tailwind-merge), format utilities
├── store/
│   └── useUserStore.ts    # Zustand store — auth, user, permissions, capabilities
├── utils/
│   └── authStorage.ts     # IndexedDB token storage (getToken, setToken, removeToken)
├── App.tsx                # Routing + QueryClient + Auth check on mount
├── main.tsx
└── index.css              # TailwindCSS + CSS custom properties
```

---

## 2. AUTENTICACIÓN Y USUARIOS

### 2.1 Flujo de Auth

```
App.tsx (useEffect on mount)
  └── verifyTokenRequest()      → /auth/verify
       └── setUserRaw(data)      → Zustand: user, isAuthenticated=true
       └── loadPermissionsAndCapabilities(roleId)
            ├── getModulosConSubmodulos()  → globalModuleConfigs
            └── getPermisosByRolRequest(roleId) → permissions + capabilities
```

### 2.2 authStorage.ts (IndexedDB)

```ts
getToken()         // → Promise<string | null>
setToken(token)     // → Promise<void>
removeToken()       // → Promise<void>
```

### 2.3 axios.ts

- `baseURL`: desde `import.meta.env.VITE_API_URL` o fallback `window.location.origin + "/api"`
- `withCredentials: true`
- **Request interceptor**: adjunta `Authorization: Bearer <token>` desde IndexedDB
- **Response interceptor**: redirige a login si 401

### 2.4 useUserStore (Zustand)

```ts
{
  // User normalizado
  user: { id, username, roleId, sucursal, id_tenant, id_empresa, plan_pago } | null
  isAuthenticated: boolean
  loading: boolean

  // Permisos
  permissions: Permission[]           // legacy array
  capabilities: Set<string>            // nuevo: "productos.view", "productos.edit", ...
  globalModuleConfigs: RouteModule[]   // configs de módulos del backend

  // Helpers de permiso
  loadPermissionsAndCapabilities(roleId: number): Promise<void>
  clearUser()

  // Legacy fields (mantenidos por compatibilidad)
  nombre, usuario, rol, sur, almacen, id_tenant, id_empresa, plan_pago
}
```

### 2.5 Permisos — Capability Model

```ts
// Capacidad naming: "${ruta_submodulo}.${accion}"
// Ejemplos:
"productos.view"     // ver lista
"productos.create"   // crear nuevo
"productos.edit"     // editar
"productos.delete"   // eliminar
"clientes.view"
"proveedores.edit"
"*".                 // super-admin (roleId === 10 siempre tiene todo)
```

**Regla:** `roleId === 10` (Desarrollo) ignora capabilities y siempre tiene acceso total.

---

## 3. LOGIN

### 3.1 LoginPage.tsx

**Layout:** Grid 2 columnas (desktop) — panel de marca a la izquierda, formulario a la derecha.

**Panel izquierdo (marca):**
- Color base: `#243645` (gris azulado)
- Patrón de costura de fondo (CSS grid lines)
- Mock visual de etiqueta de prenda con:
  - `SwatchStrip` (tira de colores tonalidad)
  - `SizeCurve` (curva de tallas con disponible/no disponible)
- Tag: `TAG · POL-0432`, "Polo Oversize", precio `S/ 49.90`

**Formulario:**
- Campos: `usuario` + `password`
- Toggle show/hide password
- Login request → `loginRequest({ usuario, password })`
- On success: guarda token → `setUserRaw(data)` → `loadPermissionsAndCapabilities` → redirect
- Redirect: `rol === 3` → `/express/dashboard`, else → `/dashboard`
- On error: mensaje de error con `role="alert"` + animación `animate-shake`

---

## 4. DASHBOARD LAYOUT

### 4.1 DashboardLayout.tsx

```
SidebarProvider (shadcn)
  ├── AppSidebar (collapsible)
  └── div (flex-col)
       ├── Navbar
       └── main (Outlet)
```

### 4.2 AppSidebar.tsx

**Estructura de navegación por grupos hardcodeados:**

```ts
const navigation: SidebarGroupSection[] = [
  {
    label: "General",
    items: [
      { title: "Inicio",       url: "/dashboard",         icon: Home },
      { title: "Productos",     url: "/products",          icon: Tags, capability: "productos" },
      { title: "Punto de Venta (POS)", url: "/sales/pos",  icon: LineChart, capability: "ventas" },
    ]
  },
  {
    label: "Logística",
    items: [
      { title: "Movimientos Kárdex",  url: "/logistics/kardex",     icon: Warehouse, capability: "almacen" },
      { title: "Almacenes",             url: "/logistics/warehouses",icon: Warehouse, capability: "almaceng" },
      { title: "Sucursales",            url: "/logistics/branches",  icon: Building,  capability: "sucursal" },
    ]
  },
  {
    label: "Personas",
    items: [
      { title: "Clientes",    url: "/people/clients",    icon: User,  capability: "clientes" },
      { title: "Proveedores", url: "/people/providers",  icon: Users, capability: "proveedores" },
      { title: "Empleados",   url: "/people/employees",  icon: Users, capability: "empleados" },
    ]
  },
  {
    label: "Reportes",
    items: [
      { title: "Historial de Ventas", url: "/reports/sales", icon: FileSpreadsheet, capability: "reportes" },
    ]
  },
  {
    label: "Ajustes",
    items: [
      { title: "Usuarios",          url: "/settings/users",              icon: Users,      capability: "configuracion/usuarios" },
      { title: "Roles y Permisos",   url: "/settings/roles",             icon: ShieldAlert,capability: "configuracion/roles" },
      { title: "Configuración",      url: "/settings/system",            icon: Settings,   capability: "configuracion/negocio" },
    ]
  },
]

// Si roleId === 10:
{
  label: "Developer Only",
  items: [
    { title: "Módulos y Rutas",       url: "/developer/modules",           icon: Terminal },
    { title: "Permisos Globales",      url: "/developer/global-permissions", icon: Settings },
  ]
}
```

**Renderizado:**
- `hasAccess(item)` → `user.roleId === 10 || capabilities.has("${capability}.view") || capabilities.has("*")`
- Items sin `capability` son públicos
- Active route: `location.pathname === item.url || location.pathname.startsWith("${item.url}/")`
- Indicador activo: barra `#06b6d4` (brand) a la izquierda
- Footer: avatar con iniciales del usuario + nombre + sucursal + botón logout

---

## 5. MÓDULO: PRODUCTOS

### 5.1 ProductsPage.tsx (Contenedor principal)

**URL State (nuqs):**
- `tab` (default: `"productos"`) → 4 valores: `productos | marcas | categorias | subcategorias`
- `q` (default: `""`) → término de búsqueda (solo tab productos)

**Sub-paneles embebidos:**
```tsx
<TabsContent value="productos">  → <ProductTable />
<TabsContent value="marcas">     → <BrandsPanel />
<TabsContent value="categorias"> → <CategoriesPanel />
<TabsContent value="subcategorias"> → <SubcategoriesPanel />
```

**Acciones:**
- Nuevo producto → `ProductForm` (modal Dialog)
- Exportar CSV (genera CSV con BOM para Excel)
- Editar producto → `ProductForm` con `initialData`
- Eliminar → `Dialog` de confirmación (HeroUI → confirmado como `variant="destructive"`)
- Ver variantes → `ViewVariantsModal`

**TanStack Query:**
```ts
useQuery({
  queryKey: ["products"],
  queryFn: getProducts,
  enabled: activeTab === "productos",  // solo carga cuando tab activos
})
```

### 5.2 ProductTable.tsx

**Virtualización:** `@tanstack/react-virtual` con `useVirtualizer` (altura fija 64px por fila, overscan 10)

**Columnas:**
| Columna | Contenido |
|---------|-----------|
| Descripción | Nombre + ID en texto pequeño |
| Marca / Sub-Línea | Badge de marca + nombre subcategoría |
| Und. Med. | `undm` o "NIU" por defecto |
| Precio | Formateado `S/ XX.XX` con `num` class |
| Cód. Barras | Renderiza `<Barcode>` SVG, click → descarga SVG |
| Estado | Badge success/destructive |
| Acciones | Eye (variantes), Edit, Delete con permisos |

**Búsqueda client-side:**
```ts
filteredProducts = products.filter(p =>
  descripcion.includes(term) ||
  cod_barras.includes(term) ||
  id_producto.toString().includes(term)
)
```

**Permisos:** `hasEditPermission`, `hasDeletePermission` basados en capabilities + rol 10.

### 5.3 ProductForm.tsx

**Validación Zod:**
```ts
productSchema = z.object({
  descripcion: z.string().min(3),
  precio: z.string().min(1).refine(val => !isNaN(Number(val)) && Number(val) > 0),
  cod_barras: z.string().optional().or(z.literal("")),
  undm: z.string().min(1),
  id_marca: z.string().min(1),
  id_categoria: z.string().min(1),
  id_subcategoria: z.string().min(1),
  estado_producto: z.string().default("1"),
})
```

**Metadatos cargados en paralelo:**
```ts
const [brandsList, categoriesList, subsList, unitsList] = await Promise.all([
  getBrands(), getCategories(), getSubcategories(), getUnits()
])
```

**Subcategorías filtradas por categoría activa** (useMemo + watch id_categoria).

**Generación automática de barcode** en modo create:
```ts
const lastId = await getLastIdProducto()
// → "T{id_tenant}-P{lastId+1 padded to 8 digits}"
// Ejemplo: "T2-P00000012"
```

**Atributos dinámicos** (sistema de variantes por categoría):
1. Watch `id_categoria` → `getCategoryAttributes(catId)`
2. Para cada atributo → `getAttributeValues(attrId)` en paralelo
3. Checkbox selection de valores
4. Al guardar: `generateSKUs(productId, attributesPayload)` → POST `/productos/skus/generate`

**Modo edición:**
- `getProductAttributes(initialData.id_producto)` → pre-selecciona valores

### 5.4 BrandsPanel / CategoriesPanel / SubcategoriesPanel

Cada panel implementa su propio:
- Búsqueda local
- Tabla de datos
- Dialog create/edit
- Dialog delete confirmation
- Permisos capabilities aplicados a botones

---

## 6. MÓDULO: CLIENTES

### 6.1 ClientesPage.tsx

**URL State:** `nuqs` con `q` (búsqueda por nombre/documento)

**Tabla:** Shadcn `Table` components (no virtualizada — cantidad esperada baja)

**Columnas:** Cliente (avatar + nombre + tipo doc), Dirección, Estado (Badge), Acciones

**Helper types (types/index.ts):**
```ts
clienteNombre(c: Cliente)    // {nombres} {apellidos} o {razon_social}
clienteDocumento(c: Cliente) // ruc o dni
clienteTipo(c: Cliente)       // "natural" | "juridico"
```

**Acciones por estado:**
- **Activo:** Editar, Dar de baja (desactivar), Eliminar
- **Inactivo:** Editar, Reactivar, Eliminar

**ConfirmDialog** genérico usado para delete/deactivate/reactivate con copy diferente para cada acción.

**Mutaciones:**
```ts
deleteCliente(id)              // DELETE /clientes/:id
deactivateCliente(id)          // PUT /clientes/:id/estado (0)
updateCliente({id_cliente, ..., estado: 1})  // PUT para reactivar
```

### 6.2 ClientForm.tsx

Campos: `nombres`, `apellidos`, `razon_social`, `dni`, `ruc`, `direccion`, `telefono`, `email`

- Toggle entre persona **Natural** (usa DNI) y **Jurídica** (usa RUC)
- En modo edit: campos deshabilitados según tipo

---

## 7. MÓDULO: PROVEEDORES

### 7.1 ProveedoresPage.tsx

Similar estructura a ClientesPage.

**Columnas:** Proveedor (avatar + nombre + tipo doc), Contacto (teléfono + email), Ubicación, Estado, Acciones

**Mutaciones:**
```ts
deleteProveedor(id)  // DELETE /proveedores/:id
// Nota: no hay deactivate/reactivate en el form actual — solo delete
```

### 7.2 ProveedorForm.tsx

Campos: `razon_social`, `ruc`, `dni`, `telefono`, `email`, `contacto`, `direccion`

---

## 8. DASHBOARD PAGE

**Arquitectura:** Datos mock hardcodeados (pendiente de conectar a `/api/reportes`).

**Secciones:**
1. **Header:** Saludo + sucursal del usuario
2. **KPIs (4 cards):** Ventas de hoy, Productos activos, Stock bajo, Comprobantes SUNAT
3. **Stock bajo:** Lista de SKUs con badge de cantidad
4. **Últimos comprobantes:** Documento + cliente + total
5. **Nota de desarrollo:** Banner告诉你 datos mock, con tenant/empresa/rol info

---

## 9. API — MAPA COMPLETO

### 9.1 axios.ts (instancia)

```ts
baseURL: import.meta.env.VITE_API_URL + "/api" || window.location.origin + "/api"
withCredentials: true
headers: { "Content-Type": "application/json" }
```

### 9.2 auth.ts

```ts
loginRequest({ usuario, password })      // POST /auth/login
verifyTokenRequest()                      // POST /auth/verify
resetVerifyTokenCache()                   // limpia cache de verificación
```

### 9.3 permisos.ts

```ts
getPermisosByRolRequest(roleId)  // GET /permisos/:roleId
```

### 9.4 rutas.ts

```ts
getModulosConSubmodulos()  // GET /rutas → RouteModule[]

interface RouteModule {
  id: number
  nombre_modulo: string
  ruta: string
  active_actions?: string | string[]
  submodulos?: {
    id_submodulo: number
    nombre_submodulo: string
    ruta: string
    active_actions?: string | string[]
  }[]
}
```

### 9.5 products.ts (API layer)

```ts
// Productos
getProducts()                        // GET /productos
getProduct(id)                       // GET /productos/:id
getLastIdProducto()                  // GET /productos/lastid
createProduct(payload)                // POST /productos → { success, id_producto }
updateProduct(id, payload)            // PUT /productos/:id → boolean
deleteProduct(id)                     // DELETE /productos/:id → boolean

// Catálogo
getBrands()                          // GET /marcas
getCategories()                      // GET /categorias
getSubcategories()                   // GET /subcategorias (con map de nombres)
getUnits()                           // GET /unidades (solo estado=1)

// CRUD Catálogo
createBrand / updateBrand / deleteBrand
createCategory / updateCategory / deleteCategory
createSubcategory / updateSubcategory / deleteSubcategory

// Atributos y Variantes
getCategoryAttributes(catId)         // GET /attributes/category/:catId
getAttributeValues(attrId)           // GET /attributes/:attrId/values
getProductAttributes(productId)       // GET /productos/:id/attributes
getProductVariants(productId)         // GET /productos/:id/variants
generateSKUs(productId, attributes)   // POST /productos/skus/generate
importExcelProducts(data)             // POST /productos/import/excel
```

### 9.6 clientes.ts

```ts
getClientes()                         // GET /clientes
createCliente(payload)                // POST /clientes
updateCliente(payload)                // PUT /clientes/:id
deleteCliente(id)                     // DELETE /clientes/:id
deactivateCliente(id)                 // PUT /clientes/:id/estado (0)
```

### 9.7 proveedores.ts

```ts
getProveedores()                      // GET /proveedores
createProveedor(payload)              // POST /proveedores
updateProveedor(id, payload)          // PUT /proveedores/:id
deleteProveedor(id)                   // DELETE /proveedores/:id
```

---

## 10. CONVENCIONES Y PATRONES

### 10.1 Naming Conventions

- **Funciones de API:** `verboRecurso` → `getProducts`, `createProduct`, `updateBrand`
- **Tipos TypeScript:** PascalCase → `Product`, `Cliente`, `Proveedor`, `Brand`
- **Capabilities:** `${recurso}.${accion}` → `productos.view`, `clientes.edit`
- **Componentes:** PascalCase → `ProductTable`, `ClientForm`, `ConfirmDialog`
- **Helpers de tipos:** `clienteNombre()`, `clienteDocumento()`, `proveedorNombre()`

### 10.2 Patrón de Página (Feature Page)

```tsx
export default function XxxPage() {
  const queryClient = useQueryClient()
  
  // URL state
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""))
  
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  
  // Permisos
  const capabilities = useUserStore(s => s.capabilities)
  const user = useUserStore(s => s.user)
  const can = (perm) => user?.roleId === 10 || capabilities.has(perm) || capabilities.has("*")
  
  // Data fetching
  const { data = [], isLoading } = useQuery({ queryKey, queryFn })
  
  // Mutations
  const mutation = useMutation({ mutationFn, onSuccess: () => { queryClient.invalidateQueries() } })
  
  // Filtered
  const filtered = useMemo(() => { ... }, [data, searchTerm])
  
  return <UI />
}
```

### 10.3 UI Tokens (TailwindCSS)

```css
/* Custom properties */
--background: #09090b (zinc-950)
--foreground: #09090b
--card: #09090b
--border: #27272a
--primary: #06b6d4 (cyan-500 / brand)
--brand: #06b6d4
--success: #22c55e
--destructive: #ef4444
--warning: #f59e0b
--muted-foreground: #71717a
```

### 10.4 UI Estándar (Cards)

```tsx
<Card className="rounded-2xl border border-border bg-card">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// Tabla
<div className="rounded-lg border border-border bg-card">
  <Table>...</Table>
</div>
```

### 10.5 Componentes Shared Reutilizables

| Componente | Props | Uso |
|-----------|-------|-----|
| `ConfirmDialog` | `open, onClose, onConfirm, title, description, confirmLabel, variant, isPending` | Delete/deactivate/reactivate confirmation |
| `IconAction` | `children, onClick, label (tooltip), disabled, danger` | Botón de acción en tabla |
| `FormField` | `label, children, error` | Wrapper label + input + error |

---

## 11. RUTAS DEFINIDAS

```
/                          → LoginPage (pública)
/dashboard                 → DashboardPage (protegida)
/products                  → ProductsPage (protegida, capability: productos)
/people/clients            → ClientesPage (protegida, capability: clientes)
/people/providers          → ProveedoresPage (protegida, capability: proveedores)

/express/dashboard         → DashboardPage (protegida, layout alternativo)
                            (usado cuando rol === 3)

/*                        → redirect a /dashboard
```

---

## 12. DIFERENCIAS vs client ORIGINAL

| Aspecto | client (original) | client-v2 (rewrite) |
|---------|-----------------|-------------------|
| Lenguaje | JavaScript | TypeScript strict |
| UI Library | @heroui/react | shadcn/ui (Radix) |
| Server State | Custom hooks | TanStack Query |
| Forms | react-hook-form (mixto) | react-hook-form + Zod |
| URL State | useState | nuqs (URL params) |
| Routing | React Router v6 | React Router v6 |
| Auth storage | Cookies/State | IndexedDB (idb-keyval) |
| Permisos | Legacy + capability | Capability only (Set) |
| Virtualization | No | @tanstack/react-virtual |
| Tables | HeroUI Table | shadcn Table |
| Auth check | Context | Zustand + useEffect |

---

## 13. ESTADO DE IMPLEMENTACIÓN

| Módulo | Estado | Notas |
|--------|--------|-------|
| Login | ✅ Implementado | |
| Dashboard Layout | ✅ Implementado | Sidebar + Navbar + Outlet |
| Dashboard Page | ⚠️ Mock | Datos hardcodeados, falta conectar API |
| Productos | ✅ Implementado | Tabla virtualizada, CRUD, variantes, export CSV |
| Marcas | ✅ Implementado | Inline en ProductsPage tabs |
| Categorías | ✅ Implementado | Inline en ProductsPage tabs |
| Subcategorías | ✅ Implementado | Inline en ProductsPage tabs |
| Clientes | ✅ Implementado | Full CRUD con deactivate/reactivate |
| Proveedores | ✅ Implementado | Full CRUD |
| POS (Ventas) | ❌ Pendiente | Ruta existe pero página no implementada |
| Kardex | ❌ Pendiente | Ruta existe pero página no implementada |
| Almacenes | ❌ Pendiente | Ruta existe pero página no implementada |
| Sucursales | ❌ Pendiente | Ruta existe pero página no implementada |
| Empleados | ❌ Pendiente | Ruta existe pero página no implementada |
| Reportes | ❌ Pendiente | Ruta existe pero página no implementada |
| Usuarios/Roles | ❌ Pendiente | Ruta existe pero página no implementada |
| Configuración | ❌ Pendiente | Ruta existe pero página no implementada |
| Developer Tools | ❌ Pendiente | Solo para rol 10 |

---

*Documento generado automáticamente a partir del análisis del código fuente.*
*Última actualización: Julio 2026.*
*Versión del SPEC: 1.0*
