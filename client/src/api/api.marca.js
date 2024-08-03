import axios from "axios";

export const getMarcasRequest = async () =>
  await axios.get("http://localhost:4000/api/marcas");

export const addMarcasRequest = async (marca) =>
  await axios.post("http://localhost:4000/api/marcas", marca);