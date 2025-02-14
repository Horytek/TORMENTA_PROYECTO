import axios from "./axios";

export const getFuncionesRequest = async () =>
  await axios.get("/funciones");

export const getFuncionRequest = async (id) =>
  await axios.get(`/funciones/${id}`);

export const addFuncionRequest = async (user) =>
  await axios.post("/funciones", user);

export const updateFuncionRequest = async (id, newFields) =>
  await axios.put(`/funciones/${id}`, newFields); 

/*export const deleteFuncionRequest = async (id) =>
  await axios.delete(`/funciones/${id}`);*/