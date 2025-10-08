import { AuthContext } from "./AuthContext";
import { redirect } from 'react-router-dom';
import { useEffect, useContext, useState } from "react";
import { loginRequest, logoutRequest, verifyTokenRequest } from "../../api/api.auth";
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
      const { data } = await loginRequest(credentials); // El backend debe enviar la cookie HTTPOnly aquí
      if (data?.success && data.data) {
        // No guardar token, solo usuario
        //sessionStorage.setItem("user", JSON.stringify(data.data));
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
      // No leer token, solo pedir verificación al backend
      try {
        const res = await verifyTokenRequest(); // El backend debe leer la cookie
        if (res?.data) {
          //sessionStorage.setItem("user", JSON.stringify(res.data));
          setIsAuthenticated(true);
          setUser(res.data);
          setUserRaw(res.data);
        } else {
          setIsAuthenticated(false);
          clearUserStore();
        }
      } catch {
        setIsAuthenticated(false);
        clearUserStore();
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
      await logoutRequest(); // El backend debe limpiar la cookie
    } catch { /* noop */ }
    sessionStorage.clear();
    clearUserStore();
    setIsAuthenticated(false);
    setUser(null);
    redirect('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
