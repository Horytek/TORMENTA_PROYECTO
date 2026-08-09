import { createProductClient } from "./createProductClient";

const { client, getToken, setToken } = createProductClient("horytek_agenda_token");

export { getToken as getAgendaToken, setToken as setAgendaToken };

export async function bootstrapAgenda(body: {
  slug: string;
  nombre: string;
  email: string;
  password: string;
  plan?: string;
}) {
  const { data } = await client.post("/agenda/bootstrap", body);
  return data;
}

export async function loginAgendaAdmin(body: {
  slug: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post("/agenda/auth/admin", body);
  if (data?.success && data?.data?.token) setToken(data.data.token);
  return data;
}

export async function getAgendaPortal(slug: string) {
  const { data } = await client.get(`/agenda/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function listAgendaSlots() {
  const { data } = await client.get("/agenda/admin/slots");
  return data;
}

export async function createAgendaSlot(body: {
  inicia_en: string;
  minutos?: number;
  precio?: number;
}) {
  const { data } = await client.post("/agenda/admin/slots", body);
  return data;
}

export async function listAgendaReservas() {
  const { data } = await client.get("/agenda/admin/reservas");
  return data;
}

export async function listAgendaPublicSlots(slug: string) {
  const { data } = await client.get(`/agenda/portal/${encodeURIComponent(slug)}`);
  return data;
}

export async function reservarAgenda(
  slug: string,
  body: { id_slot: number; cliente_nombre: string; cliente_email: string }
) {
  const { data } = await client.post(
    `/agenda/portal/${encodeURIComponent(slug)}/reservas`,
    body
  );
  return data;
}
