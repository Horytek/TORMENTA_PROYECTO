import {
    getTallasRequest,
    createTallaRequest,
    updateTallaRequest,
    deleteTallaRequest,
} from "../api/api.talla";

export const getTallas = async () => {
    try {
        const res = await getTallasRequest();
        return res.data?.code === 1 ? res.data.data : [];
    } catch (error) {
        console.error("Error al obtener tallas", error);
        return [];
    }
};

export const createTalla = async (talla) => {
    try {
        const res = await createTallaRequest(talla);
        return res.data;
    } catch (error) {
        console.error("Error al crear talla", error);
        throw error;
    }
};

export const updateTalla = async (id, talla) => {
    try {
        const res = await updateTallaRequest(id, talla);
        return res.data;
    } catch (error) {
        console.error("Error al actualizar talla", error);
        throw error;
    }
};

export const deleteTalla = async (id) => {
    try {
        const res = await deleteTallaRequest(id);
        return res.data;
    } catch (error) {
        console.error("Error al eliminar talla", error);
        throw error;
    }
};
