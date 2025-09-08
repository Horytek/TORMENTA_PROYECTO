import { AuthContext } from "./AuthContext";
import { redirect } from 'react-router-dom';
import { useEffect, useContext, useState } from "react";
import { loginRequest, logoutRequest, nameRequest, verifyTokenRequest } from "../../api/api.auth";
import { useUserStore } from "@/store/useStore";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within a AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Zustand setters
  const setNombre = useUserStore((state) => state.setNombre);
  const setIdRol = useUserStore((state) => state.setIdRol);
  const setSur = useUserStore((state) => state.setSur);
  const setIdTenant = useUserStore((state) => state.setIdTenant);
  const clearUser = useUserStore((state) => state.clearUser);

const login = async (credentials) => {
  try {
    const { data } = await loginRequest(credentials);
    if (data?.success) {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.data));
      setIsAuthenticated(true);
      setUser(data.data);
      setNombre(data.data.usuario || data.data.name || "");
      setIdRol(data.data.rol || data.data.idRol || null);
      setSur(data.data.sucursal || null);
      setIdTenant(data.data.id_tenant || null);
      return { success: true, data: data.data };
    }
    return { success: false, message: data?.message || "Credenciales inválidas" };
  } catch (e) {
    return { success: false, message: "Error de autenticación" };
  }
};

  const logout = async () => {
    try {
      const token = sessionStorage.getItem("token");
      logoutRequest(token);
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user"); // También remover datos del usuario
      setUser(null);
      setIsAuthenticated(false);

      // Limpia Zustand
      clearUser();

      redirect('/');
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const checkLogin = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        clearUser();
        sessionStorage.removeItem("user"); // Limpiar datos de usuario si no hay token
        return;
      }
      try {
        const res = await verifyTokenRequest(token);
        if (!res.data) {
          setIsAuthenticated(false);
          setLoading(false);
          clearUser();
          sessionStorage.removeItem("user");
          return;
        }
        
        // Guardar datos del usuario en sessionStorage también aquí
        sessionStorage.setItem("user", JSON.stringify(res.data));
        
        setIsAuthenticated(true);
        setUser(res.data);
        setNombre(res.data.name || res.data.usuario || "");
        setIdRol(res.data.rol || res.data.idRol || null);
        setSur(res.data.sucursal || res.data.idSucursal || null);
        setIdTenant(res.data.id_tenant || null);
        setLoading(false);
      } catch (error) {
        setIsAuthenticated(false);
        setLoading(false);
        clearUser();
        sessionStorage.removeItem("user");
      }
    };
    checkLogin();
  }, [setNombre, setIdRol, setSur, clearUser, setIdTenant]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};