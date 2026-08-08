import api from "@/api/axios";

export async function getStockSyncStatus() {
  const { data } = await api.get("/stock-sync/status");
  return data;
}

export async function listSyncCanales() {
  const { data } = await api.get("/stock-sync/canales");
  return data;
}

export async function createSyncCanal(body: { codigo: string; nombre: string }) {
  const { data } = await api.post("/stock-sync/canales", body);
  return data;
}

export async function listSyncMapeos(id_canal?: number) {
  const { data } = await api.get("/stock-sync/mapeos", {
    params: id_canal ? { id_canal } : undefined,
  });
  return data;
}

export async function createSyncMapeo(body: {
  id_canal: number;
  sku_origen: string;
  sku_destino: string;
}) {
  const { data } = await api.post("/stock-sync/mapeos", body);
  return data;
}

export async function listSyncJobs() {
  const { data } = await api.get("/stock-sync/jobs");
  return data;
}

export async function enqueueSyncJob(body: { tipo: "pull" | "push" | "reconcile"; id_canal?: number }) {
  const { data } = await api.post("/stock-sync/jobs", body);
  return data;
}
