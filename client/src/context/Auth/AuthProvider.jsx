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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);               // Expuesto para componentes que ya lo consumen
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // NUEVO: API unificada del store
  const setUserRaw = useUserStore(state => state.setUserRaw);
  const hydrateFromSession = useUserStore(state => state.hydrateFromSession);
  const clearUserStore = useUserStore(state => state.clearUser);

  // (Legacy setters - ya NO se usan aquí, mantenidos por compatibilidad si quisieras revertir)
  // const setNombre = useUserStore(state => state.setNombre);
  // const setIdRol = useUserStore(state => state.setIdRol);
  // const setSur = useUserStore(state => state.setSur);
  // const setIdTenant = useUserStore(state => state.setIdTenant);

  // Rehidratación temprana (restaura user normalizado desde sessionStorage antes del chequeo de token)
  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  const login = async (credentials) => {
    try {
      const { data } = await loginRequest(credentials);
      if (data?.success || data?.token) {
        sessionStorage.setItem("token", data.token);
        if (data.data) {
          sessionStorage.setItem("user", JSON.stringify(data.data));
          setUser(data.data);
          setUserRaw(data.data);          // Sincroniza todo (user + alias legacy)
        }
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
    const token = sessionStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      clearUserStore();
      setLoading(false);
      setAuthReady(true); // <- importante
      return;
    }
    try {
      const res = await verifyTokenRequest(token);
      if (res?.data) {
        sessionStorage.setItem("user", JSON.stringify(res.data));
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
      sessionStorage.removeItem("token");
    } finally {
      setLoading(false);
      setAuthReady(true); // <- marca listo siempre
    }
  };
  checkLogin();
}, [setUserRaw, clearUserStore]);

  const logout = async () => {
    try {
      const token = sessionStorage.getItem("token");
      if (token) logoutRequest(token);
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