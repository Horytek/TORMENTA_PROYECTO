import axios from "./axios";

export const verifyTokenRequest = async () =>
    await axios.get("/auth/verify");

export const loginRequest = async (user) => 
    await axios.post(`/auth/login`, user);

export const logoutRequest = async () =>
    await axios.get("/auth/logout");