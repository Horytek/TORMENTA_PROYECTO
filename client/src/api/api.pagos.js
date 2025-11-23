import axios from "./axios";

export const getPagosRequest = async (params) =>
    await axios.get("/empresa/pagos", { params });

export const getPagosDashboardRequest = async (mes, anio) =>
    await axios.get("/empresa/pagos/dashboard", { params: { mes, anio } });

export const addPagoRequest = async (pago) =>
    await axios.post("/empresa/pagos", pago);

export const updatePagoRequest = async (id, data) =>
    await axios.put(`/empresa/pagos/${id}`, data);

export const deletePagoRequest = async (id) =>
    await axios.delete(`/empresa/pagos/${id}`);
