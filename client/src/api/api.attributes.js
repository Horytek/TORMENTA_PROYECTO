import axios from "./axios";

export const getAttributesRequest = async () =>
    await axios.get("/attributes");

export const createAttributeRequest = async (data) =>
    await axios.post("/attributes", data);

export const updateAttributeRequest = async (id, data) =>
    await axios.put(`/attributes/${id}`, data);

export const getAttributeValuesRequest = async (id) =>
    await axios.get(`/attributes/${id}/values`);

export const createAttributeValueRequest = async (id, data) =>
    await axios.post(`/attributes/${id}/values`, data);

export const deleteAttributeValueRequest = async (id_valor) =>
    await axios.delete(`/attributes/values/${id_valor}`);

export const getCategoryAttributesRequest = async (id_categoria) =>
    await axios.get(`/attributes/category/${id_categoria}`);

export const linkCategoryAttributesRequest = async (data) =>
    await axios.post("/attributes/link-category", data);

export const updateAttributeValueRequest = async (id, data) =>
    await axios.put(`/attributes/values/${id}`, data);
