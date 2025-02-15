import axios from "./axios";

export const getPlanesRequest = async () =>
  await axios.get("/planes");
