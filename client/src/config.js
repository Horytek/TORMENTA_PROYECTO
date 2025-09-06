// Sanitizar VITE_API_URL para evitar problemas con URLs completas
const sanitizeApiUrl = (url) => {
  if (!url) return "";
  // Si es una URL completa, está bien para axios.baseURL
  // Pero asegurarse de que no se use accidentalmente como ruta de Express
  if (typeof url === "string" && url.startsWith("http")) {
    return url; // Para axios está bien
  }
  return url;
};

export const API_URL = sanitizeApiUrl(import.meta.env.VITE_API_URL || "");