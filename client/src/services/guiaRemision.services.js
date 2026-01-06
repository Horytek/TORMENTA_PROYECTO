import axios from "@/api/axios";

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
    const response = await axios.get('/guia_remision/num_comprobante');
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
    const response = await axios.get('/guia_remision/clienteguia');
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
    const response = await axios.post('/guia_remision/destnatural', data);
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
    const response = await axios.post('/guia_remision/destjuridico', data);
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
    const response = await axios.get('/guia_remision/cod_transporte');
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
    const response = await axios.get('/guia_remision/transpublico');
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
    const response = await axios.get('/guia_remision/transprivado');
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
    const response = await axios.post('/guia_remision/nuevo_transportepub', data);
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
    const response = await axios.post('/guia_remision/nuevo_transportepriv', data);
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
    const response = await axios.get('/guia_remision/vehiculosguia');
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
    const response = await axios.get('/guia_remision/sucursal');
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
    const response = await axios.get('/guia_remision/ubigeo');
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
// Buscar productos para guía de remisión
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
      setProductos([]);
    }
  } catch (error) {
    console.error('Error al buscar productos:', error?.message);
    setProductos([]);
  }
};

// ============================================
// INTEGRACIÓN CON SUNAT
// ============================================

function convertDateToDesiredFormat(dateString, offsetHours) {
  const date = new Date(dateString);
  const offsetMilliseconds = offsetHours * 60 * 60 * 1000;
  const adjustedDate = new Date(date.getTime() - offsetMilliseconds);

  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
  const day = String(adjustedDate.getDate()).padStart(2, '0');
  const hours = String(adjustedDate.getHours()).padStart(2, '0');
  const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
  const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-05:00`;
}

async function enviarGuiaRemisionASunat(data, nombre) {
  const url = 'https://facturacion.apisperu.com/api/v1/despatch/send';

  // Importar servicios dinámicamente para evitar dependencias circulares
  const { getClaveSunatByUser } = await import('@/services/clave.services');
  const token = await getClaveSunatByUser(nombre);

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      return { success: true, data: response.data };
    } else {
      return { success: false, message: 'Error en respuesta de SUNAT' };
    }
  } catch (error) {
    console.error('Error al enviar a SUNAT:', error.response ? error.response.data : error.message);
    return { success: false, message: error.message };
  }
}

export async function handleGuiaRemisionSunat(guia, destinata, transportista, detalles, nombre) {
  // Importar servicios dinámicamente
  const { getEmpresaDataByUser } = await import('@/services/empresa.services');
  const empresaData = await getEmpresaDataByUser(nombre);

  const tipoDoc = "05";
  const guialetra = "T";
  const guiaserie = guia.serieNum;
  const ultimaSerie = guialetra + guiaserie;
  const isoDate = guia.fechaEmision;
  const offsetHours = -5;
  const result = convertDateToDesiredFormat(isoDate, offsetHours);
  const undPeso = "KGM";

  const data = {
    version: 2022,
    tipoDoc: tipoDoc,
    serie: ultimaSerie.toString(),
    correlativo: guia.num,
    fechaEmision: result,
    company: {
      ruc: empresaData.ruc,
      razonSocial: empresaData.razonSocial,
      nombreComercial: empresaData.nombreComercial,
      address: {
        direccion: empresaData.direccion,
        provincia: empresaData.provincia,
        departamento: empresaData.departamento,
        distrito: empresaData.distrito,
        ubigueo: empresaData.ubigueo,
      },
    },
    destinatario: {
      numDoc: destinata.documento,
      rznSocial: destinata.destinatario
    },
    observacion: guia.glosa || "",
    envio: {
      fecTraslado: result,
      pesoTotal: guia.peso,
      undPesoTotal: undPeso,
      llegada: {
        ubigueo: guia.id_ubigeo_d,
        direccion: guia.dir_destino
      },
      partida: {
        ubigueo: guia.id_ubigeo_o,
        direccion: guia.dir_partida
      },
      transportista: {
        numDoc: guia.docpub || guia.docpriv,
        rznSocial: guia.transportistapub || guia.transportistapriv,
        placa: transportista.placa || "",
      }
    },
    details: detalles.map(detalle => ({
      cantidad: detalle.cantidad,
      unidad: detalle.um || '',
      descripcion: detalle.descripcion,
      codigo: detalle.codigo
    }))
  };

  try {
    await enviarGuiaRemisionASunat(data, nombre);
  } catch (_error) {
    // Error handling managed by caller or logs
  }
}

// Servicio por defecto (mantiene compatibilidad)
const guiaRemisionService = {
  // Guías
  insertGuiaRemisionAndDetalle,
  anularGuia,
  generarDocumentoGuia,
  handleGuiaRemisionSunat,

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

