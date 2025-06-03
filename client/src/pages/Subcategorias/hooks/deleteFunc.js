import { useState } from 'react';
import axios from "@/api/axios";
import { toast } from "react-hot-toast";

export const useDeleteSubcategoria = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const deleteSubcategoria = async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.delete(`/subcategorias/${id}`);
      if (response.data.code === 1) {
        setSuccess(true);
        toast.success("Subcategoría eliminada con éxito");
        // Aquí puedes llamar a un callback para refrescar la lista en el componente padre
      } else {
        toast.error("Error al eliminar la subcategoría");
      }
    } catch (err) {
      setError(err.message);
      toast.error("Error en el servidor interno");
    } finally {
      setLoading(false);
    }
  };

  return { deleteSubcategoria, loading, error, success, setSuccess };
};