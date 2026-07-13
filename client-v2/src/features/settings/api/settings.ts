import api from "@/api/axios";
import { isOk, unwrapOne } from "@/api/http";
import type { Negocio, NegocioInput } from "../types";

export const getNegocio = async (): Promise<Negocio | null> =>
  unwrapOne<Negocio>(await api.get("/negocio"));

/** Actualiza los datos del negocio (parcial, sin logo — el logo requiere multipart). */
export const updateNegocio = async (input: NegocioInput): Promise<boolean> =>
  isOk(await api.put("/negocio", input));
