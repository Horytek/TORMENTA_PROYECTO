import { useState } from "react";
import axios from "@/api/axios";

export const useUpdateSubModulo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateSubModulo = async (id, subModuleData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.put(`/submodulos/${id}`, subModuleData, {
        headers: { 'Content-Type': 'application/json' }
      });

      setSuccess(true);
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || "Error desconocido al actualizar submódulo";
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
    updateSubModulo,
    loading,
    error,
    success,
    resetStates
  };
};

export default useUpdateSubModulo;