import axios from "axios";

export const getCategoriasRequest = async () =>
  await axios.get("http://localhost:4000/api/categorias");