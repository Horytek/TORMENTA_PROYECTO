import { useState, useEffect } from 'react';
import axios from "@/api/axios";

const useGetClientes = (initialPage = 1, initialLimit = 10, initialDocType = "") => {
  const [clientes, setClientes] = useState([]);
  const [metadata, setMetadata] = useState({
    page: initialPage,
    limit: initialLimit,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientes = async (page = initialPage, limit = initialLimit, docType = initialDocType) => {
    try {
      setLoading(true);
      const response = await axios.get('/clientes/', { params: { page, limit, docType } });
      if (response.data.code === 1) {
        const clientesConId = response.data.data.map(cliente => ({
          id: cliente.id_cliente,
          ...cliente,
        }));
        setClientes(clientesConId);
        setMetadata(response.data.metadata);
      } else {
        setError('Error inesperado al obtener clientes.');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return { clientes, metadata, loading, error, refetch: fetchClientes };
};

export default useGetClientes;