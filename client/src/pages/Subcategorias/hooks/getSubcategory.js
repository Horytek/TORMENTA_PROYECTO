import { useState, useEffect } from 'react';
import axios from 'axios';

export const useSubcategoriasConCategoria = () => {
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubcategorias = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/subcategorias/subcategoria_list');
        setSubcategorias(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategorias();
  }, []);

  return { subcategorias, loading, error };
};
