import api from "@/api/axios";
import type { TurnoCaja, DesgloseMetodo, CierreTurnoResultado } from "../types";

export const getTurnoActivo = async (idSucursal: number): Promise<TurnoCaja | null> => {
  const response = await api.get("/caja-turno/activo", { params: { id_sucursal: idSucursal } });
  return response.data?.data ?? null;
};

export const abrirTurno = async (idSucursal: number, montoInicial: number): Promise<number> => {
  const response = await api.post("/caja-turno/abrir", { id_sucursal: idSucursal, monto_inicial: montoInicial });
  return response.data?.id_turno;
};

export const cerrarTurno = async (
  idTurno: number,
  declarado: DesgloseMetodo,
  observaciones?: string
): Promise<CierreTurnoResultado> => {
  const response = await api.post(`/caja-turno/${idTurno}/cerrar`, { declarado, observaciones });
  return response.data?.data;
};

export const getHistorialTurnos = async (idSucursal?: number): Promise<TurnoCaja[]> => {
  const response = await api.get("/caja-turno", { params: idSucursal ? { id_sucursal: idSucursal } : undefined });
  return response.data?.data ?? [];
};
