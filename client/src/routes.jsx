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

export function RoutePermission({ children, idModulo, idSubmodulo = null }) {
  const { user, isAuthenticated } = useAuth();
  const permissions = useUserStore(state => state.permissions);
  const [hasAccess, setHasAccess] = useState(false);
  // Remove inner loading state because permissions should be loaded with AuthProvider
  // However, if we want to be safe, we might check if permissions are empty but user is logged in?
  // But for now, let's assume AuthProvider handles the "loading" of app until auth check is done.

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
    // Note: user.rol, user.role, etc. Standardize with user store?
    // user store has "rol".
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

    if (!idModulo) {
      setHasAccess(false);
      return;
    }

    // Check against store permissions
    // Permissions structure: [{ id_modulo, id_submodulo, ver, crear... }]
    // Note: ensure loose comparison if strings vs numbers
    /* const perm = permissions?.find(p =>
      String(p.id_modulo) === String(idModulo) &&
      (idSubmodulo ? String(p.id_submodulo) === String(idSubmodulo) : true)
    ); */

    // If submodulo is specified but permission entry has submodulo null, that might be a broader permission? 
    // Usually backend returns specific rows. 
    // If idSubmodulo is provided, we MUST find a match with that submodulo.
    // If idSubmodulo is NOT provided (null), we look for a match where id_submodulo is null (or check if any exists?)
    // Based on backend: getPermisosByRol returns a list.

    // Logic:
    // If We ask for Modulo X, Submodulo Y:
    // We look for a permission entry with id_modulo=X AND id_submodulo=Y.
    // If We ask for Modulo X (no submodulo):
    // We look for a permission entry with id_modulo=X (and submodulo usually null or we take the first one? usually main module permission)

    // Refinement:
    // Backend "checkPermiso" logic: 
    // AND (p.id_submodulo = ? OR (p.id_submodulo IS NULL AND ? IS NULL))

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
      // Toast only if we are sure it's not just a "loading" glitch? 
      // With sync check, it's immediate.
    }

  }, [user, permissions, idModulo, idSubmodulo, isAuthenticated]);

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