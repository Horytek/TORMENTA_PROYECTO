import axios from "./axios";

// Ya no se envía el token, el backend debe leer la cookie HTTPOnly

// Cachea el resultado de verificación para evitar llamadas duplicadas
// causadas por React.StrictMode (doble montaje en desarrollo).
let __verifyTokenPromise = null;

export const verifyTokenRequest = () => {
  if (!__verifyTokenPromise) {
    __verifyTokenPromise = axios.get('/auth/verify');
  }
  return __verifyTokenPromise;
};

export const loginRequest = async (user) => 
    await axios.post(`/auth/login`, user);

export const nameRequest = async (usua) => 
    await axios.post(`/auth/name`, usua);

export const logoutRequest = async () => {
    return await axios.post('/auth/logout');
};
