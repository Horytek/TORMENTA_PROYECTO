import axios from '@/api/axios';

export const getUnidades = async () => {
    try {
        const res = await axios.get('/unidades');
        return res.data.success ? res.data.data : [];
    } catch (error) {
        console.error("Error getUnidades:", error);
        return [];
    }
};

export const addUnidad = async (unidad) => {
    try {
        const res = await axios.post('/unidades', unidad);
        return res.data;
    } catch (error) {
        console.error("Error addUnidad:", error);
        throw error;
    }
};

export const updateUnidad = async (id, unidad) => {
    try {
        const res = await axios.put(`/unidades/${id}`, unidad);
        return res.data;
    } catch (error) {
        console.error("Error updateUnidad:", error);
        throw error;
    }
};

export const deleteUnidad = async (id) => {
    try {
        const res = await axios.delete(`/unidades/${id}`);
        return res.data;
    } catch (error) {
        console.error("Error deleteUnidad:", error);
        throw error;
    }
};
