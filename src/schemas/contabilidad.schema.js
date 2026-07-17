import { z } from "zod";

export const cuentaContableSchema = z.object({
    codigo: z.string({ required_error: "El código de la cuenta es obligatorio" }).trim().min(1).max(20),
    nombre: z.string({ required_error: "El nombre de la cuenta es obligatorio" }).trim().min(1).max(150),
    id_cuenta_padre: z.number().int().positive().nullable().optional(),
    tipo: z.enum(["activo", "pasivo", "patrimonio", "ingreso", "costo", "gasto", "orden"], {
        required_error: "El tipo de cuenta es obligatorio",
    }),
    naturaleza: z.enum(["deudora", "acreedora"], { required_error: "La naturaleza de la cuenta es obligatoria" }),
    moneda: z.string().trim().length(3).optional(),
    es_conciliable: z.boolean().optional(),
    es_presupuestable: z.boolean().optional(),
    es_auxiliar: z.boolean().optional(),
    permite_movimiento: z.boolean().optional(),
});

export const centroCostoSchema = z.object({
    codigo: z.string({ required_error: "El código del centro de costo es obligatorio" }).trim().min(1).max(20),
    nombre: z.string({ required_error: "El nombre del centro de costo es obligatorio" }).trim().min(1).max(100),
    id_sucursal: z.number().int().positive().nullable().optional(),
});

const lineaAsientoSchema = z.object({
    id_cuenta: z.number({ required_error: "La cuenta es obligatoria" }).int().positive(),
    id_centro_costo: z.number().int().positive().nullable().optional(),
    id_cliente: z.number().int().positive().nullable().optional(),
    descripcion: z.string().trim().max(255).optional(),
    debe: z.number().min(0).default(0),
    haber: z.number().min(0).default(0),
});

export const asientoContableSchema = z
    .object({
        fecha: z.string({ required_error: "La fecha es obligatoria" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
        tipo: z.enum(["manual", "automatico", "apertura", "ajuste", "cierre", "reversion"]).default("manual"),
        descripcion: z.string({ required_error: "La descripción es obligatoria" }).trim().min(1).max(255),
        documento_origen: z.string().trim().max(100).optional(),
        lineas: z
            .array(lineaAsientoSchema)
            .min(2, "Un asiento necesita al menos 2 líneas (una al debe y otra al haber)"),
    })
    .refine(
        (data) => data.lineas.every((l) => (l.debe > 0) !== (l.haber > 0) || (l.debe === 0 && l.haber === 0) === false),
        { message: "Cada línea debe tener un monto en Debe o en Haber, no ambos ni ninguno", path: ["lineas"] }
    )
    .refine(
        (data) => {
            const totalDebe = data.lineas.reduce((sum, l) => sum + l.debe, 0);
            const totalHaber = data.lineas.reduce((sum, l) => sum + l.haber, 0);
            return Math.abs(totalDebe - totalHaber) < 0.01;
        },
        { message: "El asiento no está balanceado: la suma del Debe debe ser igual a la suma del Haber", path: ["lineas"] }
    );

export const periodoAccionSchema = z.object({
    motivo: z.string().trim().max(255).optional(),
});

export const contabilidadConfigSchema = z.object({
    concepto: z.string({ required_error: "El concepto es obligatorio" }).trim().min(1).max(60),
    descripcion: z.string().trim().max(150).optional(),
    id_cuenta: z.number({ required_error: "La cuenta es obligatoria" }).int().positive(),
});

export const cuentaTesoreriaSchema = z.object({
    tipo: z.enum(["caja", "banco"], { required_error: "El tipo es obligatorio" }),
    nombre: z.string({ required_error: "El nombre es obligatorio" }).trim().min(1).max(100),
    numero_cuenta: z.string().trim().max(50).optional(),
    id_cuenta_contable: z.number({ required_error: "La cuenta contable es obligatoria" }).int().positive(),
    id_sucursal: z.number().int().positive().nullable().optional(),
});

export const movimientoTesoreriaSchema = z.object({
    id_cuenta_tesoreria: z.number({ required_error: "La cuenta de tesorería es obligatoria" }).int().positive(),
    id_cuenta_contra: z.number({ required_error: "La cuenta contrapartida es obligatoria" }).int().positive(),
    fecha: z.string({ required_error: "La fecha es obligatoria" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    tipo: z.enum(["deposito", "retiro", "transferencia_entrada", "transferencia_salida", "ajuste"], {
        required_error: "El tipo de movimiento es obligatorio",
    }),
    monto: z.number({ required_error: "El monto es obligatorio" }).positive("El monto debe ser mayor a 0"),
    descripcion: z.string().trim().max(255).optional(),
    referencia: z.string().trim().max(100).optional(),
});

export const presupuestoSchema = z.object({
    id_cuenta: z.number({ required_error: "La cuenta es obligatoria" }).int().positive(),
    id_centro_costo: z.number().int().positive().nullable().optional(),
    anio: z.number({ required_error: "El año es obligatorio" }).int().min(2000).max(2100),
    mes: z.number().int().min(1).max(12).nullable().optional(),
    monto_presupuestado: z.number({ required_error: "El monto presupuestado es obligatorio" }).positive(),
});
