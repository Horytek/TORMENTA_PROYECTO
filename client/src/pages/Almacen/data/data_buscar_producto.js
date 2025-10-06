import axios from "@/api/axios";
import { toast } from 'react-hot-toast';

const useProductosData = async (searchInput, setProductos) => {
  try {
    const term = (searchInput || '').trim();

    // Construir params solo con valores presentes
    const params = {};
    if (term) {
      params.descripcion = term;
      params.codbarras = term;
    }

    const response = await axios.get('/guia_remision/productos', { params });

    if (response.data.code === 1) {
      setProductos(response.data.data);
    } else {
      toast.error('Error al buscar productos.');
      setProductos([]);
    }
  } catch (error) {
    // Evitar múltiples toasts idénticos en ráfaga
    console.error('Error en la solicitud productos guía:', error?.message);
    if (!axios.isCancel?.(error)) {
      toast.error('No se pudieron cargar productos.');
    }
    setProductos([]);
  }
};

export default useProductosData;