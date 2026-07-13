import api from "@/api/axios";
import { isOk, unwrapOne } from "@/api/http";
import type { Negocio, NegocioInput } from "../types";

export const getNegocio = async (): Promise<Negocio | null> =>
  unwrapOne<Negocio>(await api.get("/negocio"));

/**
 * Actualiza los datos del negocio (parcial). Si se adjunta un logo, se envía
 * como multipart/form-data (el backend usa upload.single('logo')); si no, JSON.
 */
export const updateNegocio = async (input: NegocioInput, logo?: File | null): Promise<boolean> => {
  if (logo) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(input)) {
      if (v != null) fd.append(k, String(v));
    }
    fd.append("logo", logo);
    return isOk(await api.put("/negocio", fd));
  }
  return isOk(await api.put("/negocio", input));
};
