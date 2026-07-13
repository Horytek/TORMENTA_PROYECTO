import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────
// Nivel de prioridad visual de un campo
// ─────────────────────────────────────────────────────────────────
export type FieldPriority = "primary" | "secondary" | "meta" | "hidden";

// ─────────────────────────────────────────────────────────────────
// Tipo semántico del campo
// ─────────────────────────────────────────────────────────────────
export type FieldSemantic =
  | "title" | "subtitle" | "badge" | "number"
  | "date" | "code" | "chip" | "icon-text"
  | "progress" | "status-dot" | "text" | "barcode";

// ─────────────────────────────────────────────────────────────────
// Definición de un campo
// ─────────────────────────────────────────────────────────────────
export interface FieldDef<T> {
  key: keyof T & string;
  label?: string;
  priority?: FieldPriority;
  semantic?: FieldSemantic;
  className?: string;
  render?: (value: unknown, item: T, index: number) => ReactNode;
  format?: (value: unknown, item: T) => string;
  collapsible?: boolean;
  order?: number;
}

// ─────────────────────────────────────────────────────────────────
// Acciones de registro
// ─────────────────────────────────────────────────────────────────
export interface RecordAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (item: unknown) => void;
  variant?: "destructive" | "primary" | "secondary";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabled?: boolean | ((item: any) => boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hidden?: (item: any) => boolean;
  persistent?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Acciones globales
// ─────────────────────────────────────────────────────────────────
export interface CollectionAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (selectedIds: (string | number)[]) => void;
  disabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Vista
// ─────────────────────────────────────────────────────────────────
export type ViewMode = "compact" | "comfortable" | "expanded";
export type LayoutMode = "list" | "card";

// ─────────────────────────────────────────────────────────────────
// Filtro global
// ─────────────────────────────────────────────────────────────────
export interface CollectionFilter {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
}

// ─────────────────────────────────────────────────────────────────
// Ordenamiento
// ─────────────────────────────────────────────────────────────────
export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

// ─────────────────────────────────────────────────────────────────
// Ritmo visual
// ─────────────────────────────────────────────────────────────────
export interface RhythmConfig {
  type: "accent" | "dot" | "index" | "progress";
  color?: string;
  index?: number;
  progress?: number;
  label?: string;
}

// ─────────────────────────────────────────────────────────────────
// PROPS — usa Record<string, unknown> para máxima flexibilidad
// ─────────────────────────────────────────────────────────────────
export interface AdaptiveCollectionProps<T extends Record<string, unknown>> {
  title?: string;
  items: T[];
  fields: FieldDef<T>[];
  actions?: RecordAction[];
  globalActions?: CollectionAction[];
  isLoading?: boolean;
  filters?: CollectionFilter[];
  sort?: SortConfig;
  onSort?: (sort: SortConfig) => void;
  search?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  availableFields?: FieldDef<T>[];
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  onRecordClick?: (item: T) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  getItemId?: (item: T) => string | number;
  getRhythm?: (item: T, index: number) => RhythmConfig;
  empty?: {
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
  };
  expandedId?: string | number | null;
  renderExpanded?: (item: T) => ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  serverSide?: boolean;
  totalCount?: number;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
export function inferSemantic(value: unknown, key: string): FieldSemantic {
  if (value === null || value === undefined) return "text";
  const strVal = String(value).toLowerCase();
  const numVal = Number(value);

  if (!isNaN(numVal) && numVal > 0 && strVal.length <= 15) {
    const k = key.toLowerCase();
    if (k.includes("precio") || k.includes("price") || k.includes("amount") || k.includes("stock") || k.includes("qty") || k.includes("cant")) return "number";
    return "number";
  }
  if (key.toLowerCase().includes("fecha") || key.toLowerCase().includes("date") || key.toLowerCase().includes("created") || key.toLowerCase().includes("updated")) {
    if (!isNaN(Date.parse(String(value)))) return "date";
  }
  if (key.toLowerCase().includes("barras") || key.toLowerCase().includes("barcode")) return "barcode";
  if (key.toLowerCase().includes("cod") || key.toLowerCase().includes("sku") || key.toLowerCase().includes("ref")) return "code";
  if (key.toLowerCase().includes("estado") || key.toLowerCase().includes("status")) return "badge";
  if (key.toLowerCase().includes("categoria") || key.toLowerCase().includes("nom_") || key.toLowerCase().includes("zona")) return "subtitle";
  return "text";
}

export function sortFieldsByPriority<T>(fields: FieldDef<T>[]): FieldDef<T>[] {
  const order: Record<FieldPriority, number> = { primary: 0, secondary: 1, meta: 2, hidden: 3 };
  return [...fields].sort((a, b) => {
    const ao = a.order ?? order[a.priority ?? "meta"];
    const bo = b.order ?? order[b.priority ?? "meta"];
    return ao - bo;
  });
}

export function splitCollapsible<T>(fields: FieldDef<T>[]) {
  const visible = fields.filter(f => !f.collapsible && f.priority !== "hidden");
  const collapsible = fields.filter(f => f.collapsible);
  return { visible, collapsible };
}
