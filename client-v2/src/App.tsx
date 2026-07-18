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

// Layout + login + landing cargan de inmediato; las páginas van diferidas (code-split por ruta).
import LoginPage from "@/features/auth/pages/LoginPage";
import LandingPage from "@/features/landing/pages/LandingPage";
import LegalPage from "@/features/landing/pages/LegalPage";
import ServiciosPage from "@/features/landing/pages/ServiciosPage";
import AboutPage from "@/features/landing/pages/AboutPage";
import TeamPage from "@/features/landing/pages/TeamPage";
import UpdatesPage from "@/features/landing/pages/UpdatesPage";
import ContactPage from "@/features/landing/pages/ContactPage";
import PaymentResultPage from "@/features/landing/pages/PaymentResultPage";
import RegisterPage from "@/features/registration/pages/RegisterPage";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { PageLoader } from "@/components/shared/PageLoader";
import { RequireCapability } from "@/components/shared/RequireCapability";

const ProductsPage = lazy(() => import("@/features/products/pages/ProductsPage"));
const LandingSubPage = lazy(() => import("@/features/landing/pages/LandingSubPage"));
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
const WarehouseNotesPage = lazy(() => import("@/features/warehouse-notes/pages/WarehouseNotesPage"));
const GuidesPage = lazy(() => import("@/features/despatch-guides/pages/GuidesPage"));
const DeveloperPage = lazy(() => import("@/features/developer/pages/DeveloperPage"));
const ExpressHomePage = lazy(() => import("@/features/express/pages/ExpressHomePage"));
const HistoricoKardexPage = lazy(() => import("@/features/kardex/pages/HistoricoKardexPage"));
const AccountingPage = lazy(() => import("@/features/accounting/pages/AccountingPage"));

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
    return <Navigate to="/login" replace />;
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
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/terminos" element={<LegalPage kind="terms" />} />
              <Route path="/privacidad" element={<LegalPage kind="privacy" />} />
              <Route path="/servicios" element={<ServiciosPage />} />
              <Route path="/sobre-nosotros" element={<AboutPage />} />
              <Route path="/equipo" element={<TeamPage />} />
              <Route path="/actualizaciones" element={<UpdatesPage />} />
              <Route path="/contactanos" element={<ContactPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/success" element={<PaymentResultPage />} />
              <Route path="/failure" element={<PaymentResultPage />} />
              <Route path="/pending" element={<PaymentResultPage />} />
              {/* Pocket POS (Express) tiene su propio sistema de auth, independiente del ERP */}
              <Route path="/express-pos" element={<ExpressHomePage />} />

              <Route path="/sobre-nosotros" element={<LandingSubPage pageId="sobre-nosotros" />} />
              <Route path="/equipo" element={<LandingSubPage pageId="equipo" />} />
              <Route path="/actualizaciones" element={<LandingSubPage pageId="actualizaciones" />} />
              <Route path="/terminos" element={<LandingSubPage pageId="terminos" />} />
              <Route path="/privacidad" element={<LandingSubPage pageId="privacidad" />} />
              <Route path="/contactanos" element={<LandingSubPage pageId="contactanos" />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Main Dashboard Layout */}
                <Route element={<DashboardLayout />}>
                  {/* "Inicio" no requiere capability — visible para cualquier usuario autenticado. */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/products"
                    element={<RequireCapability capability="productos.view"><ProductsPage /></RequireCapability>}
                  />
                  <Route
                    path="/sales"
                    element={<RequireCapability capability="ventas.view"><SalesPage /></RequireCapability>}
                  />
                  <Route
                    path="/sales/pos"
                    element={<RequireCapability capability="ventas.view"><SalesPage /></RequireCapability>}
                  />
                  <Route
                    path="/people/clients"
                    element={<RequireCapability capability="clientes.view"><ClientesPage /></RequireCapability>}
                  />
                  <Route
                    path="/people/providers"
                    element={<RequireCapability capability="proveedores.view"><SuppliersPage /></RequireCapability>}
                  />
                  <Route
                    path="/suppliers"
                    element={<RequireCapability capability="proveedores.view"><SuppliersPage /></RequireCapability>}
                  />
                  <Route
                    path="/inventory"
                    element={<RequireCapability capability="almacen.view"><InventoryPage /></RequireCapability>}
                  />
                  <Route
                    path="/people/employees"
                    element={<RequireCapability capability="empleados.view"><EmployeesPage /></RequireCapability>}
                  />
                  <Route
                    path="/logistics/branches"
                    element={<RequireCapability capability="sucursal.view"><BranchesPage /></RequireCapability>}
                  />
                  <Route
                    path="/logistics/warehouses"
                    element={<RequireCapability capability="almaceng.view"><WarehousesPage /></RequireCapability>}
                  />
                  <Route
                    path="/logistics/warehouse-notes"
                    element={<RequireCapability capability="nota_almacen.view"><WarehouseNotesPage /></RequireCapability>}
                  />
                  <Route
                    path="/logistics/guides"
                    element={<RequireCapability capability="guia_remision.view"><GuidesPage /></RequireCapability>}
                  />
                  <Route
                    path="/logistics/kardex"
                    element={<RequireCapability capability="almacen.view"><KardexPage /></RequireCapability>}
                  />
                  <Route
                    path="/settings/users"
                    element={<RequireCapability capability="configuracion/usuarios.view"><UsersPage /></RequireCapability>}
                  />
                  <Route
                    path="/settings/roles"
                    element={<RequireCapability capability="configuracion/roles.view"><RolesPage /></RequireCapability>}
                  />
                  <Route
                    path="/settings/system"
                    element={<RequireCapability capability="configuracion/negocio.view"><SettingsPage /></RequireCapability>}
                  />
                  <Route
                    path="/reports/sales"
                    element={<RequireCapability capability="reportes.view"><ReportsPage /></RequireCapability>}
                  />
                  <Route
                    path="/accounting"
                    element={<RequireCapability capability="contabilidad.view"><AccountingPage /></RequireCapability>}
                  />
                  <Route
                    path="/developer"
                    element={<RequireCapability developerOnly><DeveloperPage /></RequireCapability>}
                  />
                  {/* Other routes can be registered here as features are developed from scratch */}
                </Route>
                
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
