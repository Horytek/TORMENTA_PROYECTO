export {
  AdaptiveCollection,
  AdaptiveRecord,
  RecordSkeleton,
  AdaptiveCard,
  CardSkeleton,
} from "./AdaptiveCollection";
export { AdaptiveTable, TableSkeleton, type TableGroup } from "./AdaptiveTable";
export { renderField, SEMANTIC_COLOR_MAP, inferState } from "./fieldRenderers";
export type {
  FieldDef,
  FieldPriority,
  FieldSemantic,
  RecordAction,
  CollectionAction,
  ViewMode,
  LayoutMode,
  CollectionFilter,
  SortConfig,
  RhythmConfig,
  AdaptiveCollectionProps,
  // Nuevos (Phase 2)
  CardVariant,
  CardSlots,
  MediaSpec,
  ItemState,
  AdaptiveCardProps,
  GroupByConfig,
} from "./types";
export { inferSemantic, sortFieldsByPriority, splitCollapsible, getInitials, filterByCapability, buildCsv } from "./types";

// Sub-componentes presentacionales (Phase 2)
export {
  CardRail,
  CardMedia,
  CardHeader,
  CardBody,
  CardFooter,
  CardAside,
} from "./CardSlots";

// Sistema de acento (Phase 2)
export { Accent, type AccentKind, type AccentProps } from "./Accent";

// Auto-mapper (Phase 2)
export { mapFieldsToSlots, deriveItemState } from "./FieldAutoMap.tsx";

// Variants (Phase 2)
export {
  cardRootVariants,
  accentVariants,
  kpiVariants,
  STATE_TINT,
  NODE_TINTS,
  getTintById,
  type CardRootVariantProps,
  type AccentVariantProps,
  type KpiVariantProps,
  type NodeTintId,
} from "./variants";
