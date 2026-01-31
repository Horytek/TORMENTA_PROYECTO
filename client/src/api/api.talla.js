import axios from "./axios";

export const getTallasRequest = () => axios.get("/talla");
export const createTallaRequest = (talla) => axios.post("/talla", talla);
export const updateTallaRequest = (id, talla) => axios.put(`/talla/${id}`, talla);
export const deleteTallaRequest = (id) => axios.delete(`/talla/${id}`);
