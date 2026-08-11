import { z } from "zod";

export const syncCanalSchema = z.object({
  codigo: z.string().min(2).max(32),
  nombre: z.string().min(2).max(120),
  config_json: z.record(z.string(), z.any()).optional().nullable(),
  activo: z.boolean().optional(),
});

export const syncMapeoSchema = z.object({
  id_canal: z.number().int().positive(),
  sku_origen: z.string().min(1).max(64),
  sku_destino: z.string().min(1).max(64),
  id_producto_erp: z.number().int().positive().optional().nullable(),
  activo: z.boolean().optional(),
});

export const syncJobSchema = z.object({
  id_canal: z.number().int().positive().optional().nullable(),
  tipo: z.enum(["pull", "push", "reconcile"]),
});
