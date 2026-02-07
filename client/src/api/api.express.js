import axios from './axios';

export const registerTenantRequest = (data) => axios.post('/express/auth/register', data);
export const loginTenantRequest = (data) => axios.post('/express/auth/login', data);
