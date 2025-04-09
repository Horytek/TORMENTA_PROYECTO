import axios from "./axios";

export const getModulosRequest = async () => {
  return await axios.get("/rutas"); // Correcto: /api/rutas
};

export const getSubmodulosRequest = async () => {
  return await axios.get("/rutas/submodulos"); // Correcto: /api/rutas/submodulos
};

export const getModulosConSubmodulosRequest = async () => {
  return await axios.get("/rutas/modulos"); // Correcto: /api/rutas/modulos
};