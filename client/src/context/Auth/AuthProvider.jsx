import { setToken, getToken, removeToken } from "@/utils/authStorage";
import { AuthContext } from "./AuthContext";
import { redirect } from 'react-router-dom';
import { useEffect, useContext, useState } from "react";
import { loginRequest, logoutRequest, verifyTokenRequest, sendAuthCodeRequest } from "../../api/api.auth";
import { getPermisosByRol, getModulosConSubmodulos } from "@/services/permisos.services"; // Check if getModulosConSubmodulos is exported from services
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
      // 1. Fetch Global Config FIRST (Active Actions)
      let globalConfigs = [];
      try {
        const modulos = await getModulosConSubmodulos();
        // Handle { success: true, data: [...] } or [...]
        const data = modulos?.data || modulos || [];
        globalConfigs = Array.isArray(data) ? data : [];
        useUserStore.getState().setGlobalModuleConfigs(globalConfigs);
      } catch (err) {
        console.warn("Error loading global configs", err);
      }

      // Helper to find active_actions for a permission
      const getActiveActions = (idModulo, idSubmodulo) => {
        if (!globalConfigs.length) return null; // If config load failed, allow all? Or deny? Safer to allow existing behavior (null) or empty. Let's return null to signify "unknown/all".

        // Config is a tree: Modules -> Submodules
        const moduleConfig = globalConfigs.find(m => String(m.id) === String(idModulo));
        if (!moduleConfig) return []; // Module not found in catalog? Disable.

        if (idSubmodulo && idSubmodulo !== 0) {
          const subConfig = moduleConfig.submodulos?.find(s => String(s.id_submodulo) === String(idSubmodulo));
          return subConfig?.active_actions || [];
        }
        return moduleConfig.active_actions || [];
      };

      const parseActions = (actions) => {
        if (!actions) return null; // Null means "All actions active" (backward compat) or "No Config". Guide says Gatekeeper. 
        // If we recently added active_actions, it might be null for old rows. 
        // Recommendation: If null/empty, assume ALL are active if we are in transition. 
        // BUT for "Gatekeeper", we want strictness.
        // Let's assume: If it's a string, parse it. If array, use it.
        if (Array.isArray(actions)) return actions;
        if (typeof actions === 'string') {
          try { return JSON.parse(actions); } catch { return []; }
        }
        return [];
      };

      // 2. Fetch Role Permissions
      const response = await getPermisosByRol(roleId);
      const permissionsList = Array.isArray(response) ? response : (response?.data || []);

      // 3. Generate Capabilities (Intersection)
      const caps = new Set();

      permissionsList.forEach(p => {
        const slug = p.submodulo_ruta || p.modulo_ruta;
        if (!slug) return;
        const base = slug.toLowerCase();

        // Get limits from Catalog
        const rawActive = getActiveActions(p.id_modulo, p.id_submodulo);
        const activeActions = parseActions(rawActive);

        // Intersection Logic:
        // If activeActions is null, it means no config found -> Default to ALLOW (legacy behavior) 
        // OR strict Deny?
        // Given we just added the column, it might be null. Let's Default to ALLOW if null.
        // If it is [], it means "Nothing allowed".

        const isAllowed = (action) => {
          if (activeActions === null) return true;
          return activeActions.includes(action);
        };

        // Standard Actions
        if (p.ver) caps.add(`${base}.view`); // 'Ver' usually implies access, strictly speaking we treat it as view.
        // Should we gate 'ver'? Usually yes.
        // if (p.ver && isAllowed('ver')) caps.add(`${base}.view`); 
        // For now, let's keep '.view' ungated or gated by 'ver'? 
        // The active_actions usually has 'ver'.

        // Applying Gatekeeper:
        if (p.ver && isAllowed('ver')) caps.add(`${base}.view`);
        if (p.crear && isAllowed('crear')) caps.add(`${base}.create`);
        if (p.editar && isAllowed('editar')) caps.add(`${base}.edit`);
        if (p.eliminar && isAllowed('eliminar')) caps.add(`${base}.delete`);

        // Custom Actions
        if (p.desactivar && isAllowed('desactivar')) caps.add(`${base}.deactivate`);
        if (p.generar && isAllowed('generar')) caps.add(`${base}.generate`);
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
      // useUserStore.getState().setGlobalModuleConfigs([]); // Already set or empty
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
