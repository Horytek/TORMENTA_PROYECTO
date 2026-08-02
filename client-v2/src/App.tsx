import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/store/useUserStore";
import { verifyTokenRequest } from "@/api/auth";
import { setAuthReady } from "@/api/axios";
import { getToken } from "@/utils/authStorage";

// Solo el layout, el login y la infra de UI cargan de inmediato; TODO lo demás
// (páginas de app Y de marketing) va diferido (code-split por ruta). Las páginas
// públicas de landing NO deben pesar en el bundle que se baja un usuario logueado.
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { PageLoader } from "@/components/shared/PageLoader";
import { RequireCapability } from "@/components/shared/RequireCapability";
import { Toaster } from "@/components/ui/sonner";
import { AuthzToastBridge } from "@/components/shared/AuthzToastBridge";

// Landing / marketing / registro — diferidas (un usuario del ERP nunca las ve).
const LandingPage = lazy(() => import("@/features/landing/pages/LandingPage"));
const LegalPage = lazy(() => import("@/features/landing/pages/LegalPage"));
const ServiciosPage = lazy(() => import("@/features/landing/pages/ServiciosPage"));
const AboutPage = lazy(() => import("@/features/landing/pages/AboutPage"));
const TeamPage = lazy(() => import("@/features/landing/pages/TeamPage"));
const UpdatesPage = lazy(() => import("@/features/landing/pages/UpdatesPage"));
const ContactPage = lazy(() => import("@/features/landing/pages/ContactPage"));
const PaymentResultPage = lazy(() => import("@/features/landing/pages/PaymentResultPage"));
const RegisterPage = lazy(() => import("@/features/registration/pages/RegisterPage"));
const CatalogoPublicoPage = lazy(() => import("@/features/catalog-express/pages/CatalogoPublicoPage"));
const CatalogExpressManagePage = lazy(() => import("@/features/catalog-express/pages/CatalogExpressManagePage"));

const ProductsPage = lazy(() => import("@/features/products/pages/ProductsPage"));
const CostosInicialesPage = lazy(() => import("@/features/costos/pages/CostosInicialesPage"));
const MargenPage = lazy(() => import("@/features/costos/pages/MargenPage"));
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
const ReturnsPage = lazy(() => import("@/features/returns/pages/ReturnsPage"));
const InventoryPage = lazy(() => import("@/features/inventory/pages/InventoryPage"));
const EmployeesPage = lazy(() => import("@/features/employees/pages/EmployeesPage"));
const WarehouseNotesPage = lazy(() => import("@/features/warehouse-notes/pages/WarehouseNotesPage"));
const GuidesPage = lazy(() => import("@/features/despatch-guides/pages/GuidesPage"));
const DeveloperPage = lazy(() => import("@/features/developer/pages/DeveloperPage"));
const ExpressLayout = lazy(() => import("@/features/express/components/ExpressLayout").then((m) => ({ default: m.ExpressLayout })));
const ExpressDashboardPage = lazy(() => import("@/features/express/pages/ExpressDashboardPage"));
const ExpressPOSPage = lazy(() => import("@/features/express/pages/ExpressPOSPage"));
const ExpressInventoryPage = lazy(() => import("@/features/express/pages/ExpressInventoryPage"));
const ExpressUsersPage = lazy(() => import("@/features/express/pages/ExpressUsersPage"));
const ExpressSettingsPage = lazy(() => import("@/features/express/pages/ExpressSettingsPage"));
const ExpressSubscriptionPage = lazy(() => import("@/features/express/pages/ExpressSubscriptionPage"));
const ExpressSalesHistoryPage = lazy(() => import("@/features/express/pages/ExpressSalesHistoryPage"));
const AccountingPage = lazy(() => import("@/features/accounting/pages/AccountingPage"));
const SystemLogsPage = lazy(() => import("@/features/system-logs/pages/SystemLogsPage"));
const ComprobantesPage = lazy(() => import("@/features/comprobantes/pages/ComprobantesPage"));
const IntegracionesPage = lazy(() => import("@/features/integraciones/pages/IntegracionesPage"));
const StatusPage = lazy(() => import("@/features/status/pages/StatusPage"));
const PurchaseOrdersPage = lazy(() => import("@/features/purchases/pages/PurchaseOrdersPage"));
const PurchaseInvoicesPage = lazy(() => import("@/features/purchases/pages/PurchaseInvoicesPage"));
const AccountsPayablePage = lazy(() => import("@/features/purchases/pages/AccountsPayablePage"));
const AdvancesPage = lazy(() => import("@/features/purchases/pages/AdvancesPage"));
const InventoryMovementsPage = lazy(() => import("@/features/inventory-movements/pages/InventoryMovementsPage"));

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

  // Mientras se verifica el token no mostramos una pantalla de "Sincronizando
  // sesión" (se sentía lenta y bloqueaba el render). La verificación es un
  // round-trip breve; renderizamos vacío para no parpadear al login antes de
  // saber si hay sesión.
  if (loading) {
    return null;
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
      } catch {
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
              <Route path="/catalogo/:idTenant" element={<CatalogoPublicoPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/success" element={<PaymentResultPage />} />
              <Route path="/failure" element={<PaymentResultPage />} />
              <Route path="/pending" element={<PaymentResultPage />} />
              {/* Pocket POS (Express) tiene su propio sistema de auth, independiente del ERP */}
              <Route path="/express-pos">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route element={<ExpressLayout />}>
                  <Route path="dashboard" element={<ExpressDashboardPage />} />
                  <Route path="pos" element={<ExpressPOSPage />} />
                  <Route path="inventory" element={<ExpressInventoryPage />} />
                  <Route path="users" element={<ExpressUsersPage />} />
                  <Route path="settings" element={<ExpressSettingsPage />} />
                  <Route path="subscription" element={<ExpressSubscriptionPage />} />
                  <Route path="history" element={<ExpressSalesHistoryPage />} />
                </Route>
              </Route>

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
                    path="/catalog-express"
                    element={<CatalogExpressManagePage />}
                  />
                  <Route
                    path="/products/costos"
                    element={<RequireCapability capability="productos.view"><CostosInicialesPage /></RequireCapability>}
                  />
                  <Route
                    path="/reports/margen"
                    element={<RequireCapability capability="productos.view"><MargenPage /></RequireCapability>}
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
                    path="/sales/returns"
                    element={<RequireCapability capability="devoluciones.view"><ReturnsPage /></RequireCapability>}
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
                    path="/inventory/movements"
                    element={<RequireCapability capability="almacen.view"><InventoryMovementsPage /></RequireCapability>}
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
                    path="/purchases/orders"
                    element={<RequireCapability capability="compras/ordenes.view"><PurchaseOrdersPage /></RequireCapability>}
                  />
                  <Route
                    path="/purchases/invoices"
                    element={<RequireCapability capability="compras/facturas.view"><PurchaseInvoicesPage /></RequireCapability>}
                  />
                  <Route
                    path="/purchases/accounts-payable"
                    element={<RequireCapability capability="compras/cuentas-por-pagar.view"><AccountsPayablePage /></RequireCapability>}
                  />
                  <Route
                    path="/purchases/advances"
                    element={<RequireCapability capability="compras/anticipos.view"><AdvancesPage /></RequireCapability>}
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
                  {/* Diagnóstico de integraciones: gate por rol admin, igual que
                      /api/integraciones en el backend y que los Logs del Sistema. */}
                  <Route
                    path="/settings/integrations"
                    element={<RequireCapability adminOnly><IntegracionesPage /></RequireCapability>}
                  />
                  <Route
                    path="/settings/logs"
                    element={<RequireCapability adminOnly><SystemLogsPage /></RequireCapability>}
                  />
                  <Route
                    path="/reports/sales"
                    element={<RequireCapability capability="reportes.view"><ReportsPage /></RequireCapability>}
                  />
                  <Route
                    path="/sales/comprobantes"
                    element={<RequireCapability capability="comprobantes.view"><ComprobantesPage /></RequireCapability>}
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
            <Toaster />
            <AuthzToastBridge />
          </TooltipProvider>
        </NuqsAdapter>
      </Router>
    </QueryClientProvider>
  );
}
