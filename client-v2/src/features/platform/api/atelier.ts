import { createProductClient } from "./createProductClient";

const clienteApi = createProductClient("horytek_atelier_cliente_token");
const creadorApi = createProductClient("horytek_atelier_creador_token");
const adminApi = createProductClient("horytek_atelier_admin_token");

export const getAtelierClienteToken = clienteApi.getToken;
export const setAtelierClienteToken = clienteApi.setToken;
export const getAtelierCreadorToken = creadorApi.getToken;
export const setAtelierCreadorToken = creadorApi.setToken;
export const getAtelierAdminToken = adminApi.getToken;
export const setAtelierAdminToken = adminApi.setToken;

type Body = Record<string, unknown>;

async function req(
  api: typeof clienteApi,
  method: "get" | "post" | "patch" | "put" | "delete",
  path: string,
  body?: Body
) {
  const { data } = await api.client.request({ method, url: `/atelier${path}`, data: body });
  return data;
}

function apiForRole(role?: string) {
  if (role === "admin") return adminApi;
  if (role === "creador") return creadorApi;
  return clienteApi;
}

export async function loginAtelier(body: { email: string; password: string }) {
  const data = await req(clienteApi, "post", "/auth/login", body);
  const token = data?.data?.token;
  const role = data?.data?.user?.role || data?.data?.role;
  if (data?.success && token) {
    setAtelierClienteToken(null);
    setAtelierCreadorToken(null);
    setAtelierAdminToken(null);
    if (role === "admin") setAtelierAdminToken(token);
    else if (role === "creador") setAtelierCreadorToken(token);
    else setAtelierClienteToken(token);
  }
  return { ...data, data: { ...data?.data, role, token } };
}

export const registerAtelier = (body: Body) => req(clienteApi, "post", "/auth/register", body);
export const atelierMe = (role: "cliente" | "creador" | "admin") =>
  req(apiForRole(role), "get", "/auth/me");

export const listAtelierCreators = (query?: string) => {
  if (!query) return req(clienteApi, "get", "/creators");
  const path = query.startsWith("?") ? `/creators${query}` : `/creators?q=${encodeURIComponent(query)}`;
  return req(clienteApi, "get", path);
};
export const getAtelierCreator = (slug: string) =>
  req(clienteApi, "get", `/creators/${encodeURIComponent(slug)}`);
export const listAtelierCreatorPublicServices = (slug: string) =>
  req(clienteApi, "get", `/creators/${encodeURIComponent(slug)}/services`);
export const listAtelierCreatorPublicPortfolio = (slug: string) =>
  req(clienteApi, "get", `/creators/${encodeURIComponent(slug)}/portfolio`);
export const listAtelierCategories = () => req(clienteApi, "get", "/categories");

export const updateAtelierCreatorProfile = (body: Body) =>
  req(creadorApi, "patch", "/creator/profile", body);
export const listAtelierCreatorServices = () => req(creadorApi, "get", "/creator/services");
export const createAtelierService = (body: Body) => req(creadorApi, "post", "/creator/services", body);
export const updateAtelierService = (id: number, body: Body) =>
  req(creadorApi, "put", `/creator/services/${id}`, body);
export const deleteAtelierService = (id: number) =>
  req(creadorApi, "delete", `/creator/services/${id}`);
export const listAtelierCreatorPortfolio = () => req(creadorApi, "get", "/creator/portfolio");
export const createAtelierPortfolio = (body: Body) =>
  req(creadorApi, "post", "/creator/portfolio", body);
export const deleteAtelierPortfolio = (id: number) =>
  req(creadorApi, "delete", `/creator/portfolio/${id}`);
export const listAtelierCreatorRequests = () => req(creadorApi, "get", "/creator/requests");
export const sendAtelierQuote = (id: number, body: Body) =>
  req(creadorApi, "post", `/creator/requests/${id}/quotes`, body);
export const startAtelierOrder = (id: number) =>
  req(creadorApi, "post", `/creator/orders/${id}/start`);
export const listAtelierCreatorOrders = () => req(creadorApi, "get", "/creator/orders");
export const getAtelierWallet = () => req(creadorApi, "get", "/creator/wallet");

export const listAtelierClientRequests = () => req(clienteApi, "get", "/client/requests");
export const createAtelierRequest = (body: Body) =>
  req(clienteApi, "post", "/client/requests", body);
export const listAtelierClientOrders = () => req(clienteApi, "get", "/client/orders");
export const acceptAtelierQuote = (id: number) =>
  req(clienteApi, "post", `/client/quotes/${id}/accept`);
export const rejectAtelierQuote = (id: number) =>
  req(clienteApi, "post", `/client/quotes/${id}/reject`);
export const checkoutAtelierOrder = (id: number) =>
  req(clienteApi, "post", `/orders/${id}/checkout`);

export const getAtelierOrder = (id: number, role: "cliente" | "creador" = "cliente") =>
  req(role === "creador" ? creadorApi : clienteApi, "get", `/orders/${id}`);
export const listAtelierOrderMessages = (id: number, role: "cliente" | "creador" = "cliente") =>
  req(role === "creador" ? creadorApi : clienteApi, "get", `/orders/${id}/messages`);
export const sendAtelierMessage = (
  id: number,
  body: Body,
  role: "cliente" | "creador" = "cliente"
) => req(role === "creador" ? creadorApi : clienteApi, "post", `/orders/${id}/messages`, body);
export const addAtelierAttachment = (
  id: number,
  body: Body,
  role: "cliente" | "creador" = "creador"
) => req(role === "creador" ? creadorApi : clienteApi, "post", `/orders/${id}/attachments`, body);
export const requestAtelierRevision = (id: number, body: Body) =>
  req(clienteApi, "post", `/orders/${id}/revisions`, body);
export const reviewAtelierOrder = (id: number, body: Body) =>
  req(clienteApi, "post", `/orders/${id}/review`, body);
export const transitionAtelierOrder = (
  id: number,
  body: Body,
  role: "cliente" | "creador" = "creador"
) =>
  req(role === "creador" ? creadorApi : clienteApi, "patch", `/orders/${id}/transition`, body);

export const getAtelierAdminDashboard = () => req(adminApi, "get", "/admin/kpis");
export const listAtelierAdminOrders = () => req(adminApi, "get", "/admin/orders");
export const listAtelierAdminUsers = () => req(adminApi, "get", "/admin/users");
export const getAtelierCommission = () => req(adminApi, "get", "/admin/commission");
export const updateAtelierCommission = (body: Body) =>
  req(adminApi, "post", "/admin/commission-rules", body);
