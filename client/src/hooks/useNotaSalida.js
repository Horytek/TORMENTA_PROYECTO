import { useState, useEffect } from 'react';
import { getAlmacenesSalida, getDestinatariosSalida, getDocumentosSalida } from '@/services/notaSalida.services';

/**
 * Custom Hook para gestionar datos de Nota de Salida
 */
export const useNotaSalidaData = () => {
  const [almacenes, setAlmacenes] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Ejecutar las 3 peticiones en paralelo
      const [almacenesRes, destinatariosRes, documentosRes] = await Promise.all([
        getAlmacenesSalida(),
        getDestinatariosSalida(),
        getDocumentosSalida()
      ]);

      if (almacenesRes.success) setAlmacenes(almacenesRes.data);
      if (destinatariosRes.success) setDestinatarios(destinatariosRes.data);
      if (documentosRes.success) setDocumentos(documentosRes.data);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  return { 
    almacenes, 
    setAlmacenes, 
    destinatarios, 
    setDestinatarios, 
    documentos, 
    setDocumentos,
    loading 
  };
};

/**
 * Custom Hook solo para almacenes
 */
export const useAlmacenesSalida = () => {
  const [almacenes, setAlmacenes] = useState([]);

  useEffect(() => {
    const fetchAlmacenes = async () => {
      const result = await getAlmacenesSalida();
      if (result.success) setAlmacenes(result.data);
    };
    fetchAlmacenes();
  }, []);

  return { almacenes, setAlmacenes };
};

/**
 * Custom Hook solo para destinatarios
 */
export const useDestinatariosSalida = () => {
  const [destinatarios, setDestinatarios] = useState([]);

  useEffect(() => {
    const fetchDestinatarios = async () => {
      const result = await getDestinatariosSalida();
      if (result.success) setDestinatarios(result.data);
    };
    fetchDestinatarios();
  }, []);

  return { destinatarios, setDestinatarios };
};

/**
 * Custom Hook solo para documentos
 */
export const useDocumentosSalida = () => {
  const [documentos, setDocumentos] = useState([]);

  useEffect(() => {
    const fetchDocumentos = async () => {
      const result = await getDocumentosSalida();
      if (result.success) setDocumentos(result.data);
    };
    fetchDocumentos();
  }, []);

  return { documentos, setDocumentos };
};

export default useNotaSalidaData;

