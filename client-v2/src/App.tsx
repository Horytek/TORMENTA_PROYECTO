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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600 dark:text-purple-400" />
        <p className="mt-4 text-sm text-slate-500 animate-pulse">Sincronizando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// Temporary Dashboard Mock for Phase 1 Layout
function TempDashboard() {
  const user = useUserStore((state) => state.user);
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-md max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        Bienvenido de vuelta, {user?.username}! 👋
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Has ingresado correctamente a la nueva interfaz desde cero de Horytek ERP. 
        Este módulo inicial está listo para ser desarrollado en TypeScript y shadcn/ui.
      </p>
      <div className="text-xs font-mono bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-900 text-slate-400">
        <span className="text-purple-600 dark:text-purple-400 font-bold">Detalles de sesión:</span><br />
        ID Tenant: {user?.id_tenant}<br />
        ID Empresa: {user?.id_empresa}<br />
        Rol ID: {user?.roleId}<br />
        Sucursal: {user?.sucursal || "Matriz Principal"}
      </div>
    </div>
  );
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
                  <Route path="/dashboard" element={<TempDashboard />} />
                  <Route path="/products" element={<ProductsPage />} />
                  {/* Other routes can be registered here as features are developed from scratch */}
                </Route>
                
                {/* POS Express layout placeholder */}
                <Route path="/express/dashboard" element={<TempDashboard />} />
                
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
