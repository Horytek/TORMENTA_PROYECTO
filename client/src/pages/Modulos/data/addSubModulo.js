import { useState } from 'react';
import axios from "@/api/axios";

export const addSubmodulo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const addSubmodulo = async (SubmoduloData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/modulos/submodulos/', SubmoduloData);

      if (response.data.code === 1) {
        setSuccess(response.data.message);
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        setError(response.data.message);
        return {
          success: false,
          error: response.data.message
        };
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
    addSubmodulo,
    isLoading,
    error,
    success
  };
};