import { createProductClient } from "./createProductClient";

/** Tokens separados: evita que admin/pasajero/conductor se pisen entre sí. */
const adminApi = createProductClient("horytek_taxi_admin_token");
const pasajeroApi = createProductClient("horytek_taxi_pasajero_token");
const conductorApi = createProductClient("horytek_taxi_conductor_token");

export const getTaxiAdminToken = adminApi.getToken;
export const setTaxiAdminToken = adminApi.setToken;
export const getTaxiPasajeroToken = pasajeroApi.getToken;
export const setTaxiPasajeroToken = pasajeroApi.setToken;
export const getTaxiConductorToken = conductorApi.getToken;
export const setTaxiConductorToken = conductorApi.setToken;

/** @deprecated usar getTaxiAdminToken / getTaxiPasajeroToken / getTaxiConductorToken */
export function getTaxiToken() {
  return getTaxiAdminToken() || getTaxiPasajeroToken() || getTaxiConductorToken();
}

/** @deprecated */
export function setTaxiToken(token: string | null) {
  setTaxiAdminToken(token);
}

export async function bootstrapTaxi(body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
  plan?: string;
}) {
  const { data } = await adminApi.client.post("/taxi/bootstrap", body);
  return data;
}

export async function loginTaxiAdmin(body: { slug: string; email: string; password: string }) {
  const { data } = await adminApi.client.post("/taxi/auth/admin", body);
  if (data?.success && data?.data?.token) {
    setTaxiAdminToken(data.data.token);
    setTaxiPasajeroToken(null);
    setTaxiConductorToken(null);
  }
  return data;
}

export async function loginTaxiPasajero(body: {
  slug: string;
  telefono: string;
  password: string;
}) {
  const { data } = await pasajeroApi.client.post("/taxi/auth/pasajero", body);
  if (data?.success && data?.data?.token) {
    setTaxiPasajeroToken(data.data.token);
    setTaxiAdminToken(null);
    setTaxiConductorToken(null);
  }
  return data;
}

export async function registerTaxiPasajero(body: {
  slug: string;
  nombre: string;
  telefono: string;
  password: string;
}) {
  const { data } = await pasajeroApi.client.post("/taxi/auth/pasajero/registro", body);
  if (data?.success && data?.data?.token) {
    setTaxiPasajeroToken(data.data.token);
    setTaxiAdminToken(null);
    setTaxiConductorToken(null);
  }
  return data;
}

export async function loginTaxiConductor(body: {
  slug: string;
  telefono: string;
  password: string;
}) {
  const { data } = await conductorApi.client.post("/taxi/auth/conductor", body);
  if (data?.success && data?.data?.token) {
    setTaxiConductorToken(data.data.token);
    setTaxiAdminToken(null);
    setTaxiPasajeroToken(null);
  }
  return data;
}

export async function getTaxiPortal(slug: string) {
  const { data } = await adminApi.client.get(`/taxi/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function listTaxiViajes() {
  const { data } = await adminApi.client.get("/taxi/admin/viajes");
  return data;
}

export async function listTaxiConductores() {
  const { data } = await adminApi.client.get("/taxi/admin/conductores");
  return data;
}

export async function createTaxiConductor(body: {
  nombre: string;
  telefono?: string;
  password: string;
  placa?: string;
  vehiculo?: string;
  notas?: string;
}) {
  const { data } = await adminApi.client.post("/taxi/admin/conductores", body);
  return data;
}

export async function updateTaxiConductor(
  id: number,
  body: {
    nombre?: string;
    telefono?: string | null;
    placa?: string | null;
    vehiculo?: string | null;
    notas?: string | null;
    activo?: boolean;
  }
) {
  const { data } = await adminApi.client.patch(`/taxi/admin/conductores/${id}`, body);
  return data;
}

export async function setTaxiConductorPassword(id: number, password: string) {
  const { data } = await adminApi.client.patch(`/taxi/admin/conductores/${id}/password`, {
    password,
  });
  return data;
}

export async function listTaxiPasajeros() {
  const { data } = await adminApi.client.get("/taxi/admin/pasajeros");
  return data;
}

export async function createTaxiPasajeroAdmin(body: {
  nombre: string;
  telefono: string;
  password: string;
}) {
  const { data } = await adminApi.client.post("/taxi/admin/pasajeros", body);
  return data;
}

export async function updateTaxiPasajero(
  id: number,
  body: { nombre?: string; telefono?: string; activo?: boolean }
) {
  const { data } = await adminApi.client.patch(`/taxi/admin/pasajeros/${id}`, body);
  return data;
}

export async function setTaxiPasajeroPassword(id: number, password: string) {
  const { data } = await adminApi.client.patch(`/taxi/admin/pasajeros/${id}/password`, {
    password,
  });
  return data;
}

export async function listTaxiAdmins() {
  const { data } = await adminApi.client.get("/taxi/admin/admins");
  return data;
}

export async function createTaxiAdminUser(body: { email: string; password: string }) {
  const { data } = await adminApi.client.post("/taxi/admin/admins", body);
  return data;
}

export async function setTaxiAdminPassword(id: number, password: string) {
  const { data } = await adminApi.client.patch(`/taxi/admin/admins/${id}/password`, {
    password,
  });
  return data;
}

export async function getTaxiOperador() {
  const { data } = await adminApi.client.get("/taxi/admin/operador");
  return data;
}

export async function updateTaxiOperador(body: { nombre: string }) {
  const { data } = await adminApi.client.patch("/taxi/admin/operador", body);
  return data;
}

export async function patchTaxiViajeAdmin(
  id: number,
  body: { estado?: string; id_conductor?: number | null }
) {
  const { data } = await adminApi.client.patch(`/taxi/admin/viajes/${id}`, body);
  return data;
}

export async function assignTaxiViaje(id: number, id_conductor: number) {
  const { data } = await adminApi.client.patch(`/taxi/admin/viajes/${id}/asignar`, {
    id_conductor,
  });
  return data;
}

export async function listTaxiPasajeroViajes() {
  const { data } = await pasajeroApi.client.get("/taxi/pasajero/viajes");
  return data;
}

export async function createTaxiViaje(body: { origen: string; destino: string }) {
  const { data } = await pasajeroApi.client.post("/taxi/pasajero/viajes", body);
  return data;
}

export async function listTaxiConductorViajes() {
  const { data } = await conductorApi.client.get("/taxi/conductor/viajes");
  return data;
}

export async function patchTaxiConductorViaje(id: number, body: { estado: string }) {
  const { data } = await conductorApi.client.patch(`/taxi/conductor/viajes/${id}`, body);
  return data;
}
