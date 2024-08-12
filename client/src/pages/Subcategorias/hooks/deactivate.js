import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from "react-hot-toast";

export const useDeactivateSubcategoria = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('subcategoriaDeactivated')) {
      toast.success("Subcategoría dada de baja con éxito");
      localStorage.removeItem('subcategoriaDeactivated');
    }
  }, []);

  const deactivateSubcategoria = async (id) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.put(`http://localhost:4000/api/subcategorias/deactivate/${id}`);
      if (response.data.message === "Subcategoría dada de baja con éxito") {
        localStorage.setItem('subcategoriaDeactivated', 'true');
        window.location.reload();
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

  return { deactivateSubcategoria, loading, error, success };
};
