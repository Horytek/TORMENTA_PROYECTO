import { createProductClient } from "./createProductClient";

const { client, getToken, setToken } = createProductClient("horytek_taxi_token");

export { getToken as getTaxiToken, setToken as setTaxiToken };

export async function bootstrapTaxi(body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post("/taxi/bootstrap", body);
  return data;
}

export async function loginTaxiAdmin(body: { slug: string; email: string; password: string }) {
  const { data } = await client.post("/taxi/auth/admin", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function loginTaxiPasajero(body: {
  slug: string;
  telefono: string;
  password: string;
  nombre?: string;
}) {
  const { data } = await client.post("/taxi/auth/pasajero", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function loginTaxiConductor(body: {
  slug: string;
  telefono: string;
  password: string;
}) {
  const { data } = await client.post("/taxi/auth/conductor", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function getTaxiPortal(slug: string) {
  const { data } = await client.get(`/taxi/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function listTaxiViajes() {
  const { data } = await client.get("/taxi/viajes");
  return data;
}

export async function createTaxiViaje(body: { origen: string; destino: string }) {
  const { data } = await client.post("/taxi/viajes", body);
  return data;
}

export async function patchTaxiViaje(id: number, body: { estado: string; id_conductor?: number }) {
  const { data } = await client.patch(`/taxi/viajes/${id}`, body);
  return data;
}

export async function listTaxiConductores() {
  const { data } = await client.get("/taxi/conductores");
  return data;
}

export async function createTaxiConductor(body: {
  nombre: string;
  telefono?: string;
  password: string;
}) {
  const { data } = await client.post("/taxi/conductores", body);
  return data;
}
