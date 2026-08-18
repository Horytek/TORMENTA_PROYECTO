/**
 * Design System Atelier — importar desde aquí en pantallas P1.
 *
 *   import { AtelierChrome, AtelierButton, ArtworkCard, Masonry } from "@/features/atelier";
 *
 * Envolver cada página con AtelierChrome (o AtelierRoot si el chrome va aparte).
 * No usar PlatformShell. Vocabulario: obra / encargo / artista / cliente.
 */
export { AtelierRoot, AtelierChrome } from "./components/AtelierRoot";
export { AtelierHeader } from "./components/AtelierHeader";
export { AtelierButton, atelierButtonVariants } from "./components/AtelierButton";
export { ArtworkCard, artworkAspect } from "./components/ArtworkCard";
export { Masonry, MasonryItem } from "./components/Masonry";
export { ArtistSignature, type ArtistSignatureProps } from "./components/ArtistSignature";
export { EmptyState } from "./components/EmptyState";
export { StatusBadge, CommissionLabel } from "./components/StatusBadge";
export { FileUploader, formatBytes, type AtelierUploadItem } from "./components/FileUploader";
export { AtelierBottomNav, type AtelierNavItem } from "./components/AtelierBottomNav";
export { AccountColophon } from "./components/AccountColophon";
export { AtelierProductFrame } from "./components/ProductFrame";
export { AtelierAdminFrame } from "./components/AtelierAdminFrame";
export { CommissionComposer } from "./components/CommissionComposer";
export { CommissionTimeline } from "./components/CommissionTimeline";
export { AtelierWorkspace } from "./components/AtelierWorkspace";
export { DeliveryPanel } from "./components/DeliveryPanel";
export { PrivateFileCard } from "./components/PrivateFileCard";
export { ArtworkViewer } from "./components/ArtworkViewer";
export { PaperSkeleton } from "./components/PaperSkeleton";

export {
  ATELIER_ACCENT,
  ATELIER_COLORS,
  ATELIER_FONTS,
  ATELIER_ROUTES,
  ATELIER_NAV,
  ATELIER_FILE_LIMITS,
  ATELIER_FILE_ACCEPT,
  ATELIER_FILE_ACCEPT_ATTR,
  type AtelierFileCategory,
} from "./tokens";
export { ATELIER_COPY, formatCommissionId } from "./copy";
export {
  PEN_PER_USD,
  formatSol,
  formatUsdFromPen,
  formatMoneyPair,
  atelierApiError,
  parseBrief,
} from "./helpers";
export {
  destForAtelierRole,
  getAtelierSession,
  clearAtelierSession,
  navForAtelierRole,
  desktopNavForAtelierRole,
  adminNavItems,
} from "./session";
export { useAtelierAccount, bumpAtelierAccount, type AtelierMe } from "./account";
export { uploadAtelierPrivateFile } from "./upload";
export { atelierStatusMeta, type AtelierStatusMeta, type AtelierStatusTone } from "./status";
export {
  creatorName,
  formatFromPrice,
  type AtelierCreator,
  type AtelierCategory,
  type AtelierPortfolioItem,
  type AtelierService,
} from "./types";

