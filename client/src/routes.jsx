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

    const found = permissions?.find(p => {
      const sameModule = String(p.id_modulo) === String(idModulo);
      const sameSub = idSubmodulo
        ? String(p.id_submodulo) === String(idSubmodulo)
        : (p.id_submodulo === null || p.id_submodulo === undefined);
      return sameModule && sameSub;
    });

    if (found && found.ver === 1) {
      setHasAccess(true);
      setComputedPermissions({
        hasPermission: true,
        hasCreatePermission: found.crear === 1,
        hasEditPermission: found.editar === 1,
        hasDeletePermission: found.eliminar === 1,
        hasGeneratePermission: found.generar === 1,
        hasDeactivatePermission: found.desactivar === 1,
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