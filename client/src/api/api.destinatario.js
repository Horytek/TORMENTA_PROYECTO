import axios from "./axios"; // Asegúrate de tener configurado axios

export const getDestinatariosRequest = async () => await axios.get("/destinatario");

export const getDestinatarioRequest = async (id) => await axios.get(`/destinatario/${id}`);

export const insertDestinatarioRequest = async (destinatario) => await axios.post("/destinatario", destinatario);

export const deleteDestinatarioRequest = async (id) => await axios.delete(`/destinatario/${id}`);

export const updateDestinatarioRequest = async (id, destinatario) => await axios.put(`/destinatario/update/${id}`, destinatario);

//export const deactivateDestinatarioRequest = async (id) => await axios.put(`/destinatario/deactivate/${id}`);
