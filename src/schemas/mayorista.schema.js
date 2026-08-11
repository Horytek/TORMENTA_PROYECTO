import { z } from "zod";

export const mayoristaTiendaSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug solo minúsculas, números y guiones"),
  nombre: z.string().min(2).max(160),
  whatsapp: z.string().max(32).optional().nullable(),
  activo: z.boolean().optional(),
});

export const mayoristaListaSchema = z.object({
  id_tienda: z.number().int().positive(),
  nombre: z.string().min(2).max(120),
  moneda: z.string().length(3).optional(),
});

export const mayoristaItemSchema = z.object({
  id_lista: z.number().int().positive(),
  sku: z.string().min(1).max(64),
  nombre: z.string().min(1).max(200),
  precio: z.number().positive(),
  min_cantidad: z.number().positive().optional(),
});

export const mayoristaCompradorSchema = z.object({
  id_tienda: z.number().int().positive(),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  razon_social: z.string().min(2).max(200),
  ruc: z.string().max(20).optional().nullable(),
  id_lista: z.number().int().positive().optional().nullable(),
});

export const mayoristaLoginSchema = z.object({
  slug: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(1),
});

export const mayoristaPedidoSchema = z.object({
  notas: z.string().max(500).optional().nullable(),
  items: z
    .array(
      z.object({
        sku: z.string().min(1),
        cantidad: z.number().positive(),
      })
    )
    .min(1),
});
