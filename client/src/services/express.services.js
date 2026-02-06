import axios from "axios";
import {
    getExpressToken,
    setExpressToken,
    setBusinessName,
    removeExpressToken,
    removeBusinessName
} from "@/utils/expressStorage";

// Create a dedicated axios instance for Express Mode
const expressApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/express`,
});

// Interceptor to add Token
expressApi.interceptors.request.use(async (config) => {
    try {
        const token = await getExpressToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error retrieving express token from storage", error);
    }
    return config;
});

export const expressLogin = async (credentials) => {
    const response = await expressApi.post("/auth/login", credentials);
    if (response.data.token) {
        await setExpressToken(response.data.token);
        if (response.data.business_name) {
            await setBusinessName(response.data.business_name);
        }
    }
    return response.data;
};

export const expressRegister = async (data) => {
    const response = await expressApi.post("/auth/register", data);
    if (response.data.token) {
        await setExpressToken(response.data.token);
        if (response.data.business_name) {
            await setBusinessName(response.data.business_name);
        }
    }
    return response.data;
};

export const expressLogout = async () => {
    await removeExpressToken();
    await removeBusinessName();
};

export const getDashboardStats = async () => {
    const response = await expressApi.get("/dashboard");
    return response.data;
};

export const getProducts = async () => {
    const response = await expressApi.get("/products");
    return response.data;
};

export const createProduct = async (product) => {
    const response = await expressApi.post("/products", product);
    return response.data;
};

export const updateProduct = async (id, product) => {
    const response = await expressApi.put(`/products/${id}`, product);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await expressApi.delete(`/products/${id}`);
    return response.data;
};

export const createSale = async (data) => {
    const response = await expressApi.post("/sales", data);
    return response.data;
};

// Users
export const getExpressUsers = async () => {
    const response = await expressApi.get("/users");
    return response.data;
};

export const createExpressUser = async (data) => {
    const response = await expressApi.post("/users", data);
    return response.data;
};

export const deleteExpressUser = async (id) => {
    const response = await expressApi.delete(`/users/${id}`);
    return response.data;
};

export default expressApi;
