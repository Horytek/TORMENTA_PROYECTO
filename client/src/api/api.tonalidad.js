import axios from "./axios";

export const getTonalidadesRequest = () => axios.get("/tonalidad");
export const createTonalidadRequest = (tonalidad) => axios.post("/tonalidad", tonalidad);
export const updateTonalidadRequest = (id, tonalidad) => axios.put(`/tonalidad/${id}`, tonalidad);
export const deleteTonalidadRequest = (id) => axios.delete(`/tonalidad/${id}`);
