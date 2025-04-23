import { getEmpresasRequest, getEmpresaRequest, addEmpresaRequest, updateEmpresaRequest, deleteEmpresaRequest } 
from '@/api/api.empresa';
import { getUsuario_1 } from "@/services/usuario.services";
import { toast } from "react-hot-toast";

const getEmpresas = async () => {
  try {
    const response = await getEmpresasRequest();
    if (response.data.code === 1) {
      return response.data.data; 
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const getEmpresa = async (id) => {
  try {
    const response = await getEmpresaRequest(id);
    if (response.data.code === 1) {
      return response.data.data;
    } else {
      console.error('Error en la solicitud: ', response.data.message);
    }
  } catch (error) {
    console.error('Error en la solicitud: ', error.message);
  }
};

const addEmpresa = async (producto) => {
  try {
    const response = await addEmpresaRequest(producto);
    if (response.data.code === 1) {
      toast.success("Producto añadido con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al guardar el producto");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const updateEmpresa = async (id, newFields) => {
  try {
    const response = await updateEmpresaRequest(id, newFields);
    if (response.data.code === 1) {
      toast.success("Producto actualizado con éxito");
      return true;
    } else {
      toast.error("Ocurrió un error al actualizar el producto");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const deleteEmpresa = async (id) => {
  try {
    const response = await deleteEmpresaRequest(id);
    if (response.data.code === 2) {
      toast.success("Producto dado de baja con éxito");
    }
    if (response.data.code === 1) {
      toast.success("Producto eliminado con éxito");
    }
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar el producto");
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const getEmpresaDataByUser = async () => {
  try {
    // Obtener el usuario desde localStorage
    const usuario = localStorage.getItem("usuario");
    //console.log("👤 Usuario desde localStorage:", usuario);

    if (!usuario) {
      throw new Error("No se encontró el usuario en localStorage.");
    }

    // Obtener los datos del usuario
    const usuarioDataArray = await getUsuario_1(usuario);
    //console.log("📦 Respuesta de getUsuario_1:", usuarioDataArray);

    if (!Array.isArray(usuarioDataArray) || usuarioDataArray.length === 0) {
      throw new Error("No se encontraron datos para el usuario actual.");
    }

    const usuarioData = usuarioDataArray[0];
    //console.log("✅ Usuario obtenido:", usuarioData);

    if (!usuarioData.id_empresa) {
      throw new Error("No se encontró el id_empresa para el usuario actual.");
    }

    const id_empresa = usuarioData.id_empresa;
    //console.log("🏢 ID de la empresa:", id_empresa);

    // Obtener los datos completos de la empresa usando el id_empresa
    const empresaData = await getEmpresa(id_empresa);
    //console.log("🏢 Datos de la empresa:", empresaData[0]);

    return empresaData[0];
  } catch (error) {
    //console.error("❌ Error al obtener los datos de la empresa:", error.message);
    throw error;
  }
};


export { getEmpresas, getEmpresa, addEmpresa, updateEmpresa, deleteEmpresa, getEmpresaDataByUser };