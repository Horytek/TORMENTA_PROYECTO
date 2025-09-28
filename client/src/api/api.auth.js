import axios from "./axios";

// Ya no se envía el token, el backend debe leer la cookie HTTPOnly

export const verifyTokenRequest = async () => {
    return await axios.get('/auth/verify');
};

export const loginRequest = async (user) => 
    await axios.post(`/auth/login`, user);

export const nameRequest = async (usua) => 
    await axios.post(`/auth/name`, usua);

export const logoutRequest = async () => {
    return await axios.post('/auth/logout');
};