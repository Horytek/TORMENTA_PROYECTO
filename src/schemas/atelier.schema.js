import { z } from "zod";

const id = z.number().int().positive();
const texto = (min, max) => z.string().trim().min(min).max(max);
const url = z.string().url().max(500);

export const registerSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(8).max(100),
  nombre: texto(2, 120),
  role: z.enum(["cliente", "creador"]),
  slug: texto(2, 80).regex(/^[a-z0-9.-]+$/).optional(),
  nombre_artistico: texto(2, 120).optional(),
});
export const loginSchema = z.object({ email: z.string().email().max(160), password: z.string().min(1).max(100) });
export const creatorProfileSchema = z.object({
  slug: texto(2, 80).regex(/^[a-z0-9.-]+$/).optional(),
  nombre_artistico: texto(2, 120).optional(), avatar_url: url.optional().nullable(),
  bio: z.string().max(5000).optional().nullable(), estilos: z.string().max(500).optional().nullable(),
  publicado: z.boolean().optional(), disponible: z.boolean().optional(), precio_desde: z.coerce.number().nonnegative().optional().nullable(),
});
export const serviceSchema = z.object({
  nombre: texto(2, 160), descripcion: z.string().max(5000).optional().nullable(), cover_url: url.optional().nullable(),
  id_category: z.coerce.number().int().positive().optional().nullable(), tags: z.string().max(300).optional().nullable(),
  precio_base: z.coerce.number().positive(),
  dias_entrega: z.coerce.number().int().positive().max(365).optional(), revisiones_incluidas: z.coerce.number().int().min(0).max(20).optional(),
  activo: z.boolean().optional(), extras: z.array(z.object({ nombre: texto(1, 120), precio: z.coerce.number().nonnegative() })).max(30).optional(),
});
export const portfolioSchema = z.object({
  titulo: texto(2, 160), descripcion: z.string().max(500).optional().nullable(), image_url: url,
  id_category: z.coerce.number().int().positive().optional().nullable(), tags: z.string().max(300).optional().nullable(), destacado: z.boolean().optional(),
});
export const requestSchema = z.object({
  id_creator: z.coerce.number().int().positive(), id_service: z.coerce.number().int().positive().optional().nullable(),
  titulo: texto(2, 200), descripcion: texto(2, 10000),
  refs_json: z.array(url).max(20).optional().nullable(), presupuesto: z.coerce.number().positive().optional().nullable(),
  fecha_limite: z.string().date().optional().nullable(),
});
export const quoteSchema = z.object({
  precio_base: z.coerce.number().positive(), extras_total: z.coerce.number().nonnegative().optional(), descuento: z.coerce.number().nonnegative().optional(),
  dias_entrega: z.coerce.number().int().positive().max(365), revisiones: z.coerce.number().int().min(0).max(20).optional(),
  condiciones: z.string().max(10000).optional().nullable(), expira_en: z.string().datetime().optional().nullable(),
  items: z.array(z.object({ label: texto(1, 160), amount: z.coerce.number().nonnegative() })).max(30).optional(),
});
export const commissionRuleSchema = z.object({
  scope: z.enum(["global", "creator", "category"]).default("global"),
  id_creator: z.coerce.number().int().positive().optional().nullable(),
  id_category: z.coerce.number().int().positive().optional().nullable(),
  percent: z.coerce.number().min(0).max(100),
  min_fee: z.coerce.number().nonnegative().optional().nullable(),
  max_fee: z.coerce.number().nonnegative().optional().nullable(),
  activo: z.boolean().optional(),
});
export const messageSchema = z.object({ body: texto(1, 10000) });
export const revisionSchema = z.object({ comentario: texto(1, 10000) });
export const attachmentSchema = z.object({ kind: z.enum(["reference", "sketch", "preview", "final", "other"]).optional(), url, filename: z.string().max(200).optional().nullable() });
export const reviewSchema = z.object({
  calidad: z.number().int().min(1).max(5), comunicacion: z.number().int().min(1).max(5),
  cumplimiento: z.number().int().min(1).max(5), tiempo: z.number().int().min(1).max(5), comentario: z.string().max(1000).optional().nullable(),
});
export const transitionSchema = z.object({ estado: z.enum(["payment_pending", "paid", "in_progress", "preview", "revision", "final_delivery", "completed", "cancelled", "disputed", "refunded"]) });
