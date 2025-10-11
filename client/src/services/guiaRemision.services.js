import axios from "@/api/axios";
import { toast } from 'react-hot-toast';
import { useUserStore } from "@/store/useStore";

/**
 * Servicio consolidado para Guías de Remisión
 * Todas las llamadas API relacionadas con guías en un solo lugar
 */

// ============================================
// GUÍAS DE REMISIÓN
// ============================================

/**
 * Insertar nueva guía de remisión con sus detalles
 */
export const insertGuiaRemisionAndDetalle = async (data) => {
  try {
    const response = await axios.post('/guia_remision/nuevaguia', data);
    if (response.data.code === 1) {
      return { success: true, message: 'Guía de remisión insertada correctamente' };
    } else {
      console.error('Error al insertar guía:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error al insertar guía:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Anular una guía de remisión
 */
export const anularGuia = async (guiaId) => {
  const nombre = useUserStore.getState().nombre;

  try {
    const response = await axios.post('/guia_remision/anularguia', {
      guiaId,
      usuario: nombre,
    });
    
    if (response.data.code === 1) {
      return { success: true, message: 'Guía anulada correctamente' };
    } else {
      console.error('Error al anular guía:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error al anular guía:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Generar número de documento para nueva guía
 */
export const generarDocumentoGuia = async () => {
  try {
    const response = await axios.get('/guia_remision/generarcodigoguia');
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    } else {
      console.error('Error al generar código:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error al generar código:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// DESTINATARIOS
// ============================================

/**
 * Obtener lista de destinatarios (clientes para guías)
 */
export const getDestinatariosGuia = async () => {
  try {
    const response = await axios.get('/guia_remision/destinatarios');
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
 * Agregar destinatario natural (persona)
 */
export const addDestinatarioNatural = async (data) => {
  try {
    const response = await axios.post('/guia_remision/nuevo_destinatario_natural', data);
    if (response.data.code === 1) {
      return { success: true, message: 'Destinatario agregado exitosamente' };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Error al agregar destinatario:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Agregar destinatario jurídico (empresa)
 */
export const addDestinatarioJuridico = async (data) => {
  try {
    const response = await axios.post('/guia_remision/nuevo_destinatario_juridico', data);
    if (response.data.code === 1) {
      return { success: true, message: 'Destinatario agregado exitosamente' };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Error al agregar destinatario:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// TRANSPORTISTAS
// ============================================

/**
 * Generar código para nuevo transportista
 */
export const generarCodigoTransportista = async () => {
  try {
    const response = await axios.get('/guia_remision/generarcodigotrans');
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Error al generar código transportista:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Obtener transportistas públicos
 */
export const getTransportistasPublicos = async () => {
  try {
    const response = await axios.get('/guia_remision/transportepublico');
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener transportistas públicos:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener transportistas privados
 */
export const getTransportistasPrivados = async () => {
  try {
    const response = await axios.get('/guia_remision/transporteprivado');
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener transportistas privados:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Agregar transportista público
 */
export const addTransportistaPublico = async (data) => {
  try {
    const response = await axios.post('/guia_remision/nuevo_transportistapub', data);
    if (response.data.code === 1) {
      return { success: true, message: 'Transportista agregado exitosamente' };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Error al agregar transportista:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Agregar transportista privado
 */
export const addTransportistaPrivado = async (data) => {
  try {
    const response = await axios.post('/guia_remision/nuevo_transportistapriv', data);
    if (response.data.code === 1) {
      return { success: true, message: 'Transportista agregado exitosamente' };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('Error al agregar transportista:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// VEHÍCULOS
// ============================================

/**
 * Obtener lista de vehículos
 */
export const getVehiculos = async () => {
  try {
    const response = await axios.get('/guia_remision/vehiculos');
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener vehículos:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Agregar nuevo vehículo
 */
export const addVehiculo = async (data, setShowModal) => {
  try {
    const response = await axios.post('/guia_remision/nuevo_vehiculo', data, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.code === 1) {
      if (setShowModal) setShowModal(false);
      return { success: true, message: 'Vehículo agregado exitosamente' };
    } else {
      console.error('Error al agregar vehículo:', response.data.message);
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error al agregar vehículo:', error.message);
    return { success: false, message: error.message };
  }
};

// ============================================
// DATOS AUXILIARES
// ============================================

/**
 * Obtener lista de sucursales para guías
 */
export const getSucursalesGuia = async () => {
  try {
    const response = await axios.get('/guia_remision/sucursales');
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener sucursales:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Obtener ubigeos (departamentos, provincias, distritos)
 */
export const getUbigeosGuia = async () => {
  try {
    const response = await axios.get('/guia_remision/ubigeos');
    if (response.data.code === 1) {
      return { success: true, data: response.data.data };
    }
    return { success: false, data: [] };
  } catch (error) {
    console.error('Error al obtener ubigeos:', error.message);
    return { success: false, data: [] };
  }
};

/**
 * Buscar productos para guía de remisión
 */
export const buscarProductosGuia = async (searchInput, setProductos) => {
  try {
    const term = (searchInput || '').trim();

    const params = {};
    if (term) {
      params.descripcion = term;
      params.codbarras = term;
    }

    const response = await axios.get('/guia_remision/productos', { params });

    if (response.data.code === 1) {
      setProductos(response.data.data);
    } else {
      toast.error('Error al buscar productos');
      setProductos([]);
    }
  } catch (error) {
    console.error('Error al buscar productos:', error?.message);
    if (!axios.isCancel?.(error)) {
      toast.error('No se pudieron cargar productos');
    }
    setProductos([]);
  }
};

// Servicio por defecto (mantiene compatibilidad)
const guiaRemisionService = {
  // Guías
  insertGuiaRemisionAndDetalle,
  anularGuia,
  generarDocumentoGuia,
  
  // Destinatarios
  getDestinatariosGuia,
  addDestinatarioNatural,
  addDestinatarioJuridico,
  
  // Transportistas
  generarCodigoTransportista,
  getTransportistasPublicos,
  getTransportistasPrivados,
  addTransportistaPublico,
  addTransportistaPrivado,
  
  // Vehículos
  getVehiculos,
  addVehiculo,
  
  // Auxiliares
  getSucursalesGuia,
  getUbigeosGuia,
  buscarProductosGuia,
};

export default guiaRemisionService;

