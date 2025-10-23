import axios from "./axios";

export const getUsuariosRequest = async () =>
  await axios.get("/usuario");

export const getUsuarioRequest = async (id) =>
  await axios.get(`/usuario/${id}`);

export const getUsuarioRequest_1 = async (id) =>
  await axios.get(`/logotipo/${id}`);

export const addUsuarioRequest = async (user) =>
  await axios.post("/usuario", user);

export const updateUsuarioRequest = async (id, newFields) =>
  await axios.put(`/usuario/${id}`, newFields); 

export const updateUsuarioPlanRequest = async (id, newFields) =>
  await axios.put(`/usuario/plan/${id}`, newFields); 

export const deleteUsuarioRequest = async (id) =>
  await axios.delete(`/usuario/${id}`);

export const addUsuarioLandingRequest = async (user) =>
  await axios.post("/usuario/landing", user);
