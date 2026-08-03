/** Desglose por método de pago, ej. { EFECTIVO: 120.5, YAPE: 45 }. */
export type DesgloseMetodo = Record<string, number>;

export interface TurnoCaja {
  id_turno: number;
  id_tenant: number;
  id_sucursal: number;
  id_usuario_apertura: number;
  monto_inicial: number | string;
  fecha_apertura: string;
  estado: "abierto" | "cerrado";
  id_usuario_cierre: number | null;
  fecha_cierre: string | null;
  declarado_json: DesgloseMetodo | null;
  esperado_json: DesgloseMetodo | null;
  diferencia_json: DesgloseMetodo | null;
  observaciones: string | null;
}

export interface CierreTurnoResultado {
  declarado: DesgloseMetodo;
  esperado: DesgloseMetodo;
  diferencia: DesgloseMetodo;
}
