import { createProductClient } from "./createProductClient";

const adminApi = createProductClient("horytek_delivery_admin_token");
const clienteApi = createProductClient("horytek_delivery_cliente_token");
const repartidorApi = createProductClient("horytek_delivery_repartidor_token");

export const getDeliveryAdminToken = adminApi.getToken;
export const setDeliveryAdminToken = adminApi.setToken;
export const getDeliveryClienteToken = clienteApi.getToken;
export const setDeliveryClienteToken = clienteApi.setToken;
export const getDeliveryRepartidorToken = repartidorApi.getToken;
export const setDeliveryRepartidorToken = repartidorApi.setToken;

/** @deprecated */
export function getDeliveryToken() {
  return getDeliveryAdminToken() || getDeliveryClienteToken() || getDeliveryRepartidorToken();
}
/** @deprecated */
export function setDeliveryToken(token: string | null) {
  setDeliveryAdminToken(token);
}

export async function bootstrapDelivery(body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
  plan?: string;
}) {
  const { data } = await adminApi.client.post("/delivery/bootstrap", body);
  return data;
}

export async function loginDeliveryAdmin(body: {
  slug: string;
  email: string;
  password: string;
}) {
  const { data } = await adminApi.client.post("/delivery/auth/admin", body);
  if (data?.success && data?.data?.token) {
    setDeliveryAdminToken(data.data.token);
    setDeliveryClienteToken(null);
    setDeliveryRepartidorToken(null);
  }
  return data;
}

export async function loginDeliveryCliente(body: {
  slug: string;
  telefono: string;
  password: string;
  nombre?: string;
}) {
  const { data } = await clienteApi.client.post("/delivery/auth/cliente", body);
  if (data?.success && data?.data?.token) {
    setDeliveryClienteToken(data.data.token);
    setDeliveryAdminToken(null);
    setDeliveryRepartidorToken(null);
  }
  return data;
}

export async function loginDeliveryRepartidor(body: {
  slug: string;
  telefono: string;
  password: string;
}) {
  const { data } = await repartidorApi.client.post("/delivery/auth/repartidor", body);
  if (data?.success && data?.data?.token) {
    setDeliveryRepartidorToken(data.data.token);
    setDeliveryAdminToken(null);
    setDeliveryClienteToken(null);
  }
  return data;
}

export async function getDeliveryPortal(slug: string) {
  const { data } = await adminApi.client.get(`/delivery/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function listDeliveryPedidos() {
  const { data } = await adminApi.client.get("/delivery/admin/pedidos");
  return data;
}

export async function createDeliveryPedido(body: {
  recojo: string;
  entrega: string;
  detalle?: string;
  id_cliente?: number;
}) {
  const { data } = await adminApi.client.post("/delivery/admin/pedidos", body);
  return data;
}

export async function assignDeliveryPedido(id: number, id_repartidor: number) {
  const { data } = await adminApi.client.patch(`/delivery/admin/pedidos/${id}/asignar`, {
    id_repartidor,
  });
  return data;
}

export async function patchDeliveryPedidoAdmin(
  id: number,
  body: { estado?: string; id_repartidor?: number | null }
) {
  const { data } = await adminApi.client.patch(`/delivery/admin/pedidos/${id}`, body);
  return data;
}

/** @deprecated usar assignDeliveryPedido / patchDeliveryPedidoAdmin */
export async function patchDeliveryPedido(
  id: number,
  body: { estado: string; id_repartidor?: number }
) {
  if (body.id_repartidor) return assignDeliveryPedido(id, body.id_repartidor);
  return patchDeliveryPedidoAdmin(id, body);
}

export async function listDeliveryRepartidores() {
  const { data } = await adminApi.client.get("/delivery/admin/repartidores");
  return data;
}

export async function createDeliveryRepartidor(body: {
  nombre: string;
  telefono?: string;
  password: string;
}) {
  const { data } = await adminApi.client.post("/delivery/admin/repartidores", body);
  return data;
}

export async function updateDeliveryRepartidor(
  id: number,
  body: { nombre?: string; telefono?: string | null; activo?: boolean }
) {
  const { data } = await adminApi.client.patch(`/delivery/admin/repartidores/${id}`, body);
  return data;
}

export async function setDeliveryRepartidorPassword(id: number, password: string) {
  const { data } = await adminApi.client.patch(`/delivery/admin/repartidores/${id}/password`, {
    password,
  });
  return data;
}

export async function listDeliveryClientes() {
  const { data } = await adminApi.client.get("/delivery/admin/clientes");
  return data;
}

export async function createDeliveryCliente(body: {
  nombre: string;
  telefono: string;
  password: string;
}) {
  const { data } = await adminApi.client.post("/delivery/admin/clientes", body);
  return data;
}

export async function updateDeliveryCliente(
  id: number,
  body: { nombre?: string; telefono?: string }
) {
  const { data } = await adminApi.client.patch(`/delivery/admin/clientes/${id}`, body);
  return data;
}

export async function setDeliveryClientePassword(id: number, password: string) {
  const { data } = await adminApi.client.patch(`/delivery/admin/clientes/${id}/password`, {
    password,
  });
  return data;
}

export async function listDeliveryAdmins() {
  const { data } = await adminApi.client.get("/delivery/admin/admins");
  return data;
}

export async function createDeliveryAdminUser(body: { email: string; password: string }) {
  const { data } = await adminApi.client.post("/delivery/admin/admins", body);
  return data;
}

export async function setDeliveryAdminPassword(id: number, password: string) {
  const { data } = await adminApi.client.patch(`/delivery/admin/admins/${id}/password`, {
    password,
  });
  return data;
}

export async function getDeliveryOperador() {
  const { data } = await adminApi.client.get("/delivery/admin/operador");
  return data;
}

export async function updateDeliveryOperador(body: { nombre: string }) {
  const { data } = await adminApi.client.patch("/delivery/admin/operador", body);
  return data;
}

export async function listDeliveryClientePedidos() {
  const { data } = await clienteApi.client.get("/delivery/cliente/pedidos");
  return data;
}

export async function createDeliveryClientePedido(body: {
  recojo: string;
  entrega: string;
  detalle?: string;
}) {
  const { data } = await clienteApi.client.post("/delivery/cliente/pedidos", body);
  return data;
}

export async function listDeliveryRepartidorPedidos() {
  const { data } = await repartidorApi.client.get("/delivery/repartidor/pedidos");
  return data;
}

export async function patchDeliveryRepartidorPedido(id: number, body: { estado: string }) {
  const { data } = await repartidorApi.client.patch(`/delivery/repartidor/pedidos/${id}`, body);
  return data;
}
