import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/Auth/AuthProvider";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <Navigate to="/Inicio" replace />;
  if (!isAuthenticated && !loading) return <Navigate to="/" replace />;
  return <Outlet />;
};

export function RouteProtectedRol({ children, allowedRoles }) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user) {
      const access = allowedRoles.includes(user.rol);
      setHasAccess(access);

      if (!access) {
        toast.error("No tienes permisos para acceder a esta página", {duration: 500});
      }
    }
  }, [user, allowedRoles]);

  if (!user) {
    return <Navigate to="/Inicio" />;
  }

  if (!hasAccess) {
    return <Navigate to="/Inicio" />;
  }

  return children;
}