import { useState } from 'react';
import { addClienteRequest } from "@/api/api.cliente";

export const useAddClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addClient = async (clientData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await addClienteRequest(clientData);

      if (response.data.code === 1) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Error inesperado al crear cliente');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addClient,
    isLoading,
    error
  };
};