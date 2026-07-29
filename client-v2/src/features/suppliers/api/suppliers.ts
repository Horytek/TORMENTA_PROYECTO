import type { AxiosResponse } from "axios";
import api from "@/api/axios";
import type { Proveedor, ProveedorInput } from "../types";

/** Shapes the backend returns for destinatario endpoints. */
interface DestinatarioResponse {
  code?: number;
  success?: boolean;
  data?: unknown;
  message?: string;
}

const ok = (res: AxiosResponse<DestinatarioResponse>): boolean => {
  const d = res.data;
  return d?.code === 1 || d?.code === 2 || d?.success === true;
};

const unwrapList = <T>(res: AxiosResponse<DestinatarioResponse>, fallback: T[]): T[] => {
  const d = res.data;
  const list = d?.data ?? [];
  return Array.isArray(list) ? list : fallback;
};

// El backend arma cuerpos distintos para persona natural y jurídica.
const buildBody = (input: ProveedorInput) => {
  const base = {
    ubicacion: input.ubicacion || "proveedor",
    direccion: input.direccion?.trim() || null,
    telefono: input.telefono?.trim() || null,
    email: input.email?.trim() || null,
    estado_destinatario: input.estado ?? 1,
  };
  return input.tipo === "natural"
    ? { ...base, dni: input.dni?.trim(), nombres: input.nombres?.trim(), apellidos: input.apellidos?.trim() }
    : { ...base, ruc: input.ruc?.trim(), razon_social: input.razon_social?.trim() };
};

export const getProveedores = async (): Promise<Proveedor[]> => {
  const res = await api.get("/destinatario");
  return unwrapList<Record<string, unknown>>(res, []).map((d) => {
    const raw = d as Record<string, unknown>;
    return {
      ...(d as Partial<Proveedor>),
      id: (raw.id ?? raw.id_destinatario) as number,
      destinatario: raw.destinatario as string | undefined,
      documento: raw.documento as string | undefined,
      estado: (raw.estado ?? raw.estado_destinatario ?? 1) as number,
      productos_count: (raw.productos_count ?? 0) as number,
    } as Proveedor;
  });
};

export const getProveedor = async (id: number): Promise<Proveedor> => {
  const res = await api.get(`/destinatario/${id}`);
  const data = res.data?.data ?? res.data;
  return { ...data, id: data.id ?? data.id_destinatario };
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

// Cuentas por pagar: ver `@/features/purchases/api/purchases` (getAccountsPayable,
// getAccountPayablePayments, registerAccountPayablePayment).
