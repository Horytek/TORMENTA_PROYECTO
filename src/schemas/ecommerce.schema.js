import { z } from "zod";

export const ecommerceRegisterSchema = z.object({
  nombre: z.string().min(2).max(160),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido (solo minúsculas, números y guiones)"),
  email: z.string().email(),
  telefono: z.string().min(6).max(40).optional().nullable(),
  plan: z.enum(["starter", "pro"]).default("starter"),
});

export const ecommerceLoginSchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
});

export const ecommerceCreatePreferenceSchema = z.object({
  id_tienda: z.number().int().positive(),
  plan: z.enum(["starter", "pro"]),
});

export const ecommerceProductoSchema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(4000).optional().nullable(),
  precio: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  stock_min: z.number().int().nonnegative().default(5),
  activo: z.boolean().optional().default(true),
  sku: z.string().max(64).optional().nullable(),
  attrs_json: z.any().optional().nullable(),
});

export const ecommerceMpCredentialsSchema = z.object({
  public_key: z.string().min(10).max(255),
  access_token: z.string().min(10),
  modo: z.enum(["test", "prod"]).default("test"),
});

export const ecommerceCheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        id_producto: z.number().int().positive(),
        cantidad: z.number().int().positive().max(99),
      })
    )
    .min(1),
  email_comprador: z.string().email(),
  nombre_comprador: z.string().min(1).max(160).optional().nullable(),
  telefono_comprador: z.string().max(40).optional().nullable(),
});

export const ecommerceThemeSchema = z
  .object({
    preset: z.enum(["nocturna", "clara", "retail"]).optional(),
    font_display: z.enum(["syne", "outfit", "sora"]).optional(),
    font_body: z.enum(["dm-sans", "manrope", "space-grotesk"]).optional(),
    header_style: z.enum(["dark", "light", "accent"]).optional(),
    hero_headline: z.string().max(120).optional().nullable(),
    hero_tagline: z.string().max(280).optional().nullable(),
    banner_url: z.string().max(512).optional().nullable(),
    sections: z
      .object({
        stage: z.boolean().optional(),
        categories: z.boolean().optional(),
        trust: z.boolean().optional(),
        stories: z.boolean().optional(),
        rails: z.boolean().optional(),
      })
      .optional(),
    trust: z
      .object({
        envio: z.string().max(80).optional(),
        pago: z.string().max(80).optional(),
        soporte: z.string().max(80).optional(),
      })
      .optional(),
  })
  .strict();

export const ecommerceTiendaUpdateSchema = z.object({
  nombre: z.string().min(2).max(160).optional(),
  descripcion: z.string().max(2000).optional().nullable(),
  color_primario: z.string().max(16).optional().nullable(),
  telefono: z.string().max(40).optional().nullable(),
  logo_url: z.string().max(512).optional().nullable(),
  theme_json: ecommerceThemeSchema.optional().nullable(),
});

export const ecommerceBrandUploadSchema = z.object({
  file: z.string().min(1),
  fileName: z.string().max(180).optional().nullable(),
});
