import axios from "@/api/axios";

/**
 * Servicio consolidado para Notas de Ingreso
 * Todas las llamadas API relacionadas con notas de ingreso
 */

// ============================================
// NOTAS DE INGRESO
// ============================================

/**
 * Obtener lista de notas de ingreso con filtros
 */
export const getNotasIngreso = async (filters) => {
  try {
    const response = await axios.get('/nota_ingreso', { params: filters });
    
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    } else {
      console.error('Error al obtener notas de ingreso:', response.data.message);
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error('Error al obtener notas de ingreso:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Insertar nueva nota de ingreso con detalles
 */
export const insertNotaIngreso = async (data) => {
  try {
    const response = await axios.post('/nota_ingreso/addNota', data);
    
    if (response.data.code === 1) {
      return { success: true, message: 'Nota de ingreso insertada correctamente' };
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
 * Anular una nota de ingreso
 */
export const anularNotaIngreso = async (notaId, usuario) => {
  try {
    const response = await axios.post('/nota_ingreso/anular', {
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
 * Obtener almacenes para notas de ingreso
 */
export const getAlmacenesIngreso = async () => {
  try {
    const response = await axios.get('/nota_ingreso/almacen');
    
    if (response.data.code === 1) {
      return { 
        success: true, 
        data: response.data.data.map(item => ({
          id: item.id,
          almacen: item.almacen,
          sucursal: item.sucursal,
          usuario: item.usuario,
        }))
      };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener almacenes:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener destinatarios para notas de ingreso
 */
export const getDestinatariosIngreso = async () => {
  try {
    const response = await axios.get('/nota_ingreso/destinatario');
    
    if (response.data.code === 1) {
      return { 
        success: true, 
        data: response.data.data.map(item => ({
          id: item.id,
          documento: item.documento,
          destinatario: item.destinatario,
        }))
      };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener destinatarios:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener tipos de documento para notas de ingreso
 */
export const getDocumentosIngreso = async () => {
  try {
    const response = await axios.get('/nota_ingreso/documento');
    
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
 * Buscar productos para nota de ingreso
 */
export const getProductosIngreso = async (filters) => {
  try {
    const response = await axios.get('/nota_ingreso/productos', { params: filters });
    
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

// Exportación por defecto (objeto con todos los servicios)
const notaIngresoService = {
  getNotasIngreso,
  insertNotaIngreso,
  anularNotaIngreso,
  getAlmacenesIngreso,
  getDestinatariosIngreso,
  getDocumentosIngreso,
  getProductosIngreso,
};

export default notaIngresoService;

