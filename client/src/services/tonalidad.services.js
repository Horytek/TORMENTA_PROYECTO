import {
    getTonalidadesRequest,
    createTonalidadRequest,
    updateTonalidadRequest,
    deleteTonalidadRequest,
} from "../api/api.tonalidad";

export const getTonalidades = async () => {
    try {
        const res = await getTonalidadesRequest();
        return res.data;
    } catch (error) {
        console.error("Error al obtener tonalidades", error);
        throw error;
    }
};

export const createTonalidad = async (tonalidad) => {
    try {
        const res = await createTonalidadRequest(tonalidad);
        return res.data;
    } catch (error) {
        console.error("Error al crear tonalidad", error);
        throw error;
    }
};

export const updateTonalidad = async (id, tonalidad) => {
    try {
        const res = await updateTonalidadRequest(id, tonalidad);
        return res.data;
    } catch (error) {
        console.error("Error al actualizar tonalidad", error);
        throw error;
    }
};

export const deleteTonalidad = async (id) => {
    try {
        const res = await deleteTonalidadRequest(id);
        return res.data;
    } catch (error) {
        console.error("Error al eliminar tonalidad", error);
        throw error;
    }
};
