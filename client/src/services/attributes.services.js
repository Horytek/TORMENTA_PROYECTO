import {
    getAttributesRequest,
    createAttributeRequest,
    updateAttributeRequest,
    getAttributeValuesRequest,
    createAttributeValueRequest,
    deleteAttributeValueRequest,
    getCategoryAttributesRequest,
    linkCategoryAttributesRequest
} from '@/api/api.attributes';

export const getAttributes = async () => {
    try {
        const res = await getAttributesRequest();
        return res.data.code === 1 ? res.data.data : [];
    } catch (error) {
        console.error("Error getAttributes:", error);
        return [];
    }
};

export const createAttribute = async (data) => {
    try {
        const res = await createAttributeRequest(data);
        return res.data.code === 1;
    } catch (error) {
        console.error("Error createAttribute:", error);
        return false;
    }
};

export const updateAttribute = async (id, data) => {
    try {
        const res = await updateAttributeRequest(id, data);
        return res.data.code === 1;
    } catch (error) {
        console.error("Error updateAttribute:", error);
        return false;
    }
};

export const getAttributeValues = async (id) => {
    try {
        const res = await getAttributeValuesRequest(id);
        return res.data.code === 1 ? res.data.data : [];
    } catch (error) {
        console.error("Error getAttributeValues:", error);
        return [];
    }
};

export const createAttributeValue = async (id, data) => {
    try {
        const res = await createAttributeValueRequest(id, data);
        return res.data.code === 1;
    } catch (error) {
        console.error("Error createAttributeValue:", error);
        return false;
    }
};

export const deleteAttributeValue = async (id_valor) => {
    try {
        const res = await deleteAttributeValueRequest(id_valor);
        return res.data.code === 1;
    } catch (error) {
        console.error("Error deleteAttributeValue:", error);
        return false;
    }
};

export const getCategoryAttributes = async (id_categoria) => {
    try {
        const res = await getCategoryAttributesRequest(id_categoria);
        return res.data.code === 1 ? res.data.data : [];
    } catch (error) {
        console.error("Error getCategoryAttributes:", error);
        return [];
    }
};

export const linkCategoryAttributes = async (data) => {
    try {
        const res = await linkCategoryAttributesRequest(data);
        return res.data.code === 1;
    } catch (error) {
        console.error("Error linkCategoryAttributes:", error);
        return false;
    }
};

export const updateAttributeValue = async (id, data) => {
    try {
        const res = await updateAttributeValueRequest(id, data);
        return res.data.code === 1;
    } catch (error) {
        console.error("Error updateAttributeValue:", error);
        return false;
    }
};
