import axios from "axios";

// Create a dedicated axios instance for Express Mode
const expressApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/express`,
});

// Interceptor to add Token
expressApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("express_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const expressLogin = async (credentials) => {
    const response = await expressApi.post("/auth/login", credentials);
    if (response.data.token) {
        localStorage.setItem("express_token", response.data.token);
        if (response.data.business_name) {
            localStorage.setItem("express_business_name", response.data.business_name);
        }
    }
    return response.data;
};

export const expressRegister = async (data) => {
    const response = await expressApi.post("/auth/register", data);
    if (response.data.token) {
        localStorage.setItem("express_token", response.data.token);
        if (response.data.business_name) {
            localStorage.setItem("express_business_name", response.data.business_name);
        }
    }
    return response.data;
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
