import axios from "./axios";

export const verifyTokenRequest = async (token) => {
    return await axios.get('/auth/verify', {
        headers: {
            'Authorization': `Bearer ${token}`
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
            'Authorization': `Bearer ${token}`
        }
    });
};
