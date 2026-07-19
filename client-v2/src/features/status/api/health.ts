import api from "@/api/axios";

export interface ServiceStatus {
  status: "up" | "down" | string;
  latency?: string;
  uptime?: number;
}

export interface SystemStatus {
  status: "operational" | "degraded" | string;
  timestamp: string;
  services: {
    database?: ServiceStatus;
    server?: ServiceStatus;
  };
}

/** GET /health (público). Si el backend responde 5xx con cuerpo de estado degradado, se devuelve ese cuerpo. */
export const getSystemStatus = async (): Promise<SystemStatus> => {
  try {
    const res = await api.get("/health");
    return res.data;
  } catch (error) {
    const data = (error as { response?: { data?: SystemStatus } })?.response?.data;
    if (data?.status) return data;
    throw error;
  }
};
