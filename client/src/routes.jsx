/* eslint-disable react-hooks/exhaustive-deps */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/Auth/AuthProvider";
import { toast } from "react-hot-toast";
import { useEffect, useState, createContext, useContext } from "react";
import debounce from 'lodash.debounce';
import axios from "@/api/axios";

// Crear un contexto de permisos
export const PermisosContext = createContext({
  hasPermission: false,
  hasCreatePermission: false,
  hasEditPermission: false,
  hasDeletePermission: false,
  hasGeneratePermission: false,
  hasDeactivatePermission: false,
});

// Hook para usar los permisos
export const usePermisos = () => useContext(PermisosContext);

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (!isAuthenticated && !loading) return <Navigate to="/" replace />;
  return <Outlet />;
};

export function RouteProtectedRol({ children, allowedRoles }) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  const checkAccess = debounce(() => {
    if (!user || typeof user.rol === "undefined" || user.rol === null) {
      setHasAccess(false);
      return;
    }
    const access = allowedRoles.includes(user.rol);
    setHasAccess(access);

    if (!access) {
      toast.error("No tienes permisos para acceder a esta página", {
        duration: 1000,
        position: 'top-right',
        style: {
          background: '#FFF5F4',
          color: '#FF3838',
        },
        icon: '🚫',
      });
    }
  }, 5);

  useEffect(() => {
    checkAccess();
  }, [user, allowedRoles]);

  if (!hasAccess) {
    return null;
  }

  return children;
}

import { useUserStore } from "@/store/useStore";

export function RoutePermission({ children, idModulo, idSubmodulo = null, capability = null }) {
  const { user, isAuthenticated } = useAuth();
  const permissions = useUserStore(state => state.permissions);
  const capabilities = useUserStore(state => state.capabilities);
  const [hasAccess, setHasAccess] = useState(false);

  const [computedPermissions, setComputedPermissions] = useState({
    hasPermission: false,
    hasCreatePermission: false,
    hasEditPermission: false,
    hasDeletePermission: false,
    hasGeneratePermission: false,
    hasDeactivatePermission: false,
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setHasAccess(false);
      return;
    }

    // Developer Overwrite
    if (user.rol === 10) {
      setHasAccess(true);
      setComputedPermissions({
        hasPermission: true,
        hasCreatePermission: true,
        hasEditPermission: true,
        hasDeletePermission: true,
        hasGeneratePermission: true,
        hasDeactivatePermission: true,
      });
      return;
    }

    // 1. New Capability Logic
    if (capability) {
      const base = capability.toLowerCase();
      // Access usually implies '.view'
      const canView = capabilities.has(`${base}.view`);

      if (canView) {
        setHasAccess(true);
        setComputedPermissions({
          hasPermission: true,
          hasCreatePermission: capabilities.has(`${base}.create`),
          hasEditPermission: capabilities.has(`${base}.edit`),
          hasDeletePermission: capabilities.has(`${base}.delete`),
          hasGeneratePermission: capabilities.has(`${base}.generate`),
          hasDeactivatePermission: capabilities.has(`${base}.deactivate`),
        });
      } else {
        setHasAccess(false);
      }
      return;
    }

    // 2. Legacy ID Logic
    if (!idModulo) {
      setHasAccess(false);
      return;
    }

    const globalConfigs = useUserStore.getState().globalModuleConfigs || [];
    const moduleConfig = globalConfigs.find(m => {
      if (idSubmodulo) {
        // Search in submodules
        return m.submodulos?.some(s => String(s.id_submodulo) === String(idSubmodulo));
      }
      return String(m.id) === String(idModulo); // Use 'id' as per store normalization if applicable, or check structure
    });

    // If not found in flat list, we might need a recursive finder or flattened list.
    // Assuming globalModuleConfigs has nested structure from 'rutas' endpoint: { id, submodulos: [] }

    let activeActions = [];
    if (idSubmodulo) {
      // Find parent module then submodulo
      const parent = globalConfigs.find(m => m.submodulos?.some(s => String(s.id_submodulo) === String(idSubmodulo)));
      const sub = parent?.submodulos?.find(s => String(s.id_submodulo) === String(idSubmodulo));
      activeActions = sub?.active_actions || [];
    } else {
      const mod = globalConfigs.find(m => String(m.id) === String(idModulo));
      activeActions = mod?.active_actions || [];
    }

    // Parse if string (just in case backend sends string)
    if (typeof activeActions === 'string') {
      try { activeActions = JSON.parse(activeActions); } catch (e) { activeActions = []; }
    }
    // If array but empty, it might mean "all allowed" or "none allowed". 
    // Usually active_actions is explicit. If undefined/null, we might default to ALL for backward compat, BUT guide says "Gatekeeper".
    // Let's assume emptiness means "Inherit" or "All" for now to avoid breaking everything if fetch fails.
    // Ideally: if activeActions exists, use it.

    const isActionActive = (action) => {
      if (!activeActions || activeActions.length === 0) return true; // Fallback if config active_actions is empty/missing
      return activeActions.includes(action);
    };

    const found = permissions?.find(p => {
      const sameModule = String(p.id_modulo) === String(idModulo);
      const sameSub = idSubmodulo
        ? String(p.id_submodulo) === String(idSubmodulo)
        : (p.id_submodulo === null || p.id_submodulo === undefined || p.id_submodulo === 0);
      return sameModule && sameSub;
    });

    if (found && found.ver === 1) {
      setHasAccess(true);
      setComputedPermissions({
        hasPermission: true,
        hasCreatePermission: (found.crear === 1) && isActionActive('crear'),
        hasEditPermission: (found.editar === 1) && isActionActive('editar'),
        hasDeletePermission: (found.eliminar === 1) && isActionActive('eliminar'),
        hasGeneratePermission: (found.generar === 1) && isActionActive('generar'),
        hasDeactivatePermission: (found.desactivar === 1) && isActionActive('desactivar'),
      });
    } else {
      setHasAccess(false);
    }

  }, [user, permissions, capabilities, idModulo, idSubmodulo, capability, isAuthenticated]);

  if (!hasAccess) {
    // Optional: Render "Unauthorized" placeholder or null
    return null;
  }

  return (
    <PermisosContext.Provider value={computedPermissions}>
      {children}
    </PermisosContext.Provider>
  );
}