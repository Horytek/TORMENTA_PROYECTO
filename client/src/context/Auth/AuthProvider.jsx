import { setToken, getToken, removeToken } from "@/utils/authStorage";
import { AuthContext } from "./AuthContext";
import { redirect } from 'react-router-dom';
import { useEffect, useContext, useState } from "react";
import { loginRequest, logoutRequest, verifyTokenRequest, sendAuthCodeRequest } from "../../api/api.auth";
import { getPermisosByRol } from "@/services/permisos.services";
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
  const setPermissions = useUserStore(state => state.setPermissions);
  const setCapabilities = useUserStore(state => state.setCapabilities);
  const hydrateFromSession = useUserStore(state => state.hydrateFromSession);
  const clearUserStore = useUserStore(state => state.clearUser);

  // Solo guarda el usuario (no el token)
  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  const loadPermissions = async (roleId) => {
    try {
      const response = await getPermisosByRol(roleId);
      // data might be in response.data or response directly
      const permissionsList = Array.isArray(response) ? response : (response?.data || []);

      // Generate Capabilities Set (Flattened)
      const caps = new Set();

      permissionsList.forEach(p => {
        // Base slug from route (e.g., 'inventory', 'products')
        const slug = p.submodulo_ruta || p.modulo_ruta;
        if (!slug) return;

        const base = slug.toLowerCase();

        // Standard Actions
        if (p.ver) caps.add(`${base}.view`);
        if (p.crear) caps.add(`${base}.create`);
        if (p.editar) caps.add(`${base}.edit`);
        if (p.eliminar) caps.add(`${base}.delete`);

        // Custom Actions
        if (p.desactivar) caps.add(`${base}.deactivate`);
        if (p.generar) caps.add(`${base}.generate`);
      });

      // Grant 'admin' * capability for role 10
      if (Number(roleId) === 10) {
        caps.add('*');
        caps.add('admin');
      }

      setCapabilities(caps);
      setPermissions(permissionsList);
    } catch (error) {
      console.error("Error loading permissions", error);
      setPermissions([]);
      setCapabilities(new Set());
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await loginRequest(credentials);
      if (data?.success && data.token) {
        await setToken(data.token); // Guardar en IndexedDB
        setUser(data.data);
        setUserRaw(data.data);

        // Fetch permissions immediately
        if (data.data.roleId || data.data.rol || data.data.id_rol) {
          const roleId = data.data.roleId || data.data.rol || data.data.id_rol;
          await loadPermissions(roleId);
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

          // Fetch permissions on verify
          if (res.data.id_rol || res.data.rol || res.data.roleId) {
            const roleId = res.data.id_rol || res.data.rol || res.data.roleId;
            await loadPermissions(roleId);
          }

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
    clearUserStore(); // This clears permissions too
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
