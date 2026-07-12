import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/store/useUserStore";
import { verifyTokenRequest } from "@/api/auth";
import { setAuthReady } from "@/api/axios";
import { getToken } from "@/utils/authStorage";

// Layouts and Pages
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProductsPage from "@/features/products/pages/ProductsPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import ClientesPage from "@/features/clientes/pages/ClientesPage";
import SuppliersPage from "@/features/suppliers/pages/SuppliersPage";
import BranchesPage from "@/features/branches/pages/BranchesPage";
import WarehousesPage from "@/features/warehouses/pages/WarehousesPage";
import KardexPage from "@/features/kardex/pages/KardexPage";
import UsersPage from "@/features/users/pages/UsersPage";
import RolesPage from "@/features/roles/pages/RolesPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import SalesPage from "@/features/sales/pages/SalesPage";
import InventoryPage from "@/features/inventory/pages/InventoryPage";
import EmployeesPage from "@/features/employees/pages/EmployeesPage";
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
        // Skip request if no token stored — unauthed state is expected, not an error
        const token = await getToken();
        if (!token) {
          clearUser();
          return;
        }

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
        // 401 means no valid session — expected, no need to surface as error
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
      <Router>
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
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/sales/pos" element={<SalesPage />} />
                  <Route path="/people/clients" element={<ClientesPage />} />
                  <Route path="/people/providers" element={<SuppliersPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/people/employees" element={<EmployeesPage />} />
                  <Route path="/logistics/branches" element={<BranchesPage />} />
                  <Route path="/logistics/warehouses" element={<WarehousesPage />} />
                  <Route path="/logistics/kardex" element={<KardexPage />} />
                  <Route path="/settings/users" element={<UsersPage />} />
                  <Route path="/settings/roles" element={<RolesPage />} />
                  <Route path="/settings/system" element={<SettingsPage />} />
                  <Route path="/reports/sales" element={<ReportsPage />} />
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
