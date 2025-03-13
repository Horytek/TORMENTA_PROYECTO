/* eslint-disable react-hooks/exhaustive-deps */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/Auth/AuthProvider";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import debounce from 'lodash.debounce';
import axios from "@/api/axios";

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
  }, 5); // Ajusta el tiempo según sea necesario

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

  // Función para verificar permisos
  const checkPermission = debounce(async () => {
    if (!isAuthenticated || !user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }
    
    try {
      if (user.rol === 10) {
        setHasAccess(true);
        setLoading(false);
        return;
      }
      
      const token = sessionStorage.getItem('token');
      
      
      if (!token) {
        console.error("No authentication token found in sessionStorage");
        toast.error("Sesión expirada o inválida. Por favor, vuelva a iniciar sesión", {
          duration: 2000,
          position: 'top-right',
        });
        setHasAccess(false);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `/permisos/check?idModulo=${idModulo}${idSubmodulo ? `&idSubmodulo=${idSubmodulo}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("Respuesta de verificación de permisos:", response.data);
      
      setHasAccess(response.data.hasPermission);
      
      if (!response.data.hasPermission) {
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

  return children;
}