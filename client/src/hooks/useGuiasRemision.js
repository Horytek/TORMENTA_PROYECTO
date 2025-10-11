import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

/**
 * Custom Hook para gestionar guías de remisión
 * @param {Object} filters - Filtros para búsqueda de guías
 */
const useGuiasRemision = (filters) => {
  const [guias, setGuias] = useState([]);
  const [totalGuias, setTotalGuias] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [guiasPerPage, setGuiasPerPage] = useState(10);
  const [detalles, setDetalles] = useState([]);

  const fetchGuias = useCallback(async () => {
    try {
      const response = await axios.get('/guia_remision/', {
        params: {
          page: currentPage - 1,
          limit: guiasPerPage,
          num_guia: filters.numGuia,
          documento: filters.documento,
          nombre_sucursal: filters.sucursalSeleccionado,
          fecha_i: filters.fecha_i,
          fecha_e: filters.fecha_e,
        }
      });

      if (response.data.code === 1) {
        const guiasFormateadas = response.data.data.map(guia => ({
          id: guia.id,
          fecha: guia.fecha,
          numGuia: guia.num_guia,
          cliente: guia.cliente,
          documento: guia.documento,
          vendedor: guia.vendedor,
          dni: guia.dni,
          serieNum: guia.serieNum,
          num: guia.num,
          total: guia.total ? `S/ ${parseFloat(guia.total).toFixed(2)}` : 'S/ 0.00',
          concepto: guia.concepto,
          dirpartida: guia.dir_partida,
          dirdestino: guia.dir_destino,
          observacion: guia.observacion,
          docpub: guia.docpub,
          docpriv: guia.docpriv,
          canti: guia.canti,
          peso: guia.peso,
          h_generacion: guia.h_generacion,
          f_anulacion: guia.f_anulacion,
          u_modifica: guia.u_modifica,
          transpub: guia.transportistapub,
          transpriv: guia.transportistapriv,
          estado: guia.estado === 0 ? 'Inactivo' :
                  guia.estado === 1 ? 'Activo' :
                  guia.estado === 2 ? 'En proceso' :
                  'Desconocido',
          detalles: guia.detalles ? guia.detalles.map(detalle => ({
            codigo: detalle.codigo ? detalle.codigo.toString().padStart(3, '0') : '000',
            marca: detalle.marca || '',
            descripcion: detalle.descripcion || '',
            cantidad: detalle.cantidad || 0,
            um: detalle.um || '',
            precio: detalle.precio ? `S/ ${parseFloat(detalle.precio).toFixed(2)}` : 'S/ 0.00',
            total: detalle.precio && detalle.cantidad 
              ? `S/ ${(parseFloat(detalle.precio) * parseFloat(detalle.cantidad)).toFixed(2)}` 
              : 'S/ 0.00',
          })) : []
        }));

        setGuias(guiasFormateadas);
        setTotalGuias(response.data.totalGuias);
      } else {
        console.error('Error en la solicitud:', response.data.message);
      }
    } catch (error) {
      console.error('Error al obtener guías:', error.message);
    }
  }, [filters, currentPage, guiasPerPage]);

  useEffect(() => {
    fetchGuias();
  }, [fetchGuias]);

  const removeGuia = (id) => {
    setGuias(guias.filter(guia => guia.id !== id));
  };

  const addGuia = (nuevaGuia) => {
    setGuias([...guias, nuevaGuia]);
  };

  const updateGuia = (id, updatedData) => {
    setGuias(guias.map(guia =>
      guia.id === id ? { ...guia, ...updatedData } : guia
    ));
  };

  const addDetalle = (nuevoDetalle) => {
    setDetalles([...detalles, nuevoDetalle]);
  };

  const updateDetalle = (updatedDetalle) => {
    setDetalles(prevDetalles =>
      prevDetalles.map(detalle =>
        detalle.codigo === updatedDetalle.codigo ? updatedDetalle : detalle
      )
    );
  };

  const removeDetalle = (codigo) => {
    setDetalles(prevDetalles =>
      prevDetalles.filter(detalle => detalle.codigo !== codigo)
    );
  };

  const getTotalRecaudado = () => {
    return guias.reduce((total, guia) => {
      const subtotalGuia = guia.detalles.reduce((totalDetalle, detalle) => {
        return totalDetalle + parseFloat(detalle.total.replace('S/ ', ''));
      }, 0);
      return total + subtotalGuia;
    }, 0).toFixed(2);
  };

  const totalRecaudado = getTotalRecaudado();
  const totalPages = Math.ceil(totalGuias / guiasPerPage);

  const refetchGuias = () => {
    fetchGuias();
  };

  return { 
    guias, 
    setGuias, 
    removeGuia, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    guiasPerPage, 
    setGuiasPerPage, 
    detalles, 
    addGuia, 
    addDetalle, 
    removeDetalle, 
    updateDetalle, 
    totalRecaudado, 
    updateGuia, 
    refetchGuias 
  };
};

export default useGuiasRemision;

