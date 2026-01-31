import axios from "./axios";

export const getNotificacionesRequest = async (params) =>
  await axios.get("/dashboard/notificaciones", { params });