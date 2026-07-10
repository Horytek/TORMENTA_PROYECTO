import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/store/useUserStore";
import { verifyTokenRequest, resetVerifyTokenCache } from "@/api/auth";
import { setAuthReady } from "@/api/axios";
import { removeToken } from "@/utils/authStorage";

// Layouts and Pages
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProductsPage from "@/features/products/pages/ProductsPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ClientesPage from "@/features/clientes/pages/ClientesPage";
import ProveedoresPage from "@/features/proveedores/pages/ProveedoresPage";
import { Loader2 } from "lucide-react";

// Initialize Query Client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Protected Route Guard
function ProtectedRoute() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const loading = useUserStore((state) => state.loading);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
        <p className="num mt-4 text-sm text-muted-foreground">Sincronizando sesión…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const setUserRaw = useUserStore((state) => state.setUserRaw);
  const clearUser = useUserStore((state) => state.clearUser);
  const setLoading = useUserStore((state) => state.setLoading);

  // Verify Auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await verifyTokenRequest();
        const resData = response.data;
        if (resData && resData.success) {
          setUserRaw(resData);
          const roleId = Number(resData.rol || resData.id_rol || resData.roleId);
          if (roleId) {
            await useUserStore.getState().loadPermissionsAndCapabilities(roleId);
          }
        } else {
          clearUser();
        }
      } catch (error) {
        console.error("Error de verificación de sesión:", error);
        clearUser();
      } finally {
        setLoading(false);
        setAuthReady(true);
      }
    };

    checkAuth();
  }, [setUserRaw, clearUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NuqsAdapter>
          <TooltipProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Main Dashboard Layout */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/people/clients" element={<ClientesPage />} />
                  <Route path="/people/providers" element={<ProveedoresPage />} />
                  {/* Other routes can be registered here as features are developed from scratch */}
                </Route>
                
                {/* POS Express layout placeholder */}
                <Route path="/express/dashboard" element={<DashboardPage />} />
                
                {/* Fallback wildcard redirects to dashboard */}
                <Route path="/*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </TooltipProvider>
        </NuqsAdapter>
      </Router>
    </QueryClientProvider>
  );
}
