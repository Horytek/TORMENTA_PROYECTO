import api from "@/api/axios";
import type { Proveedor, ProveedorInput } from "../types";

const ok = (res: { data: any }): boolean => res.data?.success ?? res.data === true;

// El backend arma cuerpos distintos para persona natural y jurídica.
const buildBody = (input: ProveedorInput) => {
  const base = {
    direccion: input.direccion?.trim() || null,
    telefono: input.telefono?.trim() || null,
    email: input.email?.trim() || null,
    estado: input.estado ?? 1,
  };
  return input.tipo === "natural"
    ? { ...base, dni: input.dni?.trim(), nombres: input.nombres?.trim(), apellidos: input.apellidos?.trim() }
    : { ...base, ruc: input.ruc?.trim(), razon_social: input.razon_social?.trim() };
};

export const getProveedores = async (): Promise<Proveedor[]> => {
  const res = await api.get("/destinatario");
  const list = res.data?.success ? res.data.data : (res.data ?? []);
  return (Array.isArray(list) ? list : []).map((d: any) => ({
    ...d,
    id: d.id ?? d.id_destinatario,
  }));
};

export const createProveedor = async (input: ProveedorInput): Promise<boolean> => {
  const body = buildBody(input);
  const res =
    input.tipo === "natural"
      ? await api.post("/destinatario/natural", body)
      : await api.post("/destinatario/juridico", body);
  return ok(res);
};

export const updateProveedor = async (id: number, input: ProveedorInput): Promise<boolean> => {
  const body = buildBody(input);
  const res =
    input.tipo === "natural"
      ? await api.put(`/destinatario/update/natural/${id}`, body)
      : await api.put(`/destinatario/update/juridico/${id}`, body);
  return ok(res);
};

export const deleteProveedor = async (id: number): Promise<boolean> => {
  const res = await api.delete(`/destinatario/${id}`);
  return ok(res);
};
