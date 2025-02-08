import axios from "./axios"; // Asegúrate de tener configurado axios

export const getVendedoresRequest = async () => await axios.get("/vendedores");

export const getVendedorRequest = async (id) => await axios.get(`/vendedores/${id}`);

export const addVendedorRequest = async (vendedor) => await axios.post("/vendedores", vendedor);

export const deleteVendedorRequest = async (id) => await axios.delete(`/vendedores/${id}`);

export const updateVendedorRequest = async (id, vendedor) => await axios.put(`/vendedores/update/${id}`, vendedor);

export const deactivateVendedorRequest = async (id) => await axios.put(`/vendedores/deactivate/${id}`);
