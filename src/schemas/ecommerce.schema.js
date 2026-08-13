import { z } from "zod";

export const ecommerceRegisterSchema = z.object({
  nombre: z.string().min(2).max(160),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/, "Slug inválido (solo minúsculas, números, guiones y guion bajo)"),
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
  categoria: z.string().max(80).optional().nullable(),
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
        id_variante: z.number().int().positive().optional().nullable(),
        cantidad: z.number().int().positive().max(99),
        id_solicitud: z.number().int().positive().optional().nullable(),
        selecciones: z
          .array(
            z.object({
              id_atributo: z.number().int().positive(),
              id_valor: z.number().int().positive().optional().nullable(),
              valor: z.union([z.string(), z.number()]).optional().nullable(),
            })
          )
          .optional()
          .nullable(),
      })
    )
    .min(1),
  id_sucursal: z.number().int().positive().optional().nullable(),
  fulfillment: z.enum(["pickup", "delivery", "provincia"]).default("pickup"),
  telefono_comprador: z.string().max(40).optional().nullable(),
  whatsapp_context: z.any().optional().nullable(),
  id_zona: z.number().int().positive().optional().nullable(),
  id_destino: z.number().int().positive().optional().nullable(),
  id_agencia: z.number().int().positive().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  entrega: z
    .object({
      direccion: z.string().max(500).optional().nullable(),
      referencia: z.string().max(255).optional().nullable(),
      distrito: z.string().max(120).optional().nullable(),
      receptor: z.string().max(160).optional().nullable(),
      documento: z.string().max(40).optional().nullable(),
      telefono: z.string().max(40).optional().nullable(),
      notas: z.string().max(500).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export const ecommerceCartValidateSchema = z.object({
  items: z
    .array(
      z.object({
        id_producto: z.number().int().positive(),
        id_variante: z.number().int().positive().optional().nullable(),
        cantidad: z.number().int().positive().max(99),
        id_solicitud: z.number().int().positive().optional().nullable(),
        selecciones: z
          .array(
            z.object({
              id_atributo: z.number().int().positive(),
              id_valor: z.number().int().positive().optional().nullable(),
              valor: z.union([z.string(), z.number()]).optional().nullable(),
            })
          )
          .optional()
          .nullable(),
      })
    )
    .min(1),
  id_sucursal: z.number().int().positive().optional().nullable(),
});

export const ecommerceEntregaConfigSchema = z.object({
  retiro_activo: z.boolean().optional(),
  delivery_activo: z.boolean().optional(),
  provincia_activo: z.boolean().optional(),
  retiro_prep_minutos: z.number().int().min(0).max(10080).optional().nullable(),
  retiro_instrucciones: z.string().max(2000).optional().nullable(),
  delivery_modelo: z.enum(["fija", "zona", "base_recargo"]).optional(),
  delivery_costo_base: z.number().min(0).optional(),
  delivery_recargo: z.number().min(0).optional(),
  delivery_pedido_min: z.number().min(0).optional().nullable(),
  delivery_gratis_desde: z.number().min(0).optional().nullable(),
  delivery_tiempo_texto: z.string().max(120).optional().nullable(),
  provincia_pedido_min: z.number().min(0).optional().nullable(),
  provincia_condiciones: z.string().max(2000).optional().nullable(),
  provincia_requiere_agencia: z.boolean().optional(),
});

export const ecommerceZonaSchema = z.object({
  id_sucursal: z.number().int().positive(),
  nombre: z.string().min(1).max(120),
  costo: z.number().min(0),
  tiempo_estimado: z.string().max(80).optional().nullable(),
  pedido_min: z.number().min(0).optional().nullable(),
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
  geojson: z.any(),
  distritos_json: z.any().optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
});

export const ecommerceDestinoSchema = z.object({
  departamento: z.string().min(1).max(80),
  provincia: z.string().max(80).optional().nullable(),
  costo: z.number().min(0),
  tiempo_estimado: z.string().max(80).optional().nullable(),
  activo: z.boolean().optional(),
});

export const ecommerceAgenciaSchema = z.object({
  nombre: z.string().min(1).max(120),
  telefono: z.string().max(40).optional().nullable(),
  direccion: z.string().max(500).optional().nullable(),
  cobertura_texto: z.string().max(255).optional().nullable(),
  observaciones: z.string().max(500).optional().nullable(),
  activo: z.boolean().optional(),
});

export const ecommerceCotizarSchema = z.object({
  fulfillment: z.enum(["pickup", "delivery", "provincia"]),
  subtotal: z.number().min(0).optional().default(0),
  id_sucursal: z.number().int().positive().optional().nullable(),
  id_zona: z.number().int().positive().optional().nullable(),
  id_destino: z.number().int().positive().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

export const ecommerceBuyerRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  nombre: z.string().min(2).max(160),
  telefono: z.string().max(40).optional().nullable(),
});

export const ecommerceBuyerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ecommerceBuyerProfileSchema = z.object({
  nombre: z.string().min(2).max(160),
  telefono: z.string().max(40).optional().nullable(),
});

export const ecommerceBuyerPasswordSchema = z.object({
  password_actual: z.string().min(1),
  password_nueva: z.string().min(6).max(128),
});

export const ecommercePickupEstadoSchema = z.object({
  estado_fulfillment: z.enum([
    "pago_confirmado",
    "preparando",
    "listo_recoger",
    "en_camino",
    "entregado",
    "cancelado",
  ]),
  notas: z.string().max(500).optional().nullable(),
});

export const ecommercePickupValidarSchema = z
  .object({
    token: z.string().min(8).optional(),
    codigo: z.string().min(4).optional(),
    id_sucursal: z.coerce.number().int().positive().optional().nullable(),
  })
  .refine((d) => Boolean(d.token || d.codigo), {
    message: "Indica token o código",
  });

export const ecommercePickupConfirmarSchema = z.object({
  delivery_method: z.enum(["qr_scan", "manual_code", "admin_panel"]).optional(),
});

export const ecommerceSucursalSchema = z.object({
  nombre: z.string().min(1).max(120),
  direccion: z.string().min(1).max(500),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  horario_json: z.any().optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  telefono: z.string().max(40).optional().nullable(),
  allow_pickup: z.boolean().optional().default(true),
  allow_delivery: z.boolean().optional().default(false),
  es_default: z.boolean().optional().default(false),
  activo: z.boolean().optional().default(true),
});

export const ecommerceInventarioAjusteSchema = z.object({
  id_variante: z.number().int().positive(),
  id_sucursal: z.number().int().positive(),
  delta: z.number().int(),
  motivo: z.string().max(255).optional().nullable(),
});

export const ecommerceTransferenciaSchema = z.object({
  id_sucursal_origen: z.number().int().positive(),
  id_sucursal_destino: z.number().int().positive(),
  notas: z.string().max(500).optional().nullable(),
  lineas: z
    .array(
      z.object({
        id_variante: z.number().int().positive(),
        cantidad: z.number().int().positive(),
      })
    )
    .min(1),
});

export const ecommerceTransferenciaEstadoSchema = z.object({
  estado: z.enum(["en_transito", "recibida", "cancelada"]),
});

const moduleSchema = z
  .object({
    id: z.string().max(64),
    type: z.enum([
      "spotlight",
      "featured",
      "rows",
      "categories",
      "trust",
      "promo",
      "browse",
      "faq",
      "stage",
      "stories",
      "rails",
      "catalog",
    ]),
    enabled: z.boolean().optional(),
    config: z.record(z.string(), z.any()).optional(),
  })
  .passthrough();

export const ecommerceThemeSchema = z
  .object({
    preset: z.enum(["nocturna", "clara", "retail", "store"]).optional(),
    font_display: z.enum(["syne", "outfit", "sora"]).optional(),
    font_body: z.enum(["dm-sans", "manrope", "space-grotesk"]).optional(),
    header_style: z.enum(["dark", "light", "accent"]).optional(),
    nav: z
      .object({
        show_categories: z.boolean().optional(),
        style: z.enum(["text", "pill", "soft", "underline"]).optional(),
        label_all: z.string().max(40).optional(),
        max_items: z.number().int().min(2).max(12).optional(),
        show_counts: z.boolean().optional(),
        items: z
          .array(
            z.object({
              id: z.string().max(64).optional(),
              label: z.string().min(1).max(40),
              kind: z.enum(["all", "category", "link"]),
              category: z.string().max(80).optional().nullable(),
              href: z.string().max(512).optional().nullable(),
              enabled: z.boolean().optional(),
            })
          )
          .max(20)
          .optional(),
      })
      .optional(),
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
    modules: z.array(moduleSchema).max(20).optional(),
    color_scheme_default: z.enum(["system", "light", "dark"]).optional(),
    allow_visitor_scheme_toggle: z.boolean().optional(),
    quick_actions: z
      .object({
        cart_fab: z.boolean().optional(),
        quick_add: z.boolean().optional(),
        whatsapp: z.boolean().optional(),
      })
      .optional(),
    disponibilidad: z
      .object({
        consulta_activa: z.boolean().optional(),
        metodo_default: z.enum(["auto", "directa", "consultar", "ambos"]).optional(),
        umbral_consulta: z.number().int().min(0).max(999).optional(),
        umbral_agotado: z.number().int().min(0).max(999).optional(),
        umbral_limitado: z.number().int().min(0).max(999).optional(),
        mostrar_boton_producto: z.boolean().optional(),
        mostrar_boton_variante: z.boolean().optional(),
        mensaje_confianza: z.string().max(400).optional(),
        mensaje_leyenda_stock: z.string().max(500).optional(),
        mensaje_intro: z.string().max(400).optional(),
        validez_confirmacion_min: z.number().int().min(15).max(10080).optional(),
        reserva_checkout_min: z.number().int().min(1).max(10080).optional(),
        permitir_checkout_parcial: z.boolean().optional(),
      })
      .optional(),
    surfaces: z
      .object({
        ink: z.string().max(32).optional(),
        fog: z.string().max(32).optional(),
        mist: z.string().max(32).optional(),
        stageFrom: z.string().max(32).optional(),
        stageTo: z.string().max(32).optional(),
      })
      .optional(),
  })
  .passthrough();

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

export const ecommerceReviewConfigSchema = z.object({
  activo: z.boolean().optional(),
  allow_producto: z.boolean().optional(),
  allow_sucursal: z.boolean().optional(),
  allow_pedido: z.boolean().optional(),
  allow_general: z.boolean().optional(),
  solo_compradores: z.boolean().optional(),
  moderacion: z.enum(["auto", "manual"]).optional(),
  allow_imagenes: z.boolean().optional(),
  max_imagenes: z.number().int().min(0).max(20).optional(),
  allow_respuestas: z.boolean().optional(),
  solicitar_post_entrega: z.boolean().optional(),
  dias_espera_solicitud: z.number().int().min(0).max(90).optional(),
});

export const ecommerceReviewCreateSchema = z.object({
  tipo: z.enum(["producto", "sucursal", "pedido", "general"]),
  rating: z.number().int().min(1).max(5),
  titulo: z.string().max(160).optional().nullable(),
  comentario: z.string().max(4000).optional().nullable(),
  tema_general: z
    .enum([
      "producto",
      "atencion",
      "sucursal",
      "delivery",
      "recojo",
      "ecommerce",
      "pago",
      "sugerencia",
      "otro",
    ])
    .optional()
    .nullable(),
  ratings_json: z.record(z.number().int().min(1).max(5)).optional().nullable(),
  id_producto: z.number().int().positive().optional().nullable(),
  id_variante: z.number().int().positive().optional().nullable(),
  id_orden: z.number().int().positive().optional().nullable(),
  id_sucursal: z.number().int().positive().optional().nullable(),
  media: z
    .array(
      z.object({
        url: z.string().min(1).max(500),
        file_id: z.string().max(120).optional().nullable(),
      })
    )
    .max(10)
    .optional()
    .nullable(),
});

export const ecommerceReviewMediaUploadSchema = z.object({
  data_base64: z.string().min(1),
  file_name: z.string().max(180).optional().nullable(),
});

export const ecommerceReviewEstadoSchema = z.object({
  estado: z.enum(["pendiente", "publicada", "ocultada", "rechazada"]),
});

export const ecommerceReviewReplySchema = z.object({
  cuerpo: z.string().min(1).max(4000),
});

export const ecommerceDeleteOrdenesSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100),
});

export const ecommerceDisponibilidadConfigSchema = z.object({
  consulta_activa: z.boolean().optional(),
  metodo_default: z.enum(["auto", "directa", "consultar", "ambos"]).optional(),
  umbral_consulta: z.number().int().min(0).max(999).optional(),
  umbral_agotado: z.number().int().min(0).max(999).optional(),
  umbral_limitado: z.number().int().min(0).max(999).optional(),
  umbral_confirmacion: z.number().int().min(0).max(999).optional(),
  mostrar_boton_producto: z.boolean().optional(),
  mostrar_boton_variante: z.boolean().optional(),
  mensaje_confianza: z.string().max(400).optional(),
  mensaje_leyenda_stock: z.string().max(500).optional(),
  mensaje_intro: z.string().max(400).optional(),
  validez_confirmacion_min: z.number().int().min(15).max(10080).optional(),
  reserva_checkout_min: z.number().int().min(1).max(10080).optional(),
  permitir_checkout_parcial: z.boolean().optional(),
  solicitudes_activas: z.boolean().optional(),
  reserva_al_aprobar: z.boolean().optional(),
  reserva_minutos: z.number().int().min(5).max(10080).optional(),
  permitir_aprobacion_parcial: z.boolean().optional(),
  congelar_precio_al_aprobar: z.boolean().optional(),
  permitir_solicitud_invitado: z.boolean().optional(),
});

export const ecommerceSolicitudCreateSchema = z.object({
  id_producto: z.number().int().positive(),
  id_variante: z.number().int().positive().optional().nullable(),
  id_sucursal: z.number().int().positive(),
  cantidad: z.number().int().positive().max(99).optional(),
  attrs: z.record(z.string(), z.unknown()).optional().nullable(),
  attrs_json: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const ecommerceSolicitudAprobarSchema = z.object({
  cantidad_aprobada: z.number().int().positive().max(99).optional(),
  stock_sistema: z.number().int().min(0).optional().nullable(),
  stock_fisico: z.number().int().min(0).optional().nullable(),
  observacion_stock: z.string().max(500).optional().nullable(),
  crear_reserva: z.boolean().optional(),
  congelar_precio: z.boolean().optional(),
});

export const ecommerceSolicitudRechazarSchema = z.object({
  motivo_rechazo: z
    .enum([
      "agotado",
      "no_disponible_sucursal",
      "variante_no_disponible",
      "cantidad_insuficiente",
      "error_inventario",
      "otro",
    ])
    .optional()
    .nullable(),
  comentario_cliente: z.string().max(500).optional().nullable(),
  stock_sistema: z.number().int().min(0).optional().nullable(),
  stock_fisico: z.number().int().min(0).optional().nullable(),
  observacion_stock: z.string().max(500).optional().nullable(),
});

export const ecommerceConsultaDisponibilidadSchema = z.object({
  id_producto: z.number().int().positive(),
  id_variante: z.number().int().positive().optional().nullable(),
  id_sucursal: z.number().int().positive().optional().nullable(),
  cantidad: z.number().int().positive().max(99).optional(),
  attrs_snapshot: z
    .array(
      z.object({
        nombre: z.string().max(120),
        valor: z.string().max(200),
      })
    )
    .max(30)
    .optional()
    .nullable(),
  origen: z.string().max(40).optional().nullable(),
});

export const ecommerceAtributoSchema = z.object({
  nombre: z.string().min(1).max(120),
  codigo: z.string().max(60).optional().nullable(),
  tipo: z
    .enum([
      "texto",
      "numero",
      "seleccion",
      "seleccion_multiple",
      "booleano",
      "rango",
      "color",
      "medida",
    ])
    .optional(),
  es_variante: z.boolean().optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
  valores: z
    .array(
      z.object({
        valor: z.string().min(1).max(120).optional(),
        nombre: z.string().min(1).max(120).optional(),
        hex: z.string().max(16).optional().nullable(),
      })
    )
    .optional(),
});

export const ecommerceAtributoValorSchema = z.object({
  valor: z.string().min(1).max(120),
  hex: z.string().max(16).optional().nullable(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export const ecommerceProductoAtributosSchema = z.object({
  atributos: z.array(
    z.object({
      id_atributo: z.number().int().positive(),
      visible_storefront: z.boolean().optional(),
      requiere_seleccion: z.boolean().optional(),
      obligatorio: z.boolean().optional(),
      valor_fijo: z.string().max(255).optional().nullable(),
      orden: z.number().int().optional(),
      id_valores: z.array(z.number().int().positive()).optional(),
    })
  ),
});

export const ecommerceImagenReorderSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  tipo: z.enum(["galeria", "informativa"]).optional(),
});

export const ecommerceRolPatchSchema = z.object({
  nombre: z.string().min(1).max(80).optional(),
  acceso_global: z.boolean().optional(),
  permisos: z.array(z.string().max(80)).optional(),
});

export const ecommerceUsuarioCreateSchema = z.object({
  usua: z.string().min(2).max(80),
  email: z.string().email(),
  nombre: z.string().max(160).optional().nullable(),
  password: z.string().min(6).max(128),
  id_rol: z.number().int().positive().optional().nullable(),
  acceso_global: z.boolean().optional(),
  sucursales: z.array(z.number().int().positive()).optional(),
});

export const ecommerceUsuarioUpdateSchema = z.object({
  email: z.string().email().optional(),
  nombre: z.string().max(160).optional().nullable(),
  password: z.string().min(6).max(128).optional(),
  id_rol: z.number().int().positive().optional().nullable(),
  acceso_global: z.boolean().optional(),
  estado: z.boolean().optional(),
  sucursales: z.array(z.number().int().positive()).optional(),
});

export const ecommerceTaxonomiaSchema = z.object({
  tipo: z.enum(["marca", "categoria", "tag"]),
  nombre: z.string().min(1).max(80),
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
  ensure: z.boolean().optional(),
});

export const ecommerceTaxonomiaPatchSchema = z.object({
  nombre: z.string().min(1).max(80).optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
});
