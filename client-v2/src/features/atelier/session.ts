import {
  getAtelierAdminToken,
  getAtelierClienteToken,
  getAtelierCreadorToken,
  setAtelierAdminToken,
  setAtelierClienteToken,
  setAtelierCreadorToken,
} from "@/features/platform/api/atelier";
import { ATELIER_COPY } from "./copy";
import { ATELIER_NAV, ATELIER_ROUTES } from "./tokens";
import type { AtelierNavItem } from "./components/AtelierBottomNav";

export type AtelierSessionRole = "cliente" | "creador" | "admin";

export function destForAtelierRole(role: string) {
  if (role === "admin") return ATELIER_ROUTES.admin;
  if (role === "creador") return ATELIER_ROUTES.studio;
  return ATELIER_ROUTES.clientHome;
}

export function getAtelierSession(): { role: AtelierSessionRole; token: string } | null {
  const admin = getAtelierAdminToken();
  if (admin) return { role: "admin", token: admin };
  const creador = getAtelierCreadorToken();
  if (creador) return { role: "creador", token: creador };
  const cliente = getAtelierClienteToken();
  if (cliente) return { role: "cliente", token: cliente };
  return null;
}

export function clearAtelierSession() {
  setAtelierAdminToken(null);
  setAtelierCreadorToken(null);
  setAtelierClienteToken(null);
}

/** Bottom nav tipográfica por rol. El sello Encargar es solo del cliente. */
export function navForAtelierRole(role?: AtelierSessionRole | null): AtelierNavItem[] | undefined {
  if (role === "creador") {
    return [
      { to: ATELIER_ROUTES.studio, label: ATELIER_COPY.home, end: true },
      { to: ATELIER_ROUTES.creatorBoard, label: ATELIER_COPY.briefs },
      { to: ATELIER_ROUTES.creatorOrders, label: ATELIER_COPY.jobs },
      { to: ATELIER_ROUTES.studioProfile, label: ATELIER_COPY.profile },
    ];
  }
  if (role === "cliente") {
    return [
      { to: ATELIER_ROUTES.clientHome, label: ATELIER_COPY.home, end: true },
      { to: ATELIER_ROUTES.discover, label: ATELIER_COPY.explore, end: true },
      { to: ATELIER_ROUTES.commission, label: ATELIER_COPY.commission, seal: true },
      { to: ATELIER_ROUTES.clientOrders, label: ATELIER_COPY.orders },
      { to: ATELIER_ROUTES.clientProfile, label: ATELIER_COPY.profile },
    ];
  }
  if (role === "admin") {
    return adminNavItems();
  }
  return undefined;
}

/** Sidebar / drawer de la mesa. Vocabulario Encargos, no Pedidos. */
export function adminNavItems(): AtelierNavItem[] {
  return [
    { to: ATELIER_ROUTES.admin, label: ATELIER_COPY.summary, end: true },
    { to: ATELIER_ROUTES.adminOrders, label: ATELIER_COPY.orders },
    { to: ATELIER_ROUTES.adminUsers, label: ATELIER_COPY.users },
    { to: ATELIER_ROUTES.adminCommission, label: ATELIER_COPY.commissionRule },
  ];
}

/**
 * Nav central de escritorio: etiquetas, sin sello Encargar ni Perfil (el avatar cubre la ficha).
 * Admin no lleva links aquí: van en el sidebar.
 */
export function desktopNavForAtelierRole(role?: AtelierSessionRole | null): AtelierNavItem[] {
  if (role === "creador") {
    return [
      { to: ATELIER_ROUTES.studio, label: ATELIER_COPY.home, end: true },
      { to: ATELIER_ROUTES.creatorBoard, label: ATELIER_COPY.briefs },
      { to: ATELIER_ROUTES.creatorOrders, label: ATELIER_COPY.jobs },
    ];
  }
  if (role === "cliente") {
    return [
      { to: ATELIER_ROUTES.clientHome, label: ATELIER_COPY.home, end: true },
      { to: ATELIER_ROUTES.discover, label: ATELIER_COPY.explore, end: true },
      { to: ATELIER_ROUTES.commission, label: ATELIER_COPY.commission },
      { to: ATELIER_ROUTES.clientOrders, label: ATELIER_COPY.orders },
    ];
  }
  if (role === "admin") return [];
  return ATELIER_NAV.map((item) => ({ to: item.to, label: item.label, end: "end" in item ? item.end : false }));
}
