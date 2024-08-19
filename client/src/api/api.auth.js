import axios from "./axios";

export const verifyTokenRequest = async (token) => {
    return await axios.get('/auth/verify', {
        headers: {
            'Authorization': token // Añade el token en el header de la petición
        }
    });
};


export const loginRequest = async (user) => 
    await axios.post(`/auth/login`, user);

export const logoutRequest = async () =>
    await axios.get("/auth/logout");