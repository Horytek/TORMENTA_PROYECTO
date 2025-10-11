import axios from "@/api/axios";

/**
 * Servicio consolidado para Notas de Salida
 * Todas las llamadas API relacionadas con notas de salida
 */

// ============================================
// NOTAS DE SALIDA
// ============================================

/**
 * Obtener lista de notas de salida con filtros
 */
export const getNotasSalida = async (filters) => {
  try {
    const response = await axios.get('/nota_salida/', { params: filters });
    
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    } else {
      console.error('Error al obtener notas de salida:', response.data.message);
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error('Error al obtener notas de salida:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Insertar nueva nota de salida con detalles
 */
export const insertNotaSalida = async (data) => {
  try {
    const response = await axios.post('/nota_salida/addNota', data);
    
    if (response.data.code === 1) {
      return { success: true, message: 'Nota de salida insertada correctamente' };
    } else {
      console.error('Error al insertar nota:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error al insertar nota:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Anular una nota de salida
 */
export const anularNotaSalida = async (notaId, usuario) => {
  try {
    const response = await axios.post('/nota_salida/anular', {
      notaId,
      usuario,
    });
    
    if (response.data.code === 1) {
      return { success: true, message: 'Nota anulada correctamente' };
    } else {
      console.error('Error al anular nota:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error al anular nota:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// DATOS AUXILIARES
// ============================================

/**
 * Obtener almacenes para notas de salida
 */
export const getAlmacenesSalida = async () => {
  try {
    const response = await axios.get('/nota_salida/almacen');
    
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener almacenes:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener destinatarios para notas de salida
 */
export const getDestinatariosSalida = async () => {
  try {
    const response = await axios.get('/nota_salida/destinatario');
    
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener destinatarios:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener tipos de documento para notas de salida
 */
export const getDocumentosSalida = async () => {
  try {
    const response = await axios.get('/nota_salida/nuevodocumento');
    
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener documentos:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Buscar productos para nota de salida
 */
export const getProductosSalida = async (filters) => {
  try {
    const response = await axios.get('/nota_salida/productos', { params: filters });
    
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    } else {
      console.error('Error al buscar productos:', response.data.message);
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error('Error al buscar productos:', error.message);
    return { success: false, data: [] };
  }
};

// Exportación por defecto
const notaSalidaService = {
  getNotasSalida,
  insertNotaSalida,
  anularNotaSalida,
  getAlmacenesSalida,
  getDestinatariosSalida,
  getDocumentosSalida,
  getProductosSalida,
};

export default notaSalidaService;

