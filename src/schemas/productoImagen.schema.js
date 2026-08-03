import { z } from "zod";

const identificador = z.union([
  z.number().int().positive(),
  z.string().trim().regex(/^[1-9]\d*$/, "El identificador debe ser un entero positivo")
]);

const enteroNoNegativo = z.union([
  z.number().int().nonnegative(),
  z.string().trim().regex(/^\d+$/, "Debe ser un entero no negativo")
]);

export const subirImagenSchema = z.object({
  file: z.string().trim().min(1, "Se requiere el archivo (base64)"),
  fileName: z.string().trim().min(1, "Se requiere el nombre del archivo").max(255)
});

export const reordenarImagenesSchema = z.object({
  orden: z
    .array(z.object({ id_imagen: identificador, orden: enteroNoNegativo }))
    .min(1, "Debe incluir al menos una imagen")
    .max(50)
});
