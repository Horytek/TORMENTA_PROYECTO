import axios from "@/api/axios"; // usa baseURL del .env (VITE_API_URL)

export const exchangeVenta = async (data) => {
  try {
    const response = await axios.post("/ventas/intercambio", data);
    return response.data;
  } catch (error) {
    console.error("Error en exchangeVenta:", error);
    throw error;
  }
};
