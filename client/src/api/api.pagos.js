import axios from "./axios";

export const getPagosRequest = async (params) =>
    await axios.get("/pagos", { params });

export const getPagosDashboardRequest = async (mes, anio) =>
    await axios.get("/pagos/dashboard", { params: { mes, anio } });

export const addPagoRequest = async (pago) =>
    await axios.post("/pagos", pago);

export const updatePagoRequest = async (id, data) =>
    await axios.put(`/pagos/${id}`, data);

export const deletePagoRequest = async (id) =>
    await axios.delete(`/pagos/${id}`);
