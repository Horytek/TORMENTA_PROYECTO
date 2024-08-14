import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "react-hot-toast";

export const useDeleteSubcategoria = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('subcategoriaDeleted')) {
      toast.success("Subcategoría eliminada con éxito");
      localStorage.removeItem('subcategoriaDeleted');
    }
  }, []);

  const deleteSubcategoria = async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.delete(`http://localhost:4000/api/subcategorias/${id}`);
      if (response.data.code === 1) {
        localStorage.setItem('subcategoriaDeleted', 'true');
        window.location.reload();
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

  return { deleteSubcategoria, loading, error, success };
};
