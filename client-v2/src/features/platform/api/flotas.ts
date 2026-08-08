import { createProductClient } from "./createProductClient";

const { client, getToken, setToken } = createProductClient("horytek_flotas_token");

export { getToken as getFlotasToken, setToken as setFlotasToken };

export async function bootstrapFlotas(body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post("/flotas/bootstrap", body);
  return data;
}

export async function loginFlotasAdmin(body: {
  slug: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post("/flotas/auth/admin", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function getFlotasPortal(slug: string) {
  const { data } = await client.get(`/flotas/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function listFlotasVehiculos() {
  const { data } = await client.get("/flotas/vehiculos");
  return data;
}

export async function createFlotasVehiculo(body: {
  placa: string;
  marca?: string;
  modelo?: string;
  soat_vence?: string;
}) {
  const { data } = await client.post("/flotas/vehiculos", body);
  return data;
}

export async function listFlotasConductores() {
  const { data } = await client.get("/flotas/conductores");
  return data;
}

export async function createFlotasConductor(body: {
  nombre: string;
  licencia?: string;
  password?: string;
}) {
  const { data } = await client.post("/flotas/conductores", body);
  return data;
}

export async function listFlotasCombustible() {
  const { data } = await client.get("/flotas/combustible");
  return data;
}

export async function createFlotasCombustible(body: {
  id_vehiculo: number;
  litros: number;
  monto: number;
  fecha: string;
}) {
  const { data } = await client.post("/flotas/combustible", body);
  return data;
}
