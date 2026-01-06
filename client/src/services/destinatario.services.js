import {
  getDestinatariosRequest,
  getDestinatarioRequest,
  insertDestinatarioRequest,
  insertDestinatarioNaturalRequest,
  insertDestinatarioJuridicoRequest,
  deleteDestinatarioRequest,
  updateDestinatarioNaturalRequest,
  updateDestinatarioJuridicoRequest,
} from '@/api/api.destinatario';

import { transformData } from '@/utils/destinatario';

// Función para obtener todos los destinatarios
const getDestinatarios = async () => {
  try {
    const response = await getDestinatariosRequest();
    if (response.data.code === 1) {
      return transformData(response.data.data);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

// Función para obtener un destinatario por ID
const getDestinatario = async (id) => {
  try {
    const response = await getDestinatarioRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

// Función para añadir un nuevo destinatario (general)
const insertDestinatario = async (destinatario) => {
  try {
    const response = await insertDestinatarioRequest(destinatario);
    if (response.data.code === 1) {
      return [true, response.data.id];
    } else {
      return [false];
    }
  } catch (error) {
    console.error("Error en el servidor interno");
    return [false];
  }
};

// Función para añadir destinatario natural
const insertDestinatarioNatural = async (destinatario) => {
  try {
    const response = await insertDestinatarioNaturalRequest(destinatario);
    if (response.data.code === 1) {
      return [true, response.data.id];
    } else {
      return [false];
    }
  } catch (error) {
    console.error("Error en el servidor interno");
    return [false];
  }
};

// Función para añadir destinatario jurídico
const insertDestinatarioJuridico = async (destinatario) => {
  try {
    const response = await insertDestinatarioJuridicoRequest(destinatario);
    if (response.data.code === 1) {
      return [true, response.data.id];
    } else {
      return [false];
    }
  } catch (error) {
    console.error("Error en el servidor interno");
    return [false];
  }
};

// Función para eliminar un destinatario
const deleteDestinatario = async (id) => {
  try {
    const response = await deleteDestinatarioRequest(id);
    if (response.data.code === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error en el servidor interno");
    return false;
  }
};

const updateDestinatarioNatural = async (id, destinatario) => {
  try {
    const response = await updateDestinatarioNaturalRequest(id, destinatario);
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

const updateDestinatarioJuridico = async (id, destinatario) => {
  try {
    const response = await updateDestinatarioJuridicoRequest(id, destinatario);
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export {
  getDestinatarios,
  getDestinatario,
  insertDestinatario,
  insertDestinatarioNatural,
  insertDestinatarioJuridico,
  deleteDestinatario,
  updateDestinatarioNatural,
  updateDestinatarioJuridico,
  bulkUpdateDestinatarios
};

// --- Helper for Frontend Bulk Operations ---
const bulkUpdateDestinatarios = async (action, ids) => {
  try {
    const promises = ids.map(id => {
      if (action === 'delete') {
        return deleteDestinatario(id);
      }
      // Activate/Deactivate not fully supported generically without knowing type (Natural/Juridico)
      // or having a generic status endpoint.
      return Promise.resolve(false);
    });

    await Promise.all(promises);
    return true;
  } catch (e) {
    console.error("Bulk update error", e);
    return false;
  }
};