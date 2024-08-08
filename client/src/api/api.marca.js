import axios from "./axios";

export const getMarcasRequest = async () =>
  await axios.get("/marcas");

export const addMarcasRequest = async (marca) =>
  await axios.post("/marcas", marca);