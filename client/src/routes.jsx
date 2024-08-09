import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/Auth/AuthProvider";

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <Navigate to="/Inicio" replace />;
  if (!isAuthenticated && !loading) return <Navigate to="/" replace />;
  return <Outlet />;
};

export function RouteProtectedRol({ children, allowedRoles }) {
  const { user } = useAuth();

  // Verifica si el rol del usuario está en la lista de roles permitidos
  const hasAccess = allowedRoles.includes(user?.rol);

  if (!hasAccess) {
    // Redirige a una ruta permitida si el usuario no tiene acceso
    return <Navigate to="/Inicio" />;
  }

  return children;
}