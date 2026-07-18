# Prompt de Implementación: Migración de Nota de Almacén a client-v2

Este prompt está diseñado para que un asistente de IA (o tú mismo) implemente la migración del módulo **Nota de Almacén** desde la arquitectura legacy (`client/`) a la nueva arquitectura basada en TypeScript de **`client-v2/`**.

---

## 🎯 Objetivo General
Migrar e integrar el módulo **Nota de Almacén** en `client-v2/src/features/warehouse-notes/`, adaptándolo a las nuevas convenciones técnicas y estéticas del proyecto:
- **TypeScript estricto** para tipado robusto.
- **TanStack React Query (v5)** para fetching, caching y mutaciones, eliminando cargados manuales en `useEffect`.
- **`nuqs`** para almacenar en la URL el estado del tab activo (`tab`), búsqueda (`q`) y filtros de almacén (`almacen`), permitiendo enlaces compartibles e historiales limpios.
- **`AdaptiveCollection`** para el listado responsive de notas de ingreso y salida.
- **Tailwind CSS v4** y componentes de HeroUI / Radix (`@/components/ui/`) para un diseño moderno, Glassmorphism, y transiciones fluidas.
- **Lucide Icons** en reemplazo de `react-icons`.
- **jsPDF + XLSX** con importaciones modernas compatibles con Vite 7.
- **RBAC integrado** mediante el custom store de Zustand (`useUserStore`).

---

## 📁 Estructura del Módulo a Crear
El código debe organizarse en la carpeta `client-v2/src/features/warehouse-notes/` bajo la siguiente estructura modular:
```text
client-v2/src/features/warehouse-notes/
├── api/
│   └── warehouseNotes.ts       # Query y mutation fetchers con Axios
├── types/
│   └── index.ts                # Interfaces de TypeScript del módulo
├── pages/
│   ├── WarehouseNotesPage.tsx  # Vista principal con listado en tabs (Ingreso / Salida)
│   └── RegisterNotePage.tsx    # Formulario moderno para crear notas de almacén
└── components/
    ├── NoteDetailDialog.tsx    # Modal de visualización del comprobante / detalle
    └── ProductSearchModal.tsx   # Modal de búsqueda y selección de productos a agregar
```

---

## 📋 Especificaciones de Implementación

### 1. Tipos e Interfaces (`types/index.ts`)
Define interfaces tipadas para representar las entidades que vienen de la API:
- `WarehouseNote`: Representa una nota de almacén. Campos: `id`, `fecha`, `documento`, `proveedor` (o `destino`), `almacen_O`, `almacen_D`, `estado` (1 = activo, 0 = anulado), `concepto` (glosa), `usuario`, `observacion`, y un arreglo opcional de `detalles`.
- `WarehouseNoteDetail`: Elementos de la nota. Campos: `codigo` (ID del producto), `descripcion`, `marca`, `cantidad`, `unidad`, `attributes`, `sku_label`, `nombre_talla`, `nombre_tonalidad`.
- `Destination`: Destinatarios para notas (`id`, `documento`, `destinatario`).
- `DocumentType`: Para números correlativos de nota (`nuevo_numero_de_nota`, `nota`).

---

### 2. Capa de API (`api/warehouseNotes.ts`)
Escribe funciones asíncronas exportadas que consuman la instancia global de axios (`import api from "@/api/axios"`). Limpia los parámetros vacíos con un helper similar al de otros módulos (`cleanParams`).
- **Ingresos**:
  - `getNotasIngreso(filtros)` ➔ `GET /nota_ingreso`
  - `insertNotaIngreso(data)` ➔ `POST /nota_ingreso/addNota`
  - `anularNotaIngreso(id, usuario)` ➔ `POST /nota_ingreso/anular`
  - `getAlmacenesIngreso()` ➔ `GET /nota_ingreso/almacen`
  - `getDestinatariosIngreso()` ➔ `GET /nota_ingreso/destinatario`
  - `getDocumentosIngreso()` ➔ `GET /nota_ingreso/ndocumento`
  - `getProductosIngreso(filtros)` ➔ `GET /nota_ingreso/productos`
- **Salidas**:
  - `getNotasSalida(filtros)` ➔ `GET /nota_salida`
  - `insertNotaSalida(data)` ➔ `POST /nota_salida/addNota`
  - `anularNotaSalida(id, usuario)` ➔ `POST /nota_salida/anular`
  - `getAlmacenesSalida()` ➔ `GET /nota_salida/almacen`
  - `getDestinatariosSalida()` ➔ `GET /nota_salida/destinatario`
  - `getDocumentosSalida()` ➔ `GET /nota_salida/nuevodocumento`
  - `getProductosSalida(filtros)` ➔ `GET /nota_salida/productos`

---

### 3. Página de Listado (`pages/WarehouseNotesPage.tsx`)
1. **Tabs**: Renderiza dos pestañas usando `@/components/ui/tabs` ("Ingresos" y "Salidas"). Controla el tab activo en la URL con `useQueryState("tab", parseAsString.withDefault("ingreso"))`.
2. **React Query**: 
   - Consume `getNotasIngreso` y `getNotasSalida` usando sendos hooks `useQuery`.
   - Reactiva las llamadas cuando cambien los filtros.
3. **Filtros y Búsqueda**:
   - Vincula el buscador general (`useQueryState("q")`) y el filtro de almacén (`useQueryState("almacen")`).
   - Muestra un selector de almacenes correspondientes a la pestaña activa.
4. **Visualización con AdaptiveCollection**:
   - Define columnas claras: Documento, Fecha, Origen/Destino (Proveedor/Cliente), Almacén Origen/Destino, Estado (Activo o Anulado con badges de color en Tailwind `badge`), Usuario, y Acciones.
   - Si se hace clic en una fila, expande el detalle inline (`renderExpanded` mostrando la tabla de items) o abre un modal `NoteDetailDialog`.
5. **Acciones**:
   - **Exportar Excel**: Genera un archivo `.xlsx` usando la librería `xlsx` a partir del estado de la tabla filtrada.
   - **Nuevo Registro**: Botón flotante o global con icono `Plus` para navegar a la página de creación (`/logistics/warehouse-notes/new`).
   - **Anular Nota**: Llama a la mutación correspondiente con un modal de confirmación `ConfirmDialog` de tipo destructivo. Valida si la nota ya está anulada (`estado === 0`) para deshabilitarlo.

---

### 4. Formulario de Registro (`pages/RegisterNotePage.tsx`)
Formulario completo y responsivo para crear un ingreso o salida manual de stock:
1. **Tipo de Nota**: Selector dinámico (`Ingreso` o `Salida`).
2. **Campos de Encabezado**:
   - Número de Nota: Deshabilitado si el correlativo es autogenerado. Debe cargarse automáticamente consumiendo `getDocumentosIngreso` o `getDocumentosSalida`.
   - Almacén de Destino/Origen: Combo dinámico dependiente de la sucursal seleccionada.
   - Destinatario/Proveedor: Autocomplete o Selector dinámico de entidades externas.
   - Concepto (Glosa): Selector con opciones predefinidas (ej. "COMPRA EN EL PAIS", "AJUSTE INVENTARIO", "VENTA DE PRODUCTOS", "TRASLADO ENTRE ALMACENES").
   - Fecha y Observaciones: Campos estándar.
3. **Tabla de Productos Seleccionados**:
   - Listado de productos agregados con código SKU, descripción, stock actual en almacén (para salidas), campo numérico editable de **Cantidad**, unidad de medida, y botón de eliminar.
   - **Validación crítica**: En caso de salida, no permitir ingresar cantidades superiores al stock actual en el almacén de origen.
4. **Modal de Búsqueda de Productos (`ProductSearchModal`)**:
   - Modal flotante que permite escribir un término (SKU, nombre, marca) y realiza una consulta debounce a `/productos`. Al seleccionar un producto y opcionalmente sus atributos de SKU/talla/color, lo agrega al listado principal.
5. **Acción de Guardar**:
   - Utiliza `useMutation` para enviar los datos de la nota. Tras el éxito de la petición, muestra un toast de éxito, invalida las queries de la colección de notas de almacén y redirige al listado principal `/logistics/warehouse-notes`.

---

### 5. Detalle de Comprobante e Impresión PDF (`components/NoteDetailDialog.tsx`)
1. Muestra un dialog moderno con el resumen estructurado de la nota de almacén.
2. Agrega un botón de **Imprimir PDF** que:
   - Importe de manera dinámica `jsPDF` y `jspdf-autotable`.
   - Genere el documento PDF con formato corporativo (formato A4, cabecera de la empresa, datos del documento alineados a la derecha, metadatos en dos columnas, y una tabla limpia con los items e información de variantes SKU).

---

### 6. Configuración de Rutas y Navegación
1. **Registro de Ruta (`client-v2/src/App.tsx`)**:
   - Importa de forma diferida (`lazy`) las páginas del módulo:
     ```typescript
     const WarehouseNotesPage = lazy(() => import("@/features/warehouse-notes/pages/WarehouseNotesPage"));
     const RegisterNotePage = lazy(() => import("@/features/warehouse-notes/pages/RegisterNotePage"));
     ```
   - Regístralas bajo el subgrupo `/logistics`:
     ```tsx
     <Route path="/logistics/warehouse-notes" element={<WarehouseNotesPage />} />
     <Route path="/logistics/warehouse-notes/new" element={<RegisterNotePage />} />
     ```
2. **Acceso Lateral (`client-v2/src/components/layouts/AppSidebar.tsx`)**:
   - Añade el enlace al sidebar en la sección "Logística":
     ```typescript
     { title: "Notas de Almacén", url: "/logistics/warehouse-notes", icon: ClipboardList, capability: "nota_almacen" }
     ```

---

## 💡 Criterios de Aceptación y DoD (Definition of Done)
1. **Zero Warnings de Compilación**: Todos los archivos creados deben estar libres de errores de TypeScript y linting.
2. **Uso Exclusivo de Componentes Nuevos**: No reutilizar layouts legacy del directorio `/client` que dependan de CSS antiguos.
3. **Consistencia de URL**: Al alternar entre pestañas, buscar o seleccionar filtros, la URL debe actualizarse reactivamente vía `nuqs` y refrescar el listado.
4. **Mutación Segura**: Al anular una nota, el listado debe invalidarse y actualizarse automáticamente en la pantalla sin necesidad de F5.
5. **Estética Excepcional**: Usar el estilo Glassmorphism y la paleta de colores oscuros/claros adaptativos de TailwindCSS v4 de `client-v2`.
