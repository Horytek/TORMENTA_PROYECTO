import api from "@/api/axios";
import type { EstadoIntegraciones } from "../types";

/** Diagnóstico de las integraciones del tenant. El backend lo acota por JWT. */
export const getEstadoIntegraciones = async (): Promise<EstadoIntegraciones> => {
  const { data } = await api.get("/integraciones");
  return data?.data;
};
