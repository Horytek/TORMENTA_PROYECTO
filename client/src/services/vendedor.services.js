import { 
    getVendedoresRequest, 
    getVendedorRequest, 
    addVendedorRequest, 
    deleteVendedorRequest, 
    updateVendedorRequest, 
    deactivateVendedorRequest 
} from '@/api/api.vendedor';
import { toast } from "react-hot-toast";
import { transformData } from '@/utils/vendedor';

// Función para obtener todos los vendedores
const getVendedores = async () => {
  try {
    const response = await getVendedoresRequest();
    if (response.data.code === 1) {
      return transformData(response.data.data);
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

// Función para obtener un vendedor por ID
const getVendedor = async (id) => {
  try {
    const response = await getVendedorRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

// Función para añadir un nuevo vendedor
const addVendedor = async (vendedor) => {
  try {
    const response = await addVendedorRequest(vendedor);
    if (response.data.code === 1) {
      return [true, response.data.id];
    } else {
      return [false, response.data.message || "Error al guardar"];
    }
  } catch (error) {
    return [false, "Error en el servidor interno"];
  }
};

// Función para eliminar un vendedor
const deleteVendedor = async (id) => {
  try {
    const response = await deleteVendedorRequest(id);
    if (response.data.code === 1) {
      toast.success("Vendedor eliminado con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al eliminar el vendedor");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

// Función para actualizar un vendedor
const updateVendedor = async (id, vendedor) => {
  try {
    const response = await updateVendedorRequest(id, vendedor);
    if (response.data.code === 1) {
      return [true];
    } else {
      return [false, response.data.message || "Error al actualizar"];
    }
  } catch (error) {
    return [false, "Error en el servidor interno"];
  }
};


// Función para desactivar un vendedor
// Función para desactivar o eliminar un vendedor
const deactivateVendedor = async (id) => {
  try {
    const response = await deactivateVendedorRequest(id);

    if (response.data.message.includes("Vendedor dado de baja")) {
      toast.success("El vendedor ha sido desactivado correctamente.");
      return true;
    } 
    if (response.data.message.includes("Vendedor eliminado")) {
      toast.success("El vendedor ha sido eliminado correctamente.");
      return true;
    } 
    if (response.status === 404) {
      toast.error("El vendedor no fue encontrado.");
      return false;
    }

    toast.error("Ocurrió un error al procesar la solicitud.");
    return false;
  } catch (error) {
    console.error("Error al desactivar/eliminar el vendedor:", error);
    toast.error("Error interno del servidor. Inténtelo más tarde.");
    return false;
  }
};


export { getVendedores, getVendedor, addVendedor, deleteVendedor, updateVendedor, deactivateVendedor };
