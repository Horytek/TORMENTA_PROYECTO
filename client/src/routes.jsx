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

export function RoutePermission({ children, idModulo, idSubmodulo = null }) {
  const { user, isAuthenticated } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    hasPermission: false,
    hasCreatePermission: false,
    hasEditPermission: false,
    hasDeletePermission: false,
    hasGeneratePermission: false,
    hasDeactivatePermission: false,
  });

  const checkPermission = debounce(async () => {
    if (!isAuthenticated || !user) {
      setHasAccess(false);
      setPermissions({
        hasPermission: false,
        hasCreatePermission: false,
        hasEditPermission: false,
        hasDeletePermission: false,
        hasGeneratePermission: false,
        hasDeactivatePermission: false,
      });
      setLoading(false);
      return;
    }

        // Evitar llamadas inválidas
    if (!idModulo || isNaN(Number(idModulo))) {
      setHasAccess(false);
      setPermissions({
        hasPermission: false,
        hasCreatePermission: false,
        hasEditPermission: false,
        hasDeletePermission: false,
        hasGeneratePermission: false,
        hasDeactivatePermission: false,
      });
      setLoading(false);
      return;
    }
    
    try {
      if (user.rol === 10) {
        setHasAccess(true);
        setPermissions({
          hasPermission: true,
          hasCreatePermission: true,
          hasEditPermission: true,
          hasDeletePermission: true,
          hasGeneratePermission: true,
          hasDeactivatePermission: true,
        });
        setLoading(false);
        return;
      }

      // Ya no se usa token, el backend lee la cookie HTTPOnly
      const response = await axios.get(
        `/permisos/check?idModulo=${Number(idModulo)}${idSubmodulo ? `&idSubmodulo=${Number(idSubmodulo)}` : ''}`
      );
      
      const hasAccess = response.data.hasPermission;
      setHasAccess(hasAccess);
      setPermissions({
        hasPermission: hasAccess,
        hasCreatePermission: response.data.hasCreatePermission || false,
        hasEditPermission: response.data.hasEditPermission || false,
        hasDeletePermission: response.data.hasDeletePermission || false,
        hasGeneratePermission: response.data.hasGeneratePermission || false,
        hasDeactivatePermission: response.data.hasDeactivatePermission || false,
      });
      
      if (!hasAccess) {
        toast.error("No tienes permisos para acceder a esta página", {
          duration: 2000,
          position: 'top-right',
          style: {
            background: '#FFF5F4',
            color: '#FF3838',
          },
          icon: '🚫',
        });
      }
    } catch (error) {
      console.error("Error verificando permisos:", error);
      console.error("Detalles del error:", error.response?.data || error.message);
      setHasAccess(false);
      setPermissions({
        hasPermission: false,
        hasCreatePermission: false,
        hasEditPermission: false,
        hasDeletePermission: false,
        hasGeneratePermission: false,
        hasDeactivatePermission: false,
      });
      
      toast.error("Error al verificar permisos", {
        duration: 2000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  }, 100);

  useEffect(() => {
    checkPermission();
  }, [user, idModulo, idSubmodulo]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-20">
      <span>Verificando permisos...</span>
    </div>;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <PermisosContext.Provider value={permissions}>
      {children}
    </PermisosContext.Provider>
  );
}