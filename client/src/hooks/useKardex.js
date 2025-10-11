import { useState, useEffect } from 'react';
import { 
  getAlmacenesKardex, 
  getMarcasKardex, 
  getCategoriasKardex, 
  getSubcategoriasKardex 
} from '@/services/kardex.services';

/**
 * Custom Hook para gestionar datos de Kardex
 */
export const useKardexData = () => {
  const [almacenes, setAlmacenes] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Ejecutar peticiones en paralelo
      const [almacenesRes, marcasRes, categoriasRes] = await Promise.all([
        getAlmacenesKardex(),
        getMarcasKardex(),
        getCategoriasKardex()
      ]);

      if (almacenesRes.success) setAlmacenes(almacenesRes.data);
      if (marcasRes.success) setMarcas(marcasRes.data);
      if (categoriasRes.success) setCategorias(categoriasRes.data);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  return { 
    almacenes, 
    setAlmacenes, 
    marcas, 
    setMarcas, 
    categorias, 
    setCategorias,
    loading 
  };
};

/**
 * Custom Hook para subcategorías (depende de categoría seleccionada)
 */
export const useSubcategoriasKardex = (idCategoria) => {
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idCategoria) {
      setSubcategorias([]);
      return;
    }

    const fetchSubcategorias = async () => {
      setLoading(true);
      const result = await getSubcategoriasKardex(idCategoria);
      if (result.success) setSubcategorias(result.data);
      setLoading(false);
    };

    fetchSubcategorias();
  }, [idCategoria]);

  return { subcategorias, setSubcategorias, loading };
};

/**
 * Custom Hook solo para almacenes
 */
export const useAlmacenesKardex = () => {
  const [almacenes, setAlmacenes] = useState([]);

  useEffect(() => {
    const fetchAlmacenes = async () => {
      const result = await getAlmacenesKardex();
      if (result.success) setAlmacenes(result.data);
    };
    fetchAlmacenes();
  }, []);

  return { almacenes, setAlmacenes };
};

/**
 * Custom Hook solo para marcas
 */
export const useMarcasKardex = () => {
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    const fetchMarcas = async () => {
      const result = await getMarcasKardex();
      if (result.success) setMarcas(result.data);
    };
    fetchMarcas();
  }, []);

  return { marcas, setMarcas };
};

/**
 * Custom Hook solo para categorías
 */
export const useCategoriasKardex = () => {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      const result = await getCategoriasKardex();
      if (result.success) setCategorias(result.data);
    };
    fetchCategorias();
  }, []);

  return { categorias, setCategorias };
};

export default useKardexData;

