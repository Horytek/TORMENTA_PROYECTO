import { useState, useEffect } from "react";
import { getLibroVentasSunat } from "@/services/reporte.services";

const useLibroVentasSunatData = (filters) => {
  const [allVentas, setAllVentas] = useState([]);
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

  // Solo carga una vez todos los registros
  useEffect(() => {
    const fetchAllVentas = async () => {
      setLoading(true);
      setError(null);
      try {
        // Solo una consulta, sin filtros ni paginación
        const response = await getLibroVentasSunat({});
        if (response && response.data) {
          setAllVentas(response.data || []);
        }
      } catch (error) {
        setError("Error al obtener datos");
        setAllVentas([]);
        console.error('Error en fetchAllVentas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllVentas();
  }, []);

  // Filtros y paginación locales
  useEffect(() => {
    setLoading(true);
    let filtradas = [...allVentas];

    // Filtro por sucursal
    if (filters.idSucursal) {
      filtradas = filtradas.filter(
        v => String(v.id_sucursal) === String(filters.idSucursal)
      );
    }

    // Filtro por tipo de comprobante (puede ser string, string separado por comas o array)
    if (filters.tipoComprobante) {
      let comprobantes = [];
      if (Array.isArray(filters.tipoComprobante)) {
        comprobantes = filters.tipoComprobante.map(tc => String(tc).toLowerCase());
      } else if (typeof filters.tipoComprobante === 'string') {
        comprobantes = filters.tipoComprobante
          .split(',')
          .map(tc => tc.trim().toLowerCase())
          .filter(tc => tc.length > 0);
      }
      if (comprobantes.length > 0) {
        filtradas = filtradas.filter(
          v => comprobantes.includes(String(v.tipo_comprobante).toLowerCase())
        );
      }
    }

    // Filtro por fechas
    if (filters.startDate && filters.endDate) {
      filtradas = filtradas.filter(v =>
        v.fecha >= filters.startDate && v.fecha <= filters.endDate
      );
    }

    // Totales
    const total_importe = filtradas.reduce((sum, row) => sum + (parseFloat(row.importe) || 0), 0);
    const total_igv = filtradas.reduce((sum, row) => sum + (parseFloat(row.igv) || 0), 0);
    const total_general = filtradas.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);

    setTotales({ total_importe, total_igv, total_general });

    // Paginación local
    const total_records = filtradas.length;
    const total_pages = Math.ceil(total_records / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    setVentas(filtradas.slice(start, end));
    setMetadata({
      total_records,
      current_page: page,
      per_page: limit,
      total_pages
    });
    setLoading(false);
  }, [allVentas, filters, page, limit]);

  const changePage = (newPage) => setPage(newPage);
  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };
  const updateFilters = (newFilters) => setPage(1);

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
    refetch: () => {} // Ya no es necesario, pero puedes dejarlo vacío
  };
};

export default useLibroVentasSunatData;