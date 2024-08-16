import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Función para obtener guías de remisión
const useGuiasData = (filters) => {
  const [guias, setGuias] = useState([]);
  const [totalGuias, setTotalGuias] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [guiasPerPage, setGuiasPerPage] = useState(10);

  const fetchGuias = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/guia_remision', {
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
      console.log('API Response:', response.data);
      if (response.data.code === 1) {
        const guias = response.data.data.map(guia => ({
          id: guia.id,
          fecha: guia.fecha,
          numGuia: guia.num_guia,
          cliente: guia.cliente,
          documento: guia.documento,
          vendedor: guia.vendedor,
          dni: guia.dni,
          serieNum: guia.serieNum,
          num: guia.num,
          total: `S/ ${parseFloat(guia.total).toFixed(2)}`,
          concepto: guia.concepto,
          dirpartida: guia.dir_partida,
          dirdestino: guia.dir_destino,
          observacion: guia.observacion,
          docpub: guia.docpub,
          docpriv: guia.docpriv,
          canti: guia.canti,
          peso: guia.peso,
          transpub: guia.transportistapub,
          transpriv: guia.transportistapriv,
          estado: guia.estado === 0 ? 'Inactivo' :
          guia.estado === 1 ? 'Activo' :
          guia.estado === 2 ? 'En proceso' :
          'Desconocido', // Valor por defecto para estados no especificados
          detalles: guia.detalles.map(detalle => ({
            codigo: detalle.codigo.toString().padStart(3, '0'),
            marca: detalle.marca,
            descripcion: detalle.descripcion,
            cantidad: detalle.cantidad,
            um: detalle.um,
            precio: `S/ ${parseFloat(detalle.precio).toFixed(2)}`,
            total: `S/ ${parseFloat(detalle.total).toFixed(2)}`,
          }))
        }));
        console.log('Transformed Guias:', guias);   // Agrega este log para verificar los datos
        setGuias(guias);
        setTotalGuias(response.data.totalGuias);
      } else {
        console.error('Error en la solicitud: ', response.data.message);
      }
    } catch (error) {
      console.error('Error en la solicitud: ', error.message);
    }
  }, [filters, currentPage, guiasPerPage]);

  useEffect(() => {
    fetchGuias();
  }, [fetchGuias]);

  const removeGuia = (id) => {
    setGuias(guias.filter(guia => guia.id !== id));
  };

  const totalPages = Math.ceil(totalGuias / guiasPerPage);

  const [detalles, setDetalles] = useState([]);

  const addGuia = (nuevaGuia) => {
    setGuias([...guias, nuevaGuia]);
  };

  const addDetalle = (nuevoDetalle) => {
    setDetalles([...detalles, nuevoDetalle]);
  };

  const getTotalRecaudado = () => {
    return guias.reduce((total, guia) => {
      const subtotalGuia = guia.detalles.reduce((total, detalle) => {
        return total + parseFloat(detalle.total.replace('S/ ', ''));
      }, 0);
      return total + subtotalGuia;
    }, 0).toFixed(2);
  };

  const totalRecaudado = getTotalRecaudado();

  const updateDetalle = (updatedDetalle) => {
    setDetalles(prevDetalles =>
      prevDetalles.map(detalle =>
        detalle.codigo === updatedDetalle.codigo ? updatedDetalle : detalle
      )
    );
  };

  const updateGuia = (id, updatedData) => {
    setGuias(guias.map(guia =>
      guia.id === id ? { ...guia, ...updatedData } : guia
    ));
  };

  const removeDetalle = (codigo) => {
    setDetalles(prevDetalles =>
      prevDetalles.filter(detalle => detalle.codigo !== codigo)
    );
  };

  const refetchGuias = () => {
    fetchGuias();
  };

  return { guias, removeGuia, currentPage, setCurrentPage, totalPages, guiasPerPage, setGuiasPerPage, detalles, addGuia, addDetalle, removeDetalle, updateDetalle, totalRecaudado, updateGuia, refetchGuias };
};

export default useGuiasData;
