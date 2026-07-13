import axios from "./axios";

let __verifyTokenPromise: Promise<any> | null = null;

export const resetVerifyTokenCache = () => {
  __verifyTokenPromise = null;
};

export const verifyTokenRequest = (): Promise<any> => {
  if (!__verifyTokenPromise) {
    __verifyTokenPromise = axios.get('/auth/verify').catch((err) => {
      __verifyTokenPromise = null; // reset cache on failure
      throw err;
    });
  }
  return __verifyTokenPromise;
};

export const loginRequest = async (user: any) => {
  resetVerifyTokenCache();
  return await axios.post(`/auth/login`, user);
};

export const logoutRequest = async () => {
  resetVerifyTokenCache();
  return await axios.post('/auth/logout');
};

export const sendAuthCodeRequest = async (data: any) => {
  return await axios.post("/auth/auth-code", data);
};
