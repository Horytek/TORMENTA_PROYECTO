import axios from "./axios";

export const getNotificacionesRequest = async () =>
  await axios.get("/dashboard/notificaciones");