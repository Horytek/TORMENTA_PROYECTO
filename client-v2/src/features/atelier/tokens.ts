/**
 * Tokens Atelier — superficie editorial (papel / tinta), no dashboard.
 * Acento #DB2777 solo en CTA y estados. Vocabulario: obra, encargo, artista, cliente.
 */
export const ATELIER_ACCENT = "#DB2777";

export const ATELIER_COLORS = {
  paper: "#F3EEE6",
  offwhite: "#FAF7F2",
  ink: "#2C2824",
  stone: "#8A8278",
  accent: ATELIER_ACCENT,
  accentInk: "#FFF8FB",
  hairline: "rgba(44, 40, 36, 0.12)",
} as const;

/** Display = Fraunces (serif de la landing). UI = DM Sans. */
export const ATELIER_FONTS = {
  serif: '"Fraunces", Georgia, "Times New Roman", serif',
  sans: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap",
} as const;

export const ATELIER_ROUTES = {
  discover: "/atelier",
  artists: "/atelier/artistas",
  commission: "/atelier/encargar",
  commissionFor: (slug: string) => `/atelier/encargar?artista=${encodeURIComponent(slug)}`,
  artist: (slug: string) => `/atelier/c/${slug}`,
  /** Tu Atelier — encargos del cliente. */
  clientHome: "/atelier/cliente",
  clientRequests: "/atelier/cliente/solicitudes",
  clientRequest: (id: number | string) => `/atelier/cliente/solicitudes/${id}`,
  clientOrders: "/atelier/cliente/pedidos",
  clientOrder: (id: number | string) => `/atelier/cliente/pedidos/${id}`,
  clientProfile: "/atelier/cliente/perfil",
  clientProfileEdit: "/atelier/cliente/perfil/editar",
  /** Tu estudio — encargos del artista. */
  studio: "/atelier/creador",
  creatorBoard: "/atelier/creador/solicitudes",
  creatorBrief: (id: number | string) => `/atelier/creador/solicitudes/${id}`,
  creatorOrders: "/atelier/creador/pedidos",
  creatorOrder: (id: number | string) => `/atelier/creador/pedidos/${id}`,
  studioProfile: "/atelier/creador/perfil",
  studioProfileEdit: "/atelier/creador/perfil/editar",
  /** Mesa de operación (admin). Las URLs /pedidos se mantienen; el rótulo es Encargos. */
  admin: "/atelier-admin",
  adminOrders: "/atelier-admin/pedidos",
  adminUsers: "/atelier-admin/usuarios",
  adminCommission: "/atelier-admin/comision",
  login: "/login?mode=atelier",
  helpMailto: "mailto:javierrojasq.0612@gmail.com?subject=Ayuda%20Atelier",
} as const;

export const ATELIER_NAV = [
  { to: ATELIER_ROUTES.discover, label: "Descubrir", end: true },
  { to: ATELIER_ROUTES.artists, label: "Artistas" },
  { to: ATELIER_ROUTES.commission, label: "Encargar" },
] as const;

/** Límites P1 (PNG / JPEG / WEBP). El upload real se cablea después. */
export const ATELIER_FILE_LIMITS = {
  avatar: 5 * 1024 * 1024,
  reference: 15 * 1024 * 1024,
  sketch: 25 * 1024 * 1024,
  progress: 50 * 1024 * 1024,
  delivery: 250 * 1024 * 1024,
} as const;

export const ATELIER_FILE_ACCEPT = ["image/png", "image/jpeg", "image/webp"] as const;

export const ATELIER_FILE_ACCEPT_ATTR = ATELIER_FILE_ACCEPT.join(",");

export type AtelierFileCategory = keyof typeof ATELIER_FILE_LIMITS;
