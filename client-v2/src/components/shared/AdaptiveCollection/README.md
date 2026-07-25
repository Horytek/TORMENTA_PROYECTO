# AdaptiveCollection — guía de adopción

Componente global para mostrar colecciones de datos en cualquier módulo de
`client-v2` (ya lo usan Clientes, Sucursales, Almacenes, Productos, Inventario
y Devoluciones). Reemplaza tablas rígidas: el mismo config produce lista
compacta en escritorio y tarjetas en móvil.

## Uso mínimo

```tsx
import { AdaptiveCollection, type FieldDef, type RecordAction } from "@/components/shared/AdaptiveCollection";

const fields: FieldDef<Venta>[] = [
  { key: "num_comprobante", label: "Comprobante", priority: "primary", semantic: "title" },
  { key: "nom_cliente",     label: "Cliente",     priority: "secondary", semantic: "subtitle" },
  { key: "total",           label: "Total",       priority: "secondary", semantic: "number", format: v => `S/ ${Number(v).toFixed(2)}` },
  { key: "estado",          label: "Estado",      priority: "secondary", semantic: "badge" },
  { key: "fecha",           label: "Fecha",       priority: "meta", semantic: "date", collapsible: true },
];

<AdaptiveCollection<Venta>
  title="Ventas"
  items={ventas}
  fields={fields}
  actions={actions}
  layout="auto"            // card en móvil, list en escritorio (o fija "list"/"card")
  isLoading={isLoading}
  search={q} onSearch={setQ}
  getItemId={v => v.id_venta}
/>
```

## Conceptos

- **`priority`** controla la adaptación responsiva: `primary` siempre visible,
  `secondary` visible en desktop, `meta` se compacta, `collapsible: true` va a
  la sección expandible en tarjetas. `hidden` no se muestra (pero puede
  exportarse si quitas la prioridad).
- **`semantic`** elige el renderizador: `title, subtitle, badge, number, date,
  code, chip, progress, status-dot, barcode, image, avatar, logo, icon, kpi, pair`.
  `format` (→ string) o `render` (→ ReactNode) personalizan el contenido.
- **Permisos**: `capability` en un campo o acción lo filtra automáticamente
  con `usePermissions()` — no condiciones a mano en el consumidor.
  `disabledReason` explica una acción deshabilitada.
- **Acciones**: `RecordAction` con `hidden(item)` / `disabled(item)` por
  registro; las `variant: "destructive"` se agrupan al final del menú. En
  móvil el menú es táctil (sin hover).
- **`getRhythm`** da identidad visual por fila (`dot`, `accent`, `index`,
  `progress`) con `state` semántico (`active | warning | error | …`).

## Capacidades opt-in

| Prop | Qué hace |
|---|---|
| `groupBy={{ field: "estado", label: (v) => … }}` | Agrupa la página actual con encabezados de grupo |
| `exportFileName="ventas.csv"` | Botón Exportar → CSV (BOM Excel) de los registros filtrados |
| `availableFields={[…]}` | Selector de columnas visibles |
| `expandedId` + `renderExpanded` | Fila expandible con detalle sin salir de la lista |
| `selectedIds` + `onSelectionChange` | Selección múltiple + acciones masivas (`globalActions`) |
| `filters` | Filtros rápidos por campo |
| `serverSide` + `page/totalPages/onPageChange` | Paginación controlada por servidor |
| `empty={{ title, description, action }}` | Estado vacío con CTA |

## Extender (sin tocar consumidores)

- Nuevo tipo de dato → agrega un valor a `FieldSemantic` (types.ts) + su case
  en `fieldRenderers.tsx` + mapeo a slot en `FieldAutoMap.tsx`.
- Nuevo arquetipo visual de tarjeta → `variant` en `variants.ts` + branch en
  `AdaptiveCard.tsx`.
- Nada de condicionales por módulo dentro del componente: las diferencias van
  en la config del módulo (ver `features/returns/config/collection.tsx` como
  ejemplo completo con estados, permisos y máquina de estados).

## Tests

Helpers puros (`filterByCapability`, `buildCsv`, `inferState`,
`sortFieldsByPriority`) tienen pruebas en `types.test.ts` (`npm test`).
