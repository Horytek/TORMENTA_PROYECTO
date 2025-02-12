import axios from "./axios";

export const getRolesRequest = async () =>
  await axios.get("/rol");

export const getRolRequest = async (id) =>
  await axios.get(`/rol/${id}`);

export const addRolRequest = async (user) =>
  await axios.post("/rol", user);

export const updateRolRequest = async (id, newFields) =>
  await axios.put(`/rol/${id}`, newFields); 

export const deleteRolRequest = async (id) =>
  await axios.delete(`/rol/${id}`);