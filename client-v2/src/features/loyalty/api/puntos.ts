import api from "@/api/axios";
import type { PuntosConfig, PuntosCliente } from "../types";

export const getPuntosConfig = async (): Promise<PuntosConfig> => {
  const response = await api.get("/puntos/config");
  return response.data?.data ?? { activo: false, soles_por_punto: 10, valor_canje_por_punto: 0.1 };
};

export const updatePuntosConfig = async (config: PuntosConfig): Promise<boolean> => {
  const response = await api.put("/puntos/config", config);
  return response.data?.code === 1;
};

export const getPuntosCliente = async (idCliente: number): Promise<PuntosCliente> => {
  const response = await api.get(`/puntos/cliente/${idCliente}`);
  return response.data?.data ?? { saldo: 0, config: { activo: false, soles_por_punto: 10, valor_canje_por_punto: 0.1 } };
};
