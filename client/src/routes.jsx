/* eslint-disable react-hooks/exhaustive-deps */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/Auth/AuthProvider";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import debounce from 'lodash.debounce';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (!isAuthenticated && !loading) return <Navigate to="/" replace />;
  return <Outlet />;
};

export function RouteProtectedRol({ children, allowedRoles }) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  // Función para verificar acceso
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
  }, 5); // Ajusta el tiempo según sea necesario

  useEffect(() => {
    checkAccess();
  }, [user, allowedRoles]);

  if (!hasAccess) {
    return null;
  }

  return children;
}