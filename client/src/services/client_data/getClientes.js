import { useState, useEffect, useCallback } from 'react';
import { getClientesRequest } from "@/api/api.cliente";

const useGetClientes = (
  initialPage = 1,
  initialLimit = 10,
  initialDocType = "",
  initialDocNumber = "",
  initialSearchTerm = ""
) => {
  const [allClientes, setAllClientes] = useState([]); // Todos los clientes traídos una sola vez
  const [clientes, setClientes] = useState([]);
  const [metadata, setMetadata] = useState({
    page: initialPage,
    limit: initialLimit,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Solo consulta la base de datos la primera vez
  useEffect(() => {
    const fetchAllClientes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Trae todos los clientes sin filtros ni paginación
        const response = await getClientesRequest({
          page: 1,
          limit: 1000000, // Traer todos
        });
        if (response.data.code === 1) {
          const clientesConId = response.data.data.map(cliente => ({
            id: cliente.id_cliente,
            ...cliente,
          }));
          setAllClientes(clientesConId);
        } else {
          setError('Error inesperado al obtener clientes.');
        }
      } catch (err) {
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    fetchAllClientes();
  }, []);

  // Filtrado y paginación local
  const refetch = useCallback((
    page = initialPage,
    limit = initialLimit,
    docType = initialDocType,
    docNumber = initialDocNumber,
    searchTerm = initialSearchTerm
  ) => {
    setLoading(true);
    let filtrados = [...allClientes];

    // Filtro por tipo de documento
    if (docType === "dni") {
      if (docNumber) {
        filtrados = filtrados.filter(c => (c.dni || '').includes(docNumber));
      } else {
        filtrados = filtrados.filter(c => c.dni && c.dni !== '');
      }
    } else if (docType === "ruc") {
      if (docNumber) {
        filtrados = filtrados.filter(c => (c.ruc || '').includes(docNumber));
      } else {
        filtrados = filtrados.filter(c => c.ruc && c.ruc !== '');
      }
    }

    // Filtro por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtrados = filtrados.filter(c =>
        (c.nombres || '').toLowerCase().includes(term) ||
        (c.apellidos || '').toLowerCase().includes(term) ||
        (c.razon_social || '').toLowerCase().includes(term)
      );
    }

    const totalRecords = filtrados.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const start = (page - 1) * limit;
    const end = start + limit;
    setClientes(filtrados.slice(start, end));
    setMetadata({
      page,
      limit,
      totalPages,
      totalRecords,
    });
    setLoading(false);
  }, [allClientes]);

  // Refresca la tabla cada vez que cambia el array base
  useEffect(() => {
    refetch(initialPage, initialLimit, initialDocType, initialDocNumber, initialSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allClientes]);

  return {
    clientes,
    metadata,
    loading,
    error,
    refetch,
    setAllClientes // Para actualizar el array local tras agregar/editar/eliminar
  };
};

export default useGetClientes;