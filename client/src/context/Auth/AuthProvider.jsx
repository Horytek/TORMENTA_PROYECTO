import { setToken, getToken, removeToken } from "@/utils/authStorage";
import { AuthContext } from "./AuthContext";
import { redirect } from 'react-router-dom';
import { useEffect, useContext, useState } from "react";
import { loginRequest, logoutRequest, verifyTokenRequest, sendAuthCodeRequest } from "../../api/api.auth";
import { useUserStore } from "@/store/useStore";
import { setAuthReady } from "@/api/axios";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within a AuthProvider");
  return context;
};

// Evitar doble ejecución del verify en desarrollo (StrictMode)
let VERIFY_EFFECT_RAN = false;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const setUserRaw = useUserStore(state => state.setUserRaw);
  const hydrateFromSession = useUserStore(state => state.hydrateFromSession);
  const clearUserStore = useUserStore(state => state.clearUser);

  // Solo guarda el usuario (no el token)
  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  const login = async (credentials) => {
    try {
      const { data } = await loginRequest(credentials);
      if (data?.success && data.token) {
        await setToken(data.token); // Guardar en IndexedDB
        setUser(data.data);
        setUserRaw(data.data);
        setIsAuthenticated(true);
        return { success: true, data: data.data };
      }
      return { success: false, message: data?.message || "Credenciales inválidas" };
    } catch {
      return { success: false, message: "Error de autenticación" };
    }
  };

  useEffect(() => {
    const checkLogin = async () => {
      // Verificar si hay token en IndexedDB
      const token = await getToken();
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        setAuthReady(true);
        return;
      }

      try {
        const res = await verifyTokenRequest();
        if (res?.data) {
          setIsAuthenticated(true);
          setUser(res.data);
          setUserRaw(res.data);
        } else {
          setIsAuthenticated(false);
          clearUserStore();
          await removeToken();
        }
      } catch {
        setIsAuthenticated(false);
        clearUserStore();
        await removeToken();
        sessionStorage.removeItem("user");
      } finally {
        setLoading(false);
        setAuthReady(true);
      }
    };
    checkLogin();
  }, []);

  const logout = async () => {
    try {
      await logoutRequest();
    } catch { /* noop */ }
    await removeToken(); // Limpiar de IndexedDB
    sessionStorage.clear();
    clearUserStore();
    setIsAuthenticated(false);
    setUser(null);
    redirect('/');
  };

  // Nueva función para solicitar código de autenticación
  const sendAuthCode = async ({ usuario, password, clave_acceso }) => {
    try {
      const { data } = await sendAuthCodeRequest({ usuario, password, clave_acceso });
      return data;
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || "Error autenticando cuenta" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        sendAuthCode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
