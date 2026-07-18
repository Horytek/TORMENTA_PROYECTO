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
  | "progress" | "status-dot" | "text" | "barcode"
  // Nuevos: composición rica (Phase 2)
  | "image"      // URL de imagen con aspect-ratio fijo
  | "avatar"     // Iniciales o foto de persona
  | "logo"       // Logo cuadrado
  | "icon"       // Icono arbitrario (children via render)
  | "kpi"        // Cifra grande con threshold de color (stock, ventas, etc.)
  | "pair";      // Par clave-valor lado a lado (label + value)

// ─────────────────────────────────────────────────────────────────
// Definición de un campo
// ─────────────────────────────────────────────────────────────────
export interface FieldDef<T> {
  /** Clave real del item, o un identificador arbitrario para columnas computadas (con `render`). */
  key: (keyof T & string) | (string & {});
  label?: string;
  priority?: FieldPriority;
  semantic?: FieldSemantic;
  className?: string;
  render?: (value: unknown, item: T, index: number) => ReactNode;
  format?: (value: unknown, item: T) => string;
  collapsible?: boolean;
  order?: number;
  /** Threshold específico para `semantic: "kpi"`. Default: 0/10 (warning/active). */
  thresholds?: { warning?: number; critical?: number };
  /** Para `semantic: "avatar"`: nombre del cual derivar iniciales si no hay `render`. */
  initialsFrom?: keyof T;
  /** Para `semantic: "image"`/`"logo"`: indica si la URL debe ser absoluta. */
  imageSrc?: (item: T) => string | undefined | null;
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
// Variant del card (Phase 2)
// ─────────────────────────────────────────────────────────────────
export type CardVariant =
  | "default"        // rail lateral + contenido + índice/acciones (el actual)
  | "media-cover"    // cover image/icon arriba, contenido abajo
  | "split-row"      // horizontal: media | contenido | aside (personas)
  | "dense-tile"     // compacto, sin aire (kardex, inventarios grandes)
  | "stat-tile";     // KPI grande con número protagonista

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
// Estado semántico del item (alimenta tokens de color)
// ─────────────────────────────────────────────────────────────────
export type ItemState = "active" | "inactive" | "warning" | "error" | "info" | "neutral";

// ─────────────────────────────────────────────────────────────────
// Ritmo visual (extendido en Phase 2)
// ─────────────────────────────────────────────────────────────────
export interface RhythmConfig {
  type: "accent" | "dot" | "index" | "progress";
  color?: string;
  index?: number;
  /** 0-100 — usado cuando `type: "progress"`. */
  progress?: number;
  label?: string;
  /** Estado semántico — sobreescribe `color` si está presente. */
  state?: ItemState;
}

// ─────────────────────────────────────────────────────────────────
// Media — slot izquierdo / cover (Phase 2)
// ─────────────────────────────────────────────────────────────────
export type MediaSpec =
  | { kind: "image"; src: string; alt?: string; fallback?: string }
  | { kind: "avatar"; name: string; src?: string; sub?: string }
  | { kind: "logo"; src: string; alt?: string }
  | { kind: "icon"; node: ReactNode; tone?: ItemState }
  | { kind: "node"; node: ReactNode };

// ─────────────────────────────────────────────────────────────────
// Slots — composición declarativa del card (Phase 2)
// ─────────────────────────────────────────────────────────────────
export interface CardSlots {
  media?: MediaSpec | ReactNode;
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
  /** Rail lateral — recibe tokens semánticos. */
  accent?: { state?: ItemState; tint?: string; solid?: boolean };
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

/**
 * Props del card individual. Mantiene compatibilidad con la firma original
 * y añade `variant` + `slots` para composición rica.
 */
export interface AdaptiveCardProps<T> {
  item: T;
  index: number;
  fields: FieldDef<T>[];
  actions?: RecordAction[];
  rhythm?: RhythmConfig;
  getItemId: (item: T) => string | number;
  accentPosition?: "left" | "top";
  className?: string;
  /** Visual archetype. Default: "default" (mismo render que antes). */
  variant?: CardVariant;
  /** Composición explícita por slots. Si se omite, se deriva de `fields[]`. */
  slots?: Partial<CardSlots>;
  /** Estado semántico global — sobreescribe el deducido del rhythm. */
  state?: ItemState;
  /** Tinte explícito (hex / nombre de color de la paleta). */
  accentColor?: string;
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

// ─────────────────────────────────────────────────────────────────
// Helper: derivar iniciales a partir de un nombre
// ─────────────────────────────────────────────────────────────────
export function getInitials(name: string | undefined | null, max = 2): string {
  if (!name) return "—";
  const cleaned = String(name).trim();
  if (!cleaned) return "—";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) {
    const first = parts[0];
    return (first.slice(0, max) || "—").toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────
// Helper: estado semántico a partir de un valor numérico/texto
// ─────────────────────────────────────────────────────────────────
export function inferState(value: unknown, kind: "number" | "status" = "status"): ItemState {
  if (value === null || value === undefined) return "neutral";
  if (kind === "number") {
    const n = Number(value);
    if (isNaN(n)) return "neutral";
    if (n === 0) return "error";
    if (n < 10) return "warning";
    return "active";
  }
  const s = String(value).toLowerCase().trim();
  if (["1", "active", "activo", "activa", "enabled", "aprobado", "completado", "completed", "vigente", "pagado"].includes(s)) return "active";
  if (["0", "inactive", "inactivo", "inactiva", "disabled", "desactivado", "deleted", "eliminado", "anulado"].includes(s)) return "inactive";
  if (["warning", "pendiente", "pending", "en proceso", "vencido", "por vencer"].includes(s)) return "warning";
  if (["error", "fallido", "failed", "rechazado", "cancelado", "anulado"].includes(s)) return "error";
  if (["info", "borrador", "draft", "enviado", "emitido"].includes(s)) return "info";
  return "neutral";
}
