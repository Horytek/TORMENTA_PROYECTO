/** Formas públicas de Atelier (listCreators, portfolio, categorías). */

export type AtelierCreator = {
  slug: string;
  id_user?: number;
  nombre?: string;
  nombre_artistico?: string;
  bio?: string;
  avatar_url?: string;
  estilos?: string;
  precio_desde?: number | string | null;
  disponible?: number | boolean;
  publicado?: number | boolean;
};

export type AtelierBriefJson = {
  estilo?: string | null;
  caracteristicas?: string | null;
  presupuesto_min?: number | null;
  presupuesto_max?: number | null;
  formato?: string | null;
  uso?: string | null;
  prioridad?: "baja" | "normal" | "alta" | null;
};

export type AtelierFileMeta = {
  id_file: string;
  id_request?: number | null;
  id_order?: number | null;
  category: "reference" | "sketch" | "progress" | "delivery";
  file_name: string;
  mime?: string;
  byte_size?: number;
  creado_en?: string;
  expires_at?: string | null;
  deleted_at?: string | null;
  disponible?: boolean;
};

export type AtelierQuote = {
  id_quote: number;
  id_request: number;
  id_creator?: number;
  estado: string;
  precio_base?: number | string;
  extras_total?: number | string;
  descuento?: number | string;
  gross_amount?: number | string;
  platform_fee?: number | string;
  creator_net?: number | string;
  dias_entrega?: number;
  revisiones?: number;
  condiciones?: string | null;
  nombre_artistico?: string;
  creator_slug?: string;
  items?: { label: string; amount: number }[];
};

export type AtelierRequest = {
  id_request: number;
  id_creator?: number | null;
  id_client?: number;
  titulo: string;
  descripcion?: string;
  presupuesto?: number | string | null;
  estado: string;
  abierta?: boolean;
  brief_json?: AtelierBriefJson | string | null;
  cliente?: string;
  nombre_artistico?: string;
  creator_slug?: string;
  quotes?: AtelierQuote[];
  files?: AtelierFileMeta[];
  quotes_sent?: number;
  my_quote_id?: number | null;
};

export type AtelierOrder = {
  id_order: number;
  id_request: number;
  id_quote?: number;
  id_client?: number;
  id_creator?: number;
  titulo?: string;
  descripcion?: string;
  estado: string;
  gross_amount?: number | string;
  platform_fee?: number | string;
  creator_net?: number | string;
  revisiones_incluidas?: number;
  revisiones_usadas?: number;
  cliente?: string;
  nombre_artistico?: string;
  brief_json?: AtelierBriefJson | string | null;
  quote?: AtelierQuote | null;
  files?: AtelierFileMeta[];
  messages?: AtelierMessage[];
  events?: { id_event: number; tipo: string; mensaje?: string; creado_en?: string }[];
  revisions?: { id_revision: number; numero: number; comentario?: string }[];
};

export type AtelierMessage = {
  id_message: number;
  id_sender: number;
  nombre?: string;
  body: string;
  creado_en?: string;
};

export type AtelierCategory = {
  id_category?: number;
  nombre: string;
  slug?: string;
};

export type AtelierPortfolioItem = {
  id_item: number;
  titulo?: string;
  descripcion?: string;
  image_url?: string;
  categoria?: string;
  destacado?: number | boolean;
};

export type AtelierService = {
  id_service: number;
  nombre: string;
  descripcion?: string;
  precio_base?: number | string;
  dias_entrega?: number;
  revisiones_incluidas?: number;
  categoria?: string;
};

export function creatorName(c: Pick<AtelierCreator, "nombre_artistico" | "nombre">) {
  return c.nombre_artistico || c.nombre || "Artista";
}

export { formatFromPrice } from "./helpers";
