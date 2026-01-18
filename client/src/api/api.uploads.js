import axios from "./axios";

export const uploadLogoRequest = async (file, empresaId) =>
    await axios.post("/uploads/logo", { file, empresaId });

export const uploadImageRequest = async (file, fileName, folder = '/uploads/') =>
    await axios.post("/uploads/image", { file, fileName, folder });

export const deleteImageRequest = async (fileId) =>
    await axios.delete(`/uploads/image/${fileId}`);
