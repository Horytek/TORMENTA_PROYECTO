import { useState } from 'react';
import axios from "@/api/axios";
import { toast } from "react-hot-toast";

export const useDeactivateSubcategoria = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const deactivateSubcategoria = async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.put(`/subcategorias/deactivate/${id}`);
      if (response.data.message === "Subcategoría dada de baja con éxito") {
        setSuccess(true);
        toast.success("Subcategoría dada de baja con éxito");
        // Aquí puedes llamar a un callback para refrescar la lista en el componente padre
      } else {
        toast.error("Error al desactivar la subcategoría");
      }
    } catch (err) {
      setError(err.message);
      toast.error("Error en el servidor interno");
    } finally {
      setLoading(false);
    }
  };

  return { deactivateSubcategoria, loading, error, success, setSuccess };
};