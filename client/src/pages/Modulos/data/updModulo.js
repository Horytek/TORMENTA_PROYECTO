import { useState } from "react";
import axios from "@/api/axios";

export const useUpdateModulo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateModulo = async (id, moduleData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.put(`/modulos/${id}`, moduleData, {
        headers: { 'Content-Type': 'application/json' }
      });

      setSuccess(true);
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || "Error desconocido al actualizar módulo";
      setError(errorMessage);
      throw err;
    }
  };

  const resetStates = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  };

  return {
    updateModulo,
    loading,
    error,
    success,
    resetStates
  };
};

export default useUpdateModulo;