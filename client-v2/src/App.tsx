import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/store/useUserStore";
import { verifyTokenRequest } from "@/api/auth";
import { setAuthReady } from "@/api/axios";
import { getToken } from "@/utils/authStorage";
import { Loader2 } from "lucide-react";

// Layout + login cargan de inmediato; las páginas van diferidas (code-split por ruta).
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { PageLoader } from "@/components/shared/PageLoader";

const ProductsPage = lazy(() => import("@/features/products/pages/ProductsPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const ClientesPage = lazy(() => import("@/features/clientes/pages/ClientesPage"));
const SuppliersPage = lazy(() => import("@/features/suppliers/pages/SuppliersPage"));
const BranchesPage = lazy(() => import("@/features/branches/pages/BranchesPage"));
const WarehousesPage = lazy(() => import("@/features/warehouses/pages/WarehousesPage"));
const KardexPage = lazy(() => import("@/features/kardex/pages/KardexPage"));
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));
const RolesPage = lazy(() => import("@/features/roles/pages/RolesPage"));
const SettingsPage = lazy(() => import("@/features/settings/pages/SettingsPage"));
const ReportsPage = lazy(() => import("@/features/reports/pages/ReportsPage"));
const SalesPage = lazy(() => import("@/features/sales/pages/SalesPage"));
const InventoryPage = lazy(() => import("@/features/inventory/pages/InventoryPage"));
const EmployeesPage = lazy(() => import("@/features/employees/pages/EmployeesPage"));
const ContentPage = lazy(() => import("@/features/content/pages/ContentPage"));
const WarehouseNotesPage = lazy(() => import("@/features/warehouse-notes/pages/WarehouseNotesPage"));

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
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Main Dashboard Layout */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/content" element={<ContentPage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/sales/pos" element={<SalesPage />} />
                  <Route path="/people/clients" element={<ClientesPage />} />
                  <Route path="/people/providers" element={<SuppliersPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/people/employees" element={<EmployeesPage />} />
                  <Route path="/logistics/branches" element={<BranchesPage />} />
                  <Route path="/logistics/warehouses" element={<WarehousesPage />} />
                  <Route path="/logistics/warehouse-notes" element={<WarehouseNotesPage />} />
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
            </Suspense>
          </TooltipProvider>
        </NuqsAdapter>
      </Router>
    </QueryClientProvider>
  );
}
