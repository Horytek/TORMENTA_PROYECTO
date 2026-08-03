import api from "@/api/axios";
import type { CatalogoPublico } from "../types";

export const getCatalogoPublico = async (idTenant: string | number): Promise<CatalogoPublico | null> => {
  const response = await api.get(`/catalogo/${idTenant}`);
  if (response.data?.code !== 1) return null;
  const data = response.data.data;
  return {
    ...data,
    // `precio` viene como DECIMAL de MySQL → mysql2 lo serializa como string.
    productos: (data.productos ?? []).map((p: typeof data.productos[number]) => ({ ...p, precio: Number(p.precio) })),
  };
};
