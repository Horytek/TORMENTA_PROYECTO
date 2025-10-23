import { getEmpresasRequest, getEmpresaRequest, addEmpresaRequest,
  updateEmpresaRequest, deleteEmpresaRequest, updateEmpresaMonedasRequest } 
from '@/api/api.empresa';
import { addUsuarioLandingRequest } from '@/api/api.usuario'; // usamos la API directa para obtener respuesta
import { getUsuario_1 } from "@/services/usuario.services";
import { toast } from "react-hot-toast";
import { useUserStore } from "@/store/useStore";

// Utilidades simples para credenciales
function randomString(len = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function slug(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 10);
}

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

const addEmpresa = async (empresa) => {
  try {
    const response = await addEmpresaRequest(empresa);
    if (response.data.code === 1) {
      toast.success("Empresa añadida con éxito");
      return true;
    } else {
      toast.error(response.data.message || "Ocurrió un error al guardar la empresa");
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
      toast.success("Empresa actualizada con éxito");
      return true;
    } else {
      toast.error(response.data.message || "Ocurrió un error al actualizar la empresa");
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
      toast.success("Empresa dada de baja con éxito");
    }
    if (response.data.code === 1) {
      toast.success("Empresa eliminada con éxito");
    }
    if (response.status === 404) {
      toast.error("Ocurrió un error al eliminar la empresa");
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
  }
};

const getEmpresaDataByUser = async (nombre) => {
  try {
    if (!nombre) {
      throw new Error("No se encontró el usuario");
    }
    const usuarioDataArray = await getUsuario_1(nombre);
    if (!Array.isArray(usuarioDataArray) || usuarioDataArray.length === 0) {
      throw new Error("No se encontraron datos para el usuario actual.");
    }
    const usuarioData = usuarioDataArray[0];
    if (!usuarioData.id_empresa) {
      throw new Error("No se encontró el id_empresa para el usuario actual.");
    }
    const id_empresa = usuarioData.id_empresa;
    const empresaData = await getEmpresa(id_empresa);
    return empresaData[0];
  } catch (error) {
    throw error;
  }
};

const updateEmpresaMonedas = async (id, monedas, pais) => {
  try {
    const response = await updateEmpresaMonedasRequest(id, monedas, pais);
    if (response.data.code === 1) {
      toast.success("Monedas y país actualizados correctamente");
      return true;
    } else {
      toast.error(response.data.message || "Error al actualizar monedas y país");
      return false;
    }
  } catch (error) {
    toast.error("Error en el servidor interno");
    return false;
  }
};

// Crea empresa y luego un usuario administrador vinculado a esa empresa
const createEmpresaAndAdmin = async (empresa) => {
  try {
    // 1) Crear Empresa
    const { data } = await addEmpresaRequest(empresa);
    if (!(data?.code === 1 && data?.id_empresa)) {
      return { success: false, message: data?.message || "No se pudo crear la empresa" };
    }
    const id_empresa = data.id_empresa;

    // 2) Generar credenciales aleatorias para el admin
    const base = slug(empresa?.nombreComercial || empresa?.razonSocial || "admin");
    const usua = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const contra = randomString(12);

    // 3) Crear usuario administrador (id_rol=1) activo y asociado a la empresa creada
    const { data: userResp } = await addUsuarioLandingRequest({
      id_rol: 1,
      usua,
      contra,
      estado_usuario: 1,
      id_empresa,
      plan_pago: empresa.plan_pago
    });
    if (userResp?.code !== 1) {
      return { success: false, message: userResp?.message || "No se pudo crear el usuario administrador" };
    }

    return { success: true, id_empresa, admin: { usua, contra } };
  } catch (e) {
    return { success: false, message: e?.response?.data?.message || e.message };
  }
};

export { getEmpresas, getEmpresa, addEmpresa, 
  updateEmpresa, deleteEmpresa, getEmpresaDataByUser, updateEmpresaMonedas, createEmpresaAndAdmin };