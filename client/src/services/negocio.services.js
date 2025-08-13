import axios from '@/api/axios';

// Obtiene la configuración del negocio
export const getNegocio = async () => {
  try {
    const { data } = await axios.get('/negocio');
    return data?.data || data; // Flexible según backend
  } catch (e) {
    console.error('Error getNegocio', e);
    throw e;
  }
};

// Actualiza la configuración del negocio (multipart)
export const updateNegocio = async (formData) => {
  try {
    const { data } = await axios.put('/negocio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data?.data || data;
  } catch (e) {
    console.error('Error updateNegocio', e);
    throw e;
  }
};
