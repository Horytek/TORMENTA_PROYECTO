import { useState, useEffect, useCallback } from "react";
import axios from "@/api/axios";

const useLibroVentasSunatData = (filters) => { // Recibimos los filtros como parámetro
  const [ventas, setVentas] = useState([]);
  const [totales, setTotales] = useState({
    total_importe: 0,
    total_igv: 0,
    total_general: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [metadata, setMetadata] = useState({
    total_records: 0,
    current_page: 1,
    per_page: 5,
    total_pages: 0
  });

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchLibroVentas = useCallback(async (pageNum = 1, pageSize = 5, currentFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/reporte/libro_ventas_sunat?page=${pageNum}&limit=${pageSize}&fechaInicio=${currentFilters.startDate || ''}&fechaFin=${currentFilters.endDate || ''}&tipoComprobante=${currentFilters.tipoComprobante || ''}&idSucursal=${currentFilters.idSucursal || ''}`);
      
      if (response.status === 200 && response.data) {
        const { data, metadata: paginationData } = response.data;
        setVentas(data.registroVentas || []);
        setTotales(data.totales || { total_importe: 0, total_igv: 0, total_general: 0 });
        setMetadata(paginationData);
      }
    } catch (error) {
      setError("Error al obtener datos");
      setVentas([]);
      setTotales({ total_importe: 0, total_igv: 0, total_general: 0 });
      console.error('Error en fetchLibroVentas:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]); // Dependencia de filters

  useEffect(() => {
    console.log('Ejecutando fetchLibroVentas con filtros:', filters);
    fetchLibroVentas(page, limit, filters);
  }, [page, limit, filters, fetchLibroVentas]);

  const changePage = (newPage) => {
    setPage(newPage);
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const updateFilters = (newFilters) => {
    //console.log('Actualizando filtros con:', newFilters);
    setPage(1);
  };

  return {
    ventas,
    totales,
    loading,
    error, 
    metadata,
    page,
    limit,
    changePage,
    changeLimit,
    updateFilters,
    refetch: fetchLibroVentas
  };
};

export default useLibroVentasSunatData;