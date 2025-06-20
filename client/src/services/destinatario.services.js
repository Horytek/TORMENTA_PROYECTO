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
import { toast } from "react-hot-toast";
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
      toast.success("Destinatario añadido con éxito");
      return [true, response.data.id];
    } else {
      toast.error("Ocurrió un error al guardar el destinatario");
      return [false];
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

// Función para añadir destinatario natural
const insertDestinatarioNatural = async (destinatario) => {
  try {
    const response = await insertDestinatarioNaturalRequest(destinatario);
    if (response.data.code === 1) {
      toast.success("Destinatario natural añadido con éxito");
      return [true, response.data.id];
    } else {
      toast.error("Ocurrió un error al guardar el destinatario natural");
      return [false];
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

// Función para añadir destinatario jurídico
const insertDestinatarioJuridico = async (destinatario) => {
  try {
    const response = await insertDestinatarioJuridicoRequest(destinatario);
    if (response.data.code === 1) {
      toast.success("Destinatario jurídico añadido con éxito");
      return [true, response.data.id];
    } else {
      toast.error("Ocurrió un error al guardar el destinatario jurídico");
      return [false];
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

// Función para eliminar un destinatario
const deleteDestinatario = async (id) => {
  try {
    const response = await deleteDestinatarioRequest(id);
    if (response.data.code === 1) {
      toast.success("Destinatario eliminado con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al eliminar el destinatario");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const updateDestinatarioNatural = async (id, destinatario) => {
  try {
    const response = await updateDestinatarioNaturalRequest(id, destinatario);
    if (response.status === 200) {
      toast.success("Destinatario natural actualizado con éxito");
      return true;
    } else {
      toast.error(response.data?.message || "Ocurrió un error al actualizar el destinatario");
      return false;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error en el servidor interno");
    return false;
  }
};

const updateDestinatarioJuridico = async (id, destinatario) => {
  try {
    const response = await updateDestinatarioJuridicoRequest(id, destinatario);
    if (response.status === 200) {
      toast.success("Destinatario jurídico actualizado con éxito");
      return true;
    } else {
      toast.error(response.data?.message || "Ocurrió un error al actualizar el destinatario");
      return false;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Error en el servidor interno");
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
};