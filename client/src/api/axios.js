import axios from "axios";
//import { API_URL } from "../config.js";

const instance = axios.create({
  baseURL: "https://tormenta-proyecto.vercel.app/api",
  withCredentials: true,
});

export default instance;