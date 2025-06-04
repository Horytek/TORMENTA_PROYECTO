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
  const clearUser = useUserStore((state) => state.clearUser);

  const login = async (user) => {
    try {
      const res = await loginRequest(user);
      sessionStorage.setItem("token", res.data.token);
      setUser(res.data.data);
      setIsAuthenticated(true);

      // Actualiza Zustand
      setNombre(res.data.data.name || res.data.data.usuario || "");
      setIdRol(res.data.data.rol || res.data.data.idRol || null);
      setSur(res.data.data.sucursal || res.data.data.idSucursal || null);

      return res.data;
    } catch (error) {
      console.log(error);
    }
  };

  const logout = async () => {
    try {
      const token = sessionStorage.getItem("token");
      logoutRequest(token);
      sessionStorage.removeItem("token");
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
        return;
      }
      try {
        const res = await verifyTokenRequest(token);
        if (!res.data) {
          setIsAuthenticated(false);
          setLoading(false);
          clearUser();
          return;
        }
        setIsAuthenticated(true);
        setUser(res.data);
        setNombre(res.data.name || res.data.usuario || "");
        setIdRol(res.data.rol || res.data.idRol || null);
      if (res.data.data) {
        setSur(res.data.data.sucursal || res.data.data.idSucursal || null);
      } else {
        setSur(null);
      }
        setLoading(false);
      } catch (error) {
        setIsAuthenticated(false);
        setLoading(false);
        clearUser();
      }
    };
    checkLogin();
  }, [setNombre, setIdRol, setSur, clearUser]);

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