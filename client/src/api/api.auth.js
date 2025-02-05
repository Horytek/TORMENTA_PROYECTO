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

export const nameRequest = async (usua) => 
    await axios.post(`/auth/name`, usua);


export const logoutRequest = async (token) => {
    return await axios.post('/auth/logout', null, {
        headers: {
            'Authorization': token // Token en el encabezado de la solicitud
        }
    });
};
