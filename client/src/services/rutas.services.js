import { getModulosRequest, getSubmodulosRequest, getModulosConSubmodulosRequest } from '@/api/api.rutas';
import { toast } from 'react-hot-toast';

export const getModulos = async () => {
  try {
    const response = await getModulosRequest();
    return response.data;
  } catch (error) {
    console.error("Error en getModulos:", error.message);
    toast.error("No fue posible obtener los módulos");
    return [];
  }
};

export const getSubmodulos = async () => {
  try {
    const response = await getSubmodulosRequest();
    return response.data;
  } catch (error) {
    console.error("Error en getSubmodulos:", error.message);
    toast.error("No fue posible obtener los submódulos");
    return [];
  }
};

export const getModulosConSubmodulos = async () => {
  try {
    const response = await getModulosConSubmodulosRequest();
    
    if (response.data) {
      const datos = response.data;
      const datosNormalizados = datos.map(mod => ({
        id: Number(mod.id),
        nombre: String(mod.nombre || ''),
        ruta: String(mod.ruta || ''),
        submodulos: Array.isArray(mod.submodulos) ? mod.submodulos.map(sub => ({
          id_submodulo: Number(sub.id_submodulo),
          id_modulo: Number(sub.id_modulo),
          nombre_sub: String(sub.nombre_sub || ''),
          ruta: String(sub.ruta || '')
        })) : []
      }));
      
      return datosNormalizados;
    }
    
    return [];
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};