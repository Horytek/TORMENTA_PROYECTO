import axios from "axios";
import {
    getExpressToken,
    setExpressToken,
    setBusinessName,
    removeExpressToken,
    removeBusinessName,
    setExpressEmail,
    removeExpressEmail,
    setExpressRole,
    removeExpressRole,
    setExpressPermissions,
    removeExpressPermissions
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
        if (response.data.business_name) await setBusinessName(response.data.business_name);
        if (response.data.email) await setExpressEmail(response.data.email);
        if (response.data.role) await setExpressRole(response.data.role);

        // Employee Login
        if (response.data.user) {
            if (response.data.user.role) await setExpressRole(response.data.user.role);

            // Fetch latest user data to get permissions if not in login response (loginTenant returns user object, let's double check controller)
            // Controller returns: user: { id, name, role, username } -> WAIT, it is MISSING permissions in loginTenant response!
            // I need to update the controller to return permissions too.
            // For now, let's assume I will fix the controller.
            if (response.data.user.permissions) await setExpressPermissions(response.data.user.permissions);
        }
    }
    return response.data;
};

export const expressRegister = async (data) => {
    const response = await expressApi.post("/auth/register", data);
    if (response.data.token) {
        await setExpressToken(response.data.token);
        if (response.data.business_name) await setBusinessName(response.data.business_name);
        if (data.email) await setExpressEmail(data.email);
        await setExpressRole('admin');
    }
    return response.data;
};

export const expressLogout = async () => {
    await removeExpressToken();
    await removeBusinessName();
    await removeExpressEmail();
    await removeExpressRole();
    await removeExpressPermissions();
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
export const getExpressMe = async () => {
    const response = await expressApi.get("/auth/me");
    return response.data;
};

export const getExpressUsers = async () => {
    const response = await expressApi.get("/users");
    return response.data;
};

export const createExpressUser = async (data) => {
    const response = await expressApi.post("/users", data);
    return response.data;
};

export const updateExpressUser = async (id, data) => {
    const response = await expressApi.put(`/users/${id}`, data);
    return response.data;
};

export const deleteExpressUser = async (id) => {
    const response = await expressApi.delete(`/users/${id}`);
    return response.data;
};

// Sales History
export const getSales = async () => {
    const response = await expressApi.get("/sales");
    return response.data;
};

export const getSaleDetails = async (id) => {
    const response = await expressApi.get(`/sales/${id}`);
    return response.data;
};

// Notifications
export const getNotifications = async () => {
    const response = await expressApi.get("/notifications");
    return response.data;
};

export const markNotificationsAsRead = async (id = 'all') => {
    const response = await expressApi.put(`/notifications/${id}/read`);
    return response.data;
};

export const updateExpressPassword = async (newPassword) => {
    const response = await expressApi.post("/auth/update-password", { password: newPassword });
    return response.data;
};

export default expressApi;
