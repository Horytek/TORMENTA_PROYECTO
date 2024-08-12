import axios from "./axios";

export const getRolesRequest = async () =>
  await axios.get("/rol");
