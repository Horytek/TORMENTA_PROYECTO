import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/Auth/AuthProvider";

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <Navigate to="/Inicio" replace />;
  if (!isAuthenticated && !loading) return <Navigate to="/" replace />;
  return <Outlet />;
};