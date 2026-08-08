import { createProductClient } from "./createProductClient";

const { client, getToken, setToken } = createProductClient("horytek_delivery_token");

export { getToken as getDeliveryToken, setToken as setDeliveryToken };

export async function bootstrapDelivery(body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post("/delivery/bootstrap", body);
  return data;
}

export async function loginDeliveryAdmin(body: {
  slug: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post("/delivery/auth/admin", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function loginDeliveryCliente(body: {
  slug: string;
  telefono: string;
  password: string;
  nombre?: string;
}) {
  const { data } = await client.post("/delivery/auth/cliente", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function loginDeliveryRepartidor(body: {
  slug: string;
  telefono: string;
  password: string;
}) {
  const { data } = await client.post("/delivery/auth/repartidor", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function getDeliveryPortal(slug: string) {
  const { data } = await client.get(`/delivery/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function listDeliveryPedidos() {
  const { data } = await client.get("/delivery/pedidos");
  return data;
}

export async function createDeliveryPedido(body: {
  recojo: string;
  entrega: string;
  detalle?: string;
}) {
  const { data } = await client.post("/delivery/pedidos", body);
  return data;
}

export async function patchDeliveryPedido(
  id: number,
  body: { estado: string; id_repartidor?: number }
) {
  const { data } = await client.patch(`/delivery/pedidos/${id}`, body);
  return data;
}

export async function listDeliveryRepartidores() {
  const { data } = await client.get("/delivery/repartidores");
  return data;
}

export async function createDeliveryRepartidor(body: {
  nombre: string;
  telefono?: string;
  password: string;
}) {
  const { data } = await client.post("/delivery/repartidores", body);
  return data;
}
