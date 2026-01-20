import axios from "@/api/axios";

// Obtener todos los clientes
export const getClientesRequest = () => axios.get("/clientes");

// Obtener cliente por ID
export const getClienteRequest = (id) => axios.get(`/clientes/getCliente/${id}`);

// Agregar un nuevo cliente
export const addClienteRequest = (cliente) => axios.post("/clientes", cliente);

// Actualizar un cliente
export const updateClienteRequest = (cliente) => axios.put("/clientes/updateCliente", cliente);

// Eliminar un cliente (por ID)
export const deleteClienteRequest = (id) => axios.delete(`/clientes/deleteCliente/${id}`);

// Desactivar cliente (por ID)
export const deactivateClienteRequest = (id) => axios.put(`/clientes/deactivateCliente/${id}`);

export const getComprasClienteRequest = (params) => axios.get("/clientes/compras", { params });

export const getHistorialClienteRequest = (params) => axios.get("/clientes/historial", { params });

export const getClientStatsRequest = () => axios.get("/clientes/stats");

export const getClientesExternosRequest = () => axios.get("/clientes/externos");
export const getComprasClienteExternoRequest = (params) => axios.get("/clientes/externos/compras", { params });
export const getCompraExternoByIdRequest = (id) => axios.get(`/clientes/externos/compra/${id}`);
export const getComprasClienteExternoByDocRequest = (params) => axios.get("/clientes/externos/compras-by-doc", { params });
