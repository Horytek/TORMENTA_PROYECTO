import api from "@/api/axios";
import { isOk, unwrapList, unwrapOne } from "@/api/http";
import type {
  ExpenseCategory, Expense, ExpenseInput, PLSummary,
  CuentaContable, CuentaContableInput,
  CentroCosto, CentroCostoInput,
  PeriodoContable,
  AsientoContable, AsientoContableInput, AsientoContableDetalle,
  LibroDiarioLinea, LibroMayorResponse,
  ContabilidadConfigItem, ContabilidadConfigInput,
  CuentaTesoreria, CuentaTesoreriaInput,
  MovimientoTesoreria, MovimientoTesoreriaInput,
  CierreCaja,
  Presupuesto, PresupuestoInput,
  BalanceGeneral, EstadoResultados, BalanceComprobacion,
  AuditoriaContableEvento,
  ResumenContable,
} from "../types";

export const getExpenseCategories = async (): Promise<ExpenseCategory[]> =>
  unwrapList<ExpenseCategory>(await api.get("/gastos/categorias"));

export const createExpenseCategory = async (nombre: string): Promise<boolean> =>
  isOk(await api.post("/gastos/categorias", { nombre }));

export const getExpenses = async (params: { fechaInicio: string; fechaFin: string; idCategoria?: number }): Promise<Expense[]> =>
  unwrapList<Expense>(await api.get("/gastos", { params }));

export const createExpense = async (input: ExpenseInput): Promise<boolean> =>
  isOk(await api.post("/gastos", input));

export const deleteExpense = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/gastos/${id}`));

export const getPL = async (fechaInicio: string, fechaFin: string): Promise<PLSummary> => {
  const response = await api.get("/gastos/pl", { params: { fechaInicio, fechaFin } });
  const data = response.data;
  return data?.data ?? { ingresos: 0, gastos: 0, utilidad: 0, gastosPorCategoria: [] };
};

// ── Plan de cuentas ──────────────────────────────────────────────────────

export const getCuentasContables = async (): Promise<CuentaContable[]> =>
  unwrapList<CuentaContable>(await api.get("/contabilidad/cuentas"));

export const createCuentaContable = async (input: CuentaContableInput): Promise<boolean> =>
  isOk(await api.post("/contabilidad/cuentas", input));

export const updateCuentaContable = async (id: number, input: Partial<CuentaContableInput & { estado: boolean }>): Promise<boolean> =>
  isOk(await api.put(`/contabilidad/cuentas/${id}`, input));

export const deleteCuentaContable = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/contabilidad/cuentas/${id}`));

// ── Centros de costo ─────────────────────────────────────────────────────

export const getCentrosCosto = async (): Promise<CentroCosto[]> =>
  unwrapList<CentroCosto>(await api.get("/contabilidad/centros-costo"));

export const createCentroCosto = async (input: CentroCostoInput): Promise<boolean> =>
  isOk(await api.post("/contabilidad/centros-costo", input));

export const updateCentroCosto = async (id: number, input: Partial<CentroCostoInput & { estado: boolean }>): Promise<boolean> =>
  isOk(await api.put(`/contabilidad/centros-costo/${id}`, input));

// ── Periodos contables ───────────────────────────────────────────────────

export const getPeriodosContables = async (): Promise<PeriodoContable[]> =>
  unwrapList<PeriodoContable>(await api.get("/contabilidad/periodos"));

export const crearSiguientePeriodo = async (): Promise<boolean> =>
  isOk(await api.post("/contabilidad/periodos"));

export const cerrarPeriodo = async (id: number): Promise<boolean> =>
  isOk(await api.post(`/contabilidad/periodos/${id}/cerrar`));

export const reabrirPeriodo = async (id: number, motivo: string): Promise<boolean> =>
  isOk(await api.post(`/contabilidad/periodos/${id}/reabrir`, { motivo }));

// ── Asientos contables ───────────────────────────────────────────────────

export const getAsientos = async (params: { fechaInicio?: string; fechaFin?: string; idPeriodo?: number; estado?: string }): Promise<AsientoContable[]> =>
  unwrapList<AsientoContable>(await api.get("/contabilidad/asientos", { params }));

export const getAsiento = async (id: number): Promise<AsientoContableDetalle | null> =>
  unwrapOne<AsientoContableDetalle>(await api.get(`/contabilidad/asientos/${id}`));

export const createAsiento = async (input: AsientoContableInput): Promise<boolean> =>
  isOk(await api.post("/contabilidad/asientos", input));

export const revertirAsiento = async (id: number): Promise<boolean> =>
  isOk(await api.post(`/contabilidad/asientos/${id}/revertir`));

export const getLibroDiario = async (params: { fechaInicio?: string; fechaFin?: string; idPeriodo?: number }): Promise<LibroDiarioLinea[]> =>
  unwrapList<LibroDiarioLinea>(await api.get("/contabilidad/asientos/libro-diario", { params }));

export type FormatoContable = "concar" | "siscont" | "foxcont";

/** Descarga el archivo de importación (CONCAR/SISCONT/FOXCONT) — el backend ya arma el Content-Disposition. */
export const exportarAsientosContables = async (
  formato: FormatoContable,
  params: { fechaInicio?: string; fechaFin?: string; idPeriodo?: number }
): Promise<void> => {
  const response = await api.get("/contabilidad/asientos/exportar", {
    params: { ...params, formato },
    responseType: "blob",
  });
  const disposition = response.headers["content-disposition"] as string | undefined;
  const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? `asientos_${formato}.txt`;
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const getLibroMayor = async (params: { idCuenta: number; fechaInicio?: string; fechaFin?: string }): Promise<LibroMayorResponse | null> =>
  unwrapOne<LibroMayorResponse>(await api.get("/contabilidad/asientos/libro-mayor", { params }));

// ── Configuración contable ──────────────────────────────────────────────

export const getContabilidadConfig = async (): Promise<ContabilidadConfigItem[]> =>
  unwrapList<ContabilidadConfigItem>(await api.get("/contabilidad/configuracion"));

export const saveContabilidadConfig = async (input: ContabilidadConfigInput): Promise<boolean> =>
  isOk(await api.post("/contabilidad/configuracion", input));

export const deleteContabilidadConfig = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/contabilidad/configuracion/${id}`));

// ── Tesorería ────────────────────────────────────────────────────────────

export const getCuentasTesoreria = async (): Promise<CuentaTesoreria[]> =>
  unwrapList<CuentaTesoreria>(await api.get("/contabilidad/tesoreria/cuentas"));

export const createCuentaTesoreria = async (input: CuentaTesoreriaInput): Promise<boolean> =>
  isOk(await api.post("/contabilidad/tesoreria/cuentas", input));

export const getMovimientosTesoreria = async (params: { idCuentaTesoreria?: number; fechaInicio?: string; fechaFin?: string }): Promise<MovimientoTesoreria[]> =>
  unwrapList<MovimientoTesoreria>(await api.get("/contabilidad/tesoreria/movimientos", { params }));

export const createMovimientoTesoreria = async (input: MovimientoTesoreriaInput): Promise<boolean> =>
  isOk(await api.post("/contabilidad/tesoreria/movimientos", input));

export const conciliarMovimientoTesoreria = async (id: number): Promise<boolean> =>
  isOk(await api.post(`/contabilidad/tesoreria/movimientos/${id}/conciliar`));

export const getCierresCaja = async (params: { idCuentaTesoreria?: number }): Promise<CierreCaja[]> =>
  unwrapList<CierreCaja>(await api.get("/contabilidad/tesoreria/cierres", { params }));

export const cerrarCaja = async (input: { id_cuenta_tesoreria: number; fecha: string; observacion?: string }): Promise<boolean> =>
  isOk(await api.post("/contabilidad/tesoreria/cierres", input));

// ── Presupuestos ─────────────────────────────────────────────────────────

export const getPresupuestos = async (params: { anio?: number }): Promise<Presupuesto[]> =>
  unwrapList<Presupuesto>(await api.get("/contabilidad/presupuestos", { params }));

export const savePresupuesto = async (input: PresupuestoInput): Promise<boolean> =>
  isOk(await api.post("/contabilidad/presupuestos", input));

export const deletePresupuesto = async (id: number): Promise<boolean> =>
  isOk(await api.delete(`/contabilidad/presupuestos/${id}`));

// ── Estados financieros ──────────────────────────────────────────────────

export const getBalanceGeneral = async (fecha?: string): Promise<BalanceGeneral | null> =>
  unwrapOne<BalanceGeneral>(await api.get("/contabilidad/estados-financieros/balance-general", { params: { fecha } }));

export const getEstadoResultados = async (fechaInicio: string, fechaFin: string): Promise<EstadoResultados | null> =>
  unwrapOne<EstadoResultados>(await api.get("/contabilidad/estados-financieros/estado-resultados", { params: { fechaInicio, fechaFin } }));

export const getBalanceComprobacion = async (fechaInicio: string, fechaFin: string): Promise<BalanceComprobacion | null> =>
  unwrapOne<BalanceComprobacion>(await api.get("/contabilidad/estados-financieros/balance-comprobacion", { params: { fechaInicio, fechaFin } }));

// ── Auditoría contable ───────────────────────────────────────────────────

export const getAuditoriaContable = async (params: { entityType?: string; action?: string; limit?: number }): Promise<AuditoriaContableEvento[]> =>
  unwrapList<AuditoriaContableEvento>(await api.get("/contabilidad/auditoria", { params }));

// ── Resumen / dashboard ──────────────────────────────────────────────────

export const getResumenContable = async (params: { fechaInicio?: string; fechaFin?: string }): Promise<ResumenContable | null> =>
  unwrapOne<ResumenContable>(await api.get("/contabilidad/resumen", { params }));
