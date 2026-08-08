import { z } from "zod";

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "slug solo minúsculas, números y guiones");

/* ——— Taller ——— */
export const tallerOtSchema = z.object({
  codigo: z.string().min(1).max(40),
  titulo: z.string().min(2).max(160),
  merma_pct: z.number().min(0).max(100).optional(),
  notas: z.string().max(500).optional().nullable(),
});

export const tallerInsumoSchema = z.object({
  id_ot: z.number().int().positive(),
  sku: z.string().min(1).max(64),
  nombre: z.string().min(1).max(160),
  cantidad: z.number().positive().optional(),
});

export const tallerOperadorSchema = z.object({
  nombre: z.string().min(2).max(120),
  pin: z.string().min(4).max(12),
  activo: z.boolean().optional(),
});

/* ——— Preventa ——— */
export const preventaCampaniaSchema = z.object({
  id_tienda: z.number().int().positive().optional(),
  slug: slugSchema,
  nombre: z.string().min(2).max(160),
  anticipo_pct: z.number().min(0).max(100).optional(),
  activo: z.boolean().optional(),
});

export const preventaItemSchema = z.object({
  id_campania: z.number().int().positive(),
  sku: z.string().min(1).max(64),
  nombre: z.string().min(1).max(160),
  precio: z.number().positive(),
  cupo: z.number().int().positive().optional(),
});

export const preventaReservaSchema = z.object({
  id_item: z.number().int().positive(),
  cliente_nombre: z.string().min(2).max(160),
  cliente_email: z.string().email().max(160),
  cantidad: z.number().int().positive().optional(),
});

/* ——— CRM ——— */
export const crmDealSchema = z.object({
  titulo: z.string().min(2).max(160),
  id_pipeline: z.number().int().positive().optional(),
  id_etapa: z.number().int().positive().optional(),
  id_cliente_erp: z.number().int().positive().optional().nullable(),
  monto: z.number().min(0).optional(),
});

export const crmMoveDealSchema = z.object({
  id_etapa: z.number().int().positive(),
  estado: z.enum(["abierto", "ganado", "perdido"]).optional(),
});

export const crmActividadSchema = z.object({
  id_deal: z.number().int().positive(),
  tipo: z.string().min(1).max(40),
  nota: z.string().min(1).max(500),
});

/* ——— Envíos ——— */
export const enviosGuiaSchema = z.object({
  codigo: z.string().min(1).max(40),
  courier: z.string().max(80).optional(),
  destinatario: z.string().min(2).max(160),
  destino: z.string().min(2).max(200),
});

export const enviosEventoSchema = z.object({
  id_guia: z.number().int().positive(),
  estado: z.string().min(1).max(40),
  detalle: z.string().max(300).optional().nullable(),
});

/* ——— WMS ——— */
export const wmsUbicacionSchema = z.object({
  codigo: z.string().min(1).max(40),
  nombre: z.string().min(1).max(120),
});

export const wmsTareaSchema = z.object({
  tipo: z.enum(["picking", "packing", "conteo"]),
  sku: z.string().min(1).max(64),
  cantidad: z.number().positive().optional(),
  id_ubicacion: z.number().int().positive().optional().nullable(),
});

export const wmsTareaUpdateSchema = z.object({
  estado: z.enum(["pendiente", "en_curso", "hecha"]),
  id_ubicacion: z.number().int().positive().optional().nullable(),
});

/* ——— Despacho ——— */
export const despachoRutaSchema = z.object({
  fecha: z.string().min(8).max(20),
  vehiculo: z.string().min(1).max(80),
  chofer: z.string().min(1).max(120),
});

export const despachoParadaSchema = z.object({
  id_ruta: z.number().int().positive(),
  secuencia: z.number().int().positive().optional(),
  direccion: z.string().min(2).max(200),
  cliente: z.string().max(160).optional().nullable(),
});

export const despachoChoferSchema = z.object({
  nombre: z.string().min(2).max(120),
  pin: z.string().min(4).max(12),
  activo: z.boolean().optional(),
});

/* ——— Campo ——— */
export const campoVendedorSchema = z.object({
  nombre: z.string().min(2).max(120),
  pin: z.string().min(4).max(12),
  activo: z.boolean().optional(),
});

export const campoCheckinSchema = z.object({
  id_vendedor: z.number().int().positive(),
  lat: z.number(),
  lng: z.number(),
  nota: z.string().max(200).optional().nullable(),
});

/* ——— Mantenimiento ——— */
export const manttoActivoSchema = z.object({
  codigo: z.string().min(1).max(40),
  nombre: z.string().min(2).max(160),
  ubicacion: z.string().max(120).optional().nullable(),
});

export const manttoOtSchema = z.object({
  id_activo: z.number().int().positive(),
  tipo: z.enum(["preventivo", "correctivo"]),
  titulo: z.string().min(2).max(160),
});

export const manttoTecnicoSchema = z.object({
  nombre: z.string().min(2).max(120),
  pin: z.string().min(4).max(12),
  activo: z.boolean().optional(),
});

/* ——— Recluta ——— */
export const reclutaSetupSchema = z.object({
  slug: slugSchema,
  nombre: z.string().min(2).max(160),
});

export const reclutaVacanteSchema = z.object({
  titulo: z.string().min(2).max(160),
  descripcion: z.string().max(5000).optional().nullable(),
  publicada: z.boolean().optional(),
});

export const reclutaPostulacionUpdateSchema = z.object({
  etapa: z.enum(["nueva", "revision", "entrevista", "oferta", "contratada", "descartada"]),
});

export const reclutaPostulacionPublicSchema = z.object({
  id_vacante: z.number().int().positive(),
  nombre: z.string().min(2).max(120),
  email: z.string().email().max(160),
  telefono: z.string().max(32).optional().nullable(),
  cv_url: z.string().max(300).optional().nullable(),
});

/* ——— Operadores (bootstrap / login) ——— */
export const operatorBootstrapSchema = z.object({
  slug: slugSchema,
  nombre: z.string().min(2).max(160),
  email: z.string().email().max(160),
  password: z.string().min(6).max(100),
});

export const operatorLoginSchema = z.object({
  slug: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(1),
});

export const operatorActorLoginSchema = z.object({
  slug: z.string().min(2).max(80),
  telefono: z.string().min(6).max(32).optional(),
  email: z.string().email().optional(),
  password: z.string().min(1),
});

/* ——— Taxi ——— */
export const taxiViajeSchema = z.object({
  origen: z.string().min(2).max(200),
  destino: z.string().min(2).max(200),
  id_pasajero: z.number().int().positive().optional().nullable(),
});

export const taxiAssignSchema = z.object({
  id_conductor: z.number().int().positive(),
});

export const taxiConductorSchema = z.object({
  nombre: z.string().min(2).max(120),
  telefono: z.string().max(32).optional().nullable(),
  password: z.string().min(6).max(100),
});

export const taxiPasajeroSchema = z.object({
  nombre: z.string().min(2).max(120),
  telefono: z.string().min(6).max(32),
  password: z.string().min(6).max(100),
});

/* ——— Delivery ——— */
export const deliveryPedidoSchema = z.object({
  recojo: z.string().min(2).max(200),
  entrega: z.string().min(2).max(200),
  detalle: z.string().max(300).optional().nullable(),
  id_cliente: z.number().int().positive().optional().nullable(),
});

export const deliveryAssignSchema = z.object({
  id_repartidor: z.number().int().positive(),
});

export const deliveryRepartidorSchema = z.object({
  nombre: z.string().min(2).max(120),
  telefono: z.string().max(32).optional().nullable(),
  password: z.string().min(6).max(100),
});

export const deliveryClienteSchema = z.object({
  nombre: z.string().min(2).max(120),
  telefono: z.string().min(6).max(32),
  password: z.string().min(6).max(100),
});

/* ——— Flotas ——— */
export const flotasVehiculoSchema = z.object({
  placa: z.string().min(2).max(20),
  marca: z.string().max(80).optional().nullable(),
  modelo: z.string().max(80).optional().nullable(),
  soat_vence: z.string().max(20).optional().nullable(),
  activo: z.boolean().optional(),
});

export const flotasConductorSchema = z.object({
  nombre: z.string().min(2).max(120),
  licencia: z.string().max(40).optional().nullable(),
  password: z.string().min(6).max(100).optional().nullable(),
  activo: z.boolean().optional(),
});

export const flotasCombustibleSchema = z.object({
  id_vehiculo: z.number().int().positive(),
  litros: z.number().positive(),
  monto: z.number().positive(),
  fecha: z.string().min(8).max(20),
});

/* ——— Academia ——— */
export const academiaCursoSchema = z.object({
  titulo: z.string().min(2).max(160),
  descripcion: z.string().max(500).optional().nullable(),
  activo: z.boolean().optional(),
});

export const academiaAlumnoSchema = z.object({
  email: z.string().email().max(160),
  nombre: z.string().min(2).max(120),
  password: z.string().min(6).max(100),
});

export const academiaInscripcionSchema = z.object({
  id_curso: z.number().int().positive(),
  id_alumno: z.number().int().positive(),
  progreso_pct: z.number().int().min(0).max(100).optional(),
});

export const academiaAlumnoLoginSchema = z.object({
  slug: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(1),
});

/* ——— Agenda ——— */
export const agendaSlotSchema = z.object({
  inicia_en: z.string().min(8).max(40),
  minutos: z.number().int().positive().optional(),
  precio: z.number().min(0).optional(),
  disponible: z.boolean().optional(),
});

export const agendaReservaSchema = z.object({
  id_slot: z.number().int().positive(),
  cliente_nombre: z.string().min(2).max(120),
  cliente_email: z.string().email().max(160),
});
