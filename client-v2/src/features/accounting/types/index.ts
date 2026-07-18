export interface ExpenseCategory {
  id_categoria: number;
  nombre: string;
  estado?: number;
}

export interface Expense {
  id_gasto: number;
  descripcion: string;
  monto: number | string;
  fecha: string;
  id_categoria: number;
  categoria: string;
  usuario?: string;
}

export interface ExpenseInput {
  descripcion: string;
  monto: number;
  fecha: string;
  id_categoria: number;
}

export interface PLCategoryBreakdown {
  categoria: string;
  total: number | string;
}

export interface PLSummary {
  ingresos: number;
  gastos: number;
  utilidad: number;
  gastosPorCategoria: PLCategoryBreakdown[];
}

// ── Núcleo contable (plan de cuentas, asientos, periodos) ──────────────────

export type TipoCuenta = "activo" | "pasivo" | "patrimonio" | "ingreso" | "costo" | "gasto" | "orden";
export type NaturalezaCuenta = "deudora" | "acreedora";

export interface CuentaContable {
  id_cuenta: number;
  codigo: string;
  nombre: string;
  id_cuenta_padre: number | null;
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  nivel: number;
  moneda: string;
  estado: number;
  es_conciliable: number;
  es_presupuestable: number;
  es_auxiliar: number;
  permite_movimiento: number;
}

export interface CuentaContableInput {
  codigo: string;
  nombre: string;
  id_cuenta_padre?: number | null;
  tipo: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  moneda?: string;
  es_conciliable?: boolean;
  es_presupuestable?: boolean;
  es_auxiliar?: boolean;
  permite_movimiento?: boolean;
}

export interface CentroCosto {
  id_centro_costo: number;
  codigo: string;
  nombre: string;
  id_sucursal: number | null;
  nombre_sucursal?: string | null;
  estado: number;
}

export interface CentroCostoInput {
  codigo: string;
  nombre: string;
  id_sucursal?: number | null;
}

export type EstadoPeriodo = "abierto" | "cerrado" | "bloqueado";

export interface PeriodoContable {
  id_periodo: number;
  anio: number;
  mes: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoPeriodo;
  cerrado_por: number | null;
  cerrado_en: string | null;
  motivo_reapertura: string | null;
}

export type TipoAsiento = "manual" | "automatico" | "apertura" | "ajuste" | "cierre" | "reversion";
export type EstadoAsiento = "contabilizado" | "anulado" | "revertido";

export interface LineaAsiento {
  id_cuenta: number;
  id_centro_costo?: number | null;
  id_cliente?: number | null;
  descripcion?: string;
  debe: number;
  haber: number;
}

export interface AsientoContableInput {
  fecha: string;
  tipo?: TipoAsiento;
  descripcion: string;
  documento_origen?: string;
  lineas: LineaAsiento[];
}

export interface AsientoContable {
  id_asiento: number;
  numero: number;
  fecha: string;
  tipo: TipoAsiento;
  descripcion: string;
  documento_origen: string | null;
  estado: EstadoAsiento;
  id_asiento_reversa: number | null;
  id_periodo: number;
  total: number | string;
}

export interface AsientoDetalleLinea {
  id_detalle: number;
  orden: number;
  id_cuenta: number;
  cuenta_codigo: string;
  cuenta_nombre: string;
  id_centro_costo: number | null;
  centro_costo_nombre: string | null;
  id_cliente: number | null;
  descripcion: string | null;
  debe: number | string;
  haber: number | string;
}

export interface AsientoContableDetalle extends AsientoContable {
  lineas: AsientoDetalleLinea[];
}

export interface LibroDiarioLinea {
  id_asiento: number;
  numero: number;
  fecha: string;
  asiento_descripcion: string;
  tipo: TipoAsiento;
  cuenta_codigo: string;
  cuenta_nombre: string;
  descripcion: string | null;
  debe: number | string;
  haber: number | string;
}

export interface LibroMayorMovimiento {
  id_asiento: number;
  numero: number;
  fecha: string;
  asiento_descripcion: string;
  descripcion: string | null;
  debe: number | string;
  haber: number | string;
  saldo: number;
}

export interface LibroMayorResponse {
  cuenta: { codigo: string; nombre: string; naturaleza: NaturalezaCuenta };
  movimientos: LibroMayorMovimiento[];
  saldoFinal: number;
}

// ── Configuración contable ──────────────────────────────────────────────

export interface ContabilidadConfigItem {
  id_config: number;
  concepto: string;
  descripcion: string | null;
  id_cuenta: number;
  cuenta_codigo: string;
  cuenta_nombre: string;
}

export interface ContabilidadConfigInput {
  concepto: string;
  descripcion?: string;
  id_cuenta: number;
}

// ── Tesorería ────────────────────────────────────────────────────────────

export type TipoCuentaTesoreria = "caja" | "banco";
export type TipoMovimientoTesoreria = "deposito" | "retiro" | "transferencia_entrada" | "transferencia_salida" | "ajuste";

export interface CuentaTesoreria {
  id_cuenta_tesoreria: number;
  tipo: TipoCuentaTesoreria;
  nombre: string;
  numero_cuenta: string | null;
  id_cuenta_contable: number;
  cuenta_codigo: string;
  cuenta_nombre: string;
  id_sucursal: number | null;
  estado: number;
  saldo: number | string;
}

export interface CuentaTesoreriaInput {
  tipo: TipoCuentaTesoreria;
  nombre: string;
  numero_cuenta?: string;
  id_cuenta_contable: number;
  id_sucursal?: number | null;
}

export interface MovimientoTesoreria {
  id_movimiento: number;
  id_cuenta_tesoreria: number;
  cuenta_tesoreria_nombre: string;
  fecha: string;
  tipo: TipoMovimientoTesoreria;
  monto: number | string;
  descripcion: string | null;
  referencia: string | null;
  id_asiento: number | null;
  conciliado: number;
  fecha_conciliacion: string | null;
}

export interface MovimientoTesoreriaInput {
  id_cuenta_tesoreria: number;
  id_cuenta_contra: number;
  fecha: string;
  tipo: TipoMovimientoTesoreria;
  monto: number;
  descripcion?: string;
  referencia?: string;
}

export interface CierreCaja {
  id_cierre: number;
  fecha: string;
  cuenta_tesoreria_nombre: string;
  saldo_inicial: number | string;
  total_ingresos: number | string;
  total_egresos: number | string;
  saldo_final: number | string;
  observacion: string | null;
  cerrado_en: string;
}

// ── Presupuestos ─────────────────────────────────────────────────────────

export interface Presupuesto {
  id_presupuesto: number;
  id_cuenta: number;
  cuenta_codigo: string;
  cuenta_nombre: string;
  naturaleza: NaturalezaCuenta;
  id_centro_costo: number | null;
  centro_costo_nombre: string | null;
  anio: number;
  mes: number | null;
  monto_presupuestado: number | string;
  ejecutado: number;
  disponible: number;
  porcentaje: number;
}

export interface PresupuestoInput {
  id_cuenta: number;
  id_centro_costo?: number | null;
  anio: number;
  mes?: number | null;
  monto_presupuestado: number;
}

// ── Estados financieros ──────────────────────────────────────────────────

export interface CuentaSaldo {
  id_cuenta: number;
  codigo: string;
  nombre: string;
  tipo?: TipoCuenta;
  naturaleza: NaturalezaCuenta;
  saldo: number;
}

export interface BalanceGeneral {
  fechaCorte: string;
  activo: CuentaSaldo[];
  pasivo: CuentaSaldo[];
  patrimonio: CuentaSaldo[];
  totalActivo: number;
  totalPasivo: number;
  totalPatrimonio: number;
  diferencia: number;
}

export interface EstadoResultados {
  fechaInicio: string;
  fechaFin: string;
  ingresos: CuentaSaldo[];
  costos: CuentaSaldo[];
  gastos: CuentaSaldo[];
  totalIngresos: number;
  totalCostos: number;
  totalGastos: number;
  utilidadNeta: number;
}

export interface BalanceComprobacionFila {
  id_cuenta: number;
  codigo: string;
  nombre: string;
  saldoAnterior: number;
  debePeriodo: number;
  haberPeriodo: number;
  saldoFinal: number;
}

export interface BalanceComprobacion {
  fechaInicio: string;
  fechaFin: string;
  filas: BalanceComprobacionFila[];
  totales: { debePeriodo: number; haberPeriodo: number };
}

// ── Auditoría contable ───────────────────────────────────────────────────

export interface AuditoriaContableEvento {
  id: number;
  actor_user_id: number | null;
  actor_role: string | null;
  target_type: string;
  target_id: string | null;
  action: string;
  metadata_json: string | null;
  ip: string | null;
  [key: string]: unknown;
}

// ── Resumen / dashboard ──────────────────────────────────────────────────

export interface ResumenContable {
  fechaInicio: string;
  fechaFin: string;
  ingresos: number;
  egresos: number;
  utilidadNeta: number;
  variacionUtilidad: number | null;
  flujoCaja: number;
  saldoDisponible: number;
  indicadorPresupuestario: { totalPresupuestado: number; cuentasConPresupuesto: number };
  alertas: { tipo: string; mensaje: string }[];
}
