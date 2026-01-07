import axios from '../api/axios';

export const getActions = async () => {
    try {
        const response = await axios.get('/developer/actions');
        return response.data.data;
    } catch (error) {
        console.error("Error fetching actions:", error);
        throw error;
    }
};

export const createAction = async (action) => {
    try {
        const response = await axios.post('/developer/actions', action);
        return response.data;
    } catch (error) {
        console.error("Error creating action:", error);
        throw error;
    }
};

export const updateAction = async (id, action) => {
    try {
        const response = await axios.put(`/developer/actions/${id}`, action);
        return response.data;
    } catch (error) {
        console.error("Error updating action:", error);
        throw error;
    }
};

export const deleteAction = async (id) => {
    try {
        const response = await axios.delete(`/developer/actions/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting action:", error);
        throw error;
    }
};
export const updateModuleConfig = async (type, id, data) => {
    try {
        const response = await axios.put(`/developer/module-config/${type}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating module config:", error);
        throw error;
    }
};
