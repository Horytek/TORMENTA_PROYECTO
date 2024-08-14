import axios from 'axios';
import { toast } from 'react-hot-toast';

const useProductosData = async (searchInput, setProductos) => {
  try {
    const response = await axios.get('http://localhost:4000/api/guia_remision/productos', {
      params: { 
        descripcion: searchInput,  // Enviar el input de búsqueda como parámetro para descripcion
        codbarras: searchInput     // Enviar el mismo input de búsqueda como parámetro para codbarras
      },
    });

    if (response.data.code === 1) {
      setProductos(response.data.data);
    } else {
      toast.error('Error al buscar productos.');
      setProductos([]);
    }
  } catch (error) {
    toast.error('Error al buscar productos.');
    console.error('Error en la solicitud: ', error.message);
    setProductos([]);
  }
};

export default useProductosData;
