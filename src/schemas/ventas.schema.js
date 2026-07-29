import { z } from "zod";

const identificador = z.union([
  z.number().int().positive(),
  z.string().trim().regex(/^[1-9]\d*$/, "El identificador debe ser un entero positivo")
]);

const enteroPositivo = z.union([
  z.number().int().positive(),
  z.string().trim().regex(/^[1-9]\d*$/, "Debe ser un entero positivo")
]);

const numeroNoNegativo = z.union([
  z.number().finite().nonnegative(),
  z.string().trim().regex(/^\d+(?:\.\d+)?$/, "Debe ser un número no negativo")
]);

const detalleVentaSchema = z
  .object({
    id_producto: identificador,
    cantidad: enteroPositivo,
    precio: numeroNoNegativo.optional(),
    precio_unitario: numeroNoNegativo.optional(),
    descuento: numeroNoNegativo.optional(),
    total: numeroNoNegativo.optional(),
    precio_total: numeroNoNegativo.optional(),
    id_tonalidad: identificador.nullable().optional(),
    id_talla: identificador.nullable().optional(),
    // Variante elegida en el POS. Que pertenezca al id_producto se valida en
    // el controlador, que es donde hay conexión para consultarlo.
    id_sku: identificador.nullable().optional()
  })
  .superRefine((detalle, ctx) => {
    if (detalle.precio === undefined && detalle.precio_unitario === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cada detalle debe incluir precio o precio_unitario",
        path: ["precio"]
      });
    }
  });

export const crearVentaSchema = z.object({
  idempotency_key: z
    .string()
    .trim()
    .min(8, "La clave idempotente es demasiado corta")
    .max(64, "La clave idempotente es demasiado larga")
    .regex(/^[A-Za-z0-9._:-]+$/, "La clave idempotente contiene caracteres inválidos")
    .optional(),
  id_comprobante: z.string().trim().min(1, "El tipo de comprobante es requerido").max(50),
  id_cliente: z.union([identificador, z.string().trim().min(1)]).nullable().optional(),
  id_sucursal: identificador.optional(),
  id_almacen: identificador.optional(),
  f_venta: z.string().trim().min(1, "La fecha de venta es requerida"),
  metodo_pago: z.string().trim().min(1, "El método de pago es requerido").max(250),
  detalles: z.array(detalleVentaSchema).min(1, "La venta debe incluir al menos un producto").max(500)
});
