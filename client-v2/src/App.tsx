import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserStore } from "@/store/useUserStore";
import { verifyTokenRequest } from "@/api/auth";
import { setAuthReady } from "@/api/axios";
import { getToken } from "@/utils/authStorage";
import { guardarSesion, leerSesion, olvidarSesion, tokenVigente, esFalloDeRed } from "@/lib/sesionOffline";

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
const TiendaAdminLayout = lazy(() =>
  import("@/features/catalog-express/components/TiendaAdminLayout").then((m) => ({
    default: m.default,
  }))
);
const TiendaAdminIndexRedirect = lazy(() =>
  import("@/features/catalog-express/components/TiendaAdminLayout").then((m) => ({
    default: m.TiendaAdminIndexRedirect,
  }))
);
const TiendaAdminPedidosPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminPedidosPage")
);
const TiendaAdminOrdenesPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminOrdenesPage")
);
const TiendaAdminRecojoPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminRecojoPage")
);
const TiendaAdminResenasPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminResenasPage")
);
const TiendaAdminConfigPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminConfigPage")
);
const TiendaAdminCuponesPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminCuponesPage")
);
const TiendaAdminEntregaPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminEntregaPage")
);
const TiendaAdminSucursalesPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminSucursalesPage")
);
const TiendaAdminBannersPage = lazy(
  () => import("@/features/catalog-express/pages/TiendaAdminBannersPage")
);
const LegacyCatalogTenantRedirect = lazy(() =>
  import("@/features/erp-store/pages/LegacyCatalogRedirects").then((m) => ({
    default: m.RedirectCatalogTenantToErpStore,
  }))
);
const LegacyCatalogSlugRedirect = lazy(() =>
  import("@/features/erp-store/pages/LegacyCatalogRedirects").then((m) => ({
    default: m.RedirectCatalogSlugToErpStore,
  }))
);
const ErpStorefrontPage = lazy(() => import("@/features/erp-store/pages/StorefrontPage"));
const ErpStoreProductPage = lazy(() => import("@/features/erp-store/pages/StoreProductPage"));
const ErpStoreCartPage = lazy(() => import("@/features/erp-store/pages/StoreCartPage"));
const ErpStorePaymentResultPage = lazy(() => import("@/features/erp-store/pages/StorePaymentResultPage"));
const ErpStoreLoginPage = lazy(() => import("@/features/erp-store/pages/StoreLoginPage"));
const ErpStoreRegisterPage = lazy(() => import("@/features/erp-store/pages/StoreRegisterPage"));
const ErpStoreAccountLayout = lazy(() => import("@/features/erp-store/pages/StoreAccountLayout"));
const ErpStoreAccountHomePage = lazy(() =>
  import("@/features/erp-store/pages/StoreAccountLayout").then((m) => ({
    default: m.StoreAccountHomePage,
  }))
);
const ErpStoreOrdersPage = lazy(() => import("@/features/erp-store/pages/StoreOrdersPage"));
const ErpStoreSolicitudesPage = lazy(() => import("@/features/erp-store/pages/StoreSolicitudesPage"));
const ErpStoreOrderDetailPage = lazy(() => import("@/features/erp-store/pages/StoreOrderDetailPage"));
const ErpStoreOrderQrPage = lazy(() => import("@/features/erp-store/pages/StoreOrderQrPage"));
const ErpStoreFavoritesPage = lazy(() => import("@/features/erp-store/pages/StoreFavoritesPage"));
const ErpStoreProfilePage = lazy(() => import("@/features/erp-store/pages/StoreProfilePage"));
const ErpStoreOpinionesPage = lazy(() => import("@/features/erp-store/pages/StoreOpinionesPage"));
const ErpStoreMisReviewsPage = lazy(() => import("@/features/erp-store/pages/StoreMisReviewsPage"));
const SolucionesPage = lazy(() => import("@/features/landing/pages/SolucionesPage"));
const SolucionProductoPage = lazy(() => import("@/features/landing/pages/SolucionProductoPage"));
const SolucionBundlePage = lazy(() => import("@/features/landing/pages/SolucionBundlePage"));
const SyncStockAdminPage = lazy(() => import("@/features/platform/pages/SyncStockAdminPage"));
const MayoristaAdminPage = lazy(() => import("@/features/platform/pages/MayoristaAdminPage"));
const MayoristaPedidosPage = lazy(
  () => import("@/features/platform/pages/mayorista/MayoristaPedidosPage")
);
const MayoristaPortalesPage = lazy(
  () => import("@/features/platform/pages/mayorista/MayoristaPortalesPage")
);
const MayoristaListasPage = lazy(
  () => import("@/features/platform/pages/mayorista/MayoristaListasPage")
);
const MayoristaCompradoresPage = lazy(
  () => import("@/features/platform/pages/mayorista/MayoristaCompradoresPage")
);
const MayoristaPortalPage = lazy(() => import("@/features/platform/pages/MayoristaPortalPage"));
const TallerAdminPage = lazy(() => import("@/features/platform/pages/TallerAdminPage"));
const TallerPlantaPage = lazy(() => import("@/features/platform/pages/TallerPlantaPage"));
const PreventaAdminPage = lazy(() => import("@/features/platform/pages/PreventaAdminPage"));
const PreventaPublicPage = lazy(() => import("@/features/platform/pages/PreventaPublicPage"));
const CrmAdminPage = lazy(() => import("@/features/platform/pages/CrmAdminPage"));
const EnviosAdminPage = lazy(() => import("@/features/platform/pages/EnviosAdminPage"));
const TrackingPublicPage = lazy(() => import("@/features/platform/pages/TrackingPublicPage"));
const WmsAdminPage = lazy(() => import("@/features/platform/pages/WmsAdminPage"));
const WmsOperarioPage = lazy(() => import("@/features/platform/pages/WmsOperarioPage"));
const DespachoAdminPage = lazy(() => import("@/features/platform/pages/DespachoAdminPage"));
const DespachoChoferPage = lazy(() => import("@/features/platform/pages/DespachoChoferPage"));
const TaxiAdminPage = lazy(() => import("@/features/platform/pages/TaxiAdminPage"));
const TaxiConductoresPage = lazy(
  () => import("@/features/platform/pages/taxi/TaxiConductoresPage")
);
const TaxiPasajerosPage = lazy(
  () => import("@/features/platform/pages/taxi/TaxiPasajerosPage")
);
const TaxiEquipoPage = lazy(() => import("@/features/platform/pages/taxi/TaxiEquipoPage"));
const TaxiOperadorPage = lazy(() => import("@/features/platform/pages/taxi/TaxiOperadorPage"));
const TaxiPasajeroPage = lazy(() => import("@/features/platform/pages/TaxiPasajeroPage"));
const TaxiConductorPage = lazy(() => import("@/features/platform/pages/TaxiConductorPage"));
const DeliveryAdminPage = lazy(() => import("@/features/platform/pages/DeliveryAdminPage"));
const DeliveryRepartidoresPage = lazy(
  () => import("@/features/platform/pages/delivery/DeliveryRepartidoresPage")
);
const DeliveryClientesPage = lazy(
  () => import("@/features/platform/pages/delivery/DeliveryClientesPage")
);
const DeliveryEquipoPage = lazy(
  () => import("@/features/platform/pages/delivery/DeliveryEquipoPage")
);
const DeliveryOperadorPage = lazy(
  () => import("@/features/platform/pages/delivery/DeliveryOperadorPage")
);
const DeliveryClientePage = lazy(() => import("@/features/platform/pages/DeliveryClientePage"));
const DeliveryRepartidorPage = lazy(() => import("@/features/platform/pages/DeliveryRepartidorPage"));
const AtelierHomePage = lazy(() => import("@/features/platform/pages/AtelierHomePage"));
const AtelierCreatorPublicPage = lazy(() => import("@/features/platform/pages/AtelierCreatorPublicPage"));
const AtelierClientePages = lazy(() => import("@/features/platform/pages/atelier/AtelierClientePages"));
const AtelierCreadorPages = lazy(() => import("@/features/platform/pages/atelier/AtelierCreadorPages"));
const AtelierAdminPages = lazy(() => import("@/features/platform/pages/atelier/AtelierAdminPages"));
const FlotasAdminPage = lazy(() => import("@/features/platform/pages/FlotasAdminPage"));
const CampoAdminPage = lazy(() => import("@/features/platform/pages/CampoAdminPage"));
const CampoVendedorPage = lazy(() => import("@/features/platform/pages/CampoVendedorPage"));
const AcademiaAdminPage = lazy(() => import("@/features/platform/pages/AcademiaAdminPage"));
const AcademiaAlumnoPage = lazy(() => import("@/features/platform/pages/AcademiaAlumnoPage"));
const AgendaAdminPage = lazy(() => import("@/features/platform/pages/AgendaAdminPage"));
const AgendaPublicPage = lazy(() => import("@/features/platform/pages/AgendaPublicPage"));
const MantenimientoAdminPage = lazy(() => import("@/features/platform/pages/MantenimientoAdminPage"));
const ManttoTecnicoPage = lazy(() => import("@/features/platform/pages/ManttoTecnicoPage"));
const ReclutaAdminPage = lazy(() => import("@/features/platform/pages/ReclutaAdminPage"));
const ReclutaPortalPage = lazy(() => import("@/features/platform/pages/ReclutaPortalPage"));

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
const RegisterEcommercePage = lazy(() => import("@/features/ecommerce/pages/RegisterEcommercePage"));
const RegisterPlatformPage = lazy(
  () => import("@/features/registration/pages/RegisterPlatformPage")
);
const EcommerceAdminLayout = lazy(() =>
  import("@/features/ecommerce/components/EcommerceAdminLayout").then((m) => ({
    default: m.EcommerceAdminLayout,
  }))
);
const EcommerceDashboardPage = lazy(() => import("@/features/ecommerce/pages/EcommerceDashboardPage"));
const EcommerceProductsPage = lazy(() => import("@/features/ecommerce/pages/EcommerceProductsPage"));
const EcommerceAtributosPage = lazy(() => import("@/features/ecommerce/pages/EcommerceAtributosPage"));
const EcommerceTaxonomiaPage = lazy(() => import("@/features/ecommerce/pages/EcommerceTaxonomiaPage"));
const EcommerceOrdersPage = lazy(() => import("@/features/ecommerce/pages/EcommerceOrdersPage"));
const EcommerceSolicitudesStockPage = lazy(
  () => import("@/features/ecommerce/pages/EcommerceSolicitudesStockPage")
);
const EcommerceSettingsPage = lazy(() => import("@/features/ecommerce/pages/EcommerceSettingsPage"));
const EcommerceSucursalesPage = lazy(() => import("@/features/ecommerce/pages/EcommerceSucursalesPage"));
const EcommerceEntregasPage = lazy(() => import("@/features/ecommerce/pages/EcommerceEntregasPage"));
const EcommerceInventarioPage = lazy(() => import("@/features/ecommerce/pages/EcommerceInventarioPage"));
const EcommerceTransferenciasPage = lazy(() => import("@/features/ecommerce/pages/EcommerceTransferenciasPage"));
const StorefrontPage = lazy(() => import("@/features/ecommerce/pages/StorefrontPage"));
const StoreProductPage = lazy(() => import("@/features/ecommerce/pages/StoreProductPage"));
const StoreCartPage = lazy(() => import("@/features/ecommerce/pages/StoreCartPage"));
const StorePaymentResultPage = lazy(() => import("@/features/ecommerce/pages/StorePaymentResultPage"));
const StoreLoginPage = lazy(() => import("@/features/ecommerce/pages/StoreLoginPage"));
const StoreRegisterPage = lazy(() => import("@/features/ecommerce/pages/StoreRegisterPage"));
const StoreAccountLayout = lazy(() => import("@/features/ecommerce/pages/StoreAccountLayout"));
const StoreAccountHomePage = lazy(() =>
  import("@/features/ecommerce/pages/StoreAccountLayout").then((m) => ({
    default: m.StoreAccountHomePage,
  }))
);
const StoreOrdersPage = lazy(() => import("@/features/ecommerce/pages/StoreOrdersPage"));
const StoreSolicitudesPage = lazy(() => import("@/features/ecommerce/pages/StoreSolicitudesPage"));
const StoreOrderDetailPage = lazy(() => import("@/features/ecommerce/pages/StoreOrderDetailPage"));
const StoreOrderQrPage = lazy(() => import("@/features/ecommerce/pages/StoreOrderQrPage"));
const StoreFavoritesPage = lazy(() => import("@/features/ecommerce/pages/StoreFavoritesPage"));
const StoreProfilePage = lazy(() => import("@/features/ecommerce/pages/StoreProfilePage"));
const StoreOpinionesPage = lazy(() => import("@/features/ecommerce/pages/StoreOpinionesPage"));
const StoreMisReviewsPage = lazy(() => import("@/features/ecommerce/pages/StoreMisReviewsPage"));
const EcommercePedidosRetiroPage = lazy(() => import("@/features/ecommerce/pages/EcommercePedidosRetiroPage"));
const EcommerceValidarRetiroPage = lazy(() => import("@/features/ecommerce/pages/EcommerceValidarRetiroPage"));
const EcommerceReviewsPage = lazy(() => import("@/features/ecommerce/pages/EcommerceReviewsPage"));
const EcommerceStockPage = lazy(() => import("@/features/ecommerce/pages/EcommerceStockPage"));
const EcommerceUsuariosPage = lazy(() => import("@/features/ecommerce/pages/EcommerceUsuariosPage"));
const EcommerceRolesPage = lazy(() => import("@/features/ecommerce/pages/EcommerceRolesPage"));

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
          // Foto de la sesión buena, para poder abrir la caja sin señal.
          guardarSesion(resData, [...useUserStore.getState().capabilities]);
        } else {
          olvidarSesion();
          clearUser();
        }
      } catch (error) {
        // Un 401 es el servidor diciendo que no; un fallo de red es no haber
        // llegado a preguntar. Confundirlos deja al POS fuera justo cuando más
        // se lo necesita, que es sin internet.
        const sesion = esFalloDeRed(error) ? leerSesion() : null;
        if (sesion && tokenVigente(await getToken())) {
          setUserRaw(sesion.usuario);
          useUserStore.getState().setCapabilities(sesion.capabilities);
        } else {
          olvidarSesion();
          clearUser();
        }
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
              <Route path="/soluciones" element={<SolucionesPage />} />
              <Route path="/soluciones/bundle/:id" element={<SolucionBundlePage />} />
              <Route path="/soluciones/:slug" element={<SolucionProductoPage />} />
              <Route path="/b2b/:slug" element={<MayoristaPortalPage />} />
              <Route path="/preventa/:slug" element={<PreventaPublicPage />} />
              <Route path="/tracking/:codigo" element={<TrackingPublicPage />} />
              <Route path="/recluta/:slug" element={<ReclutaPortalPage />} />
              <Route path="/taxi/:slug" element={<TaxiPasajeroPage />} />
              <Route path="/taxi/:slug/conductor" element={<TaxiConductorPage />} />
              <Route path="/delivery/:slug" element={<DeliveryClientePage />} />
              <Route path="/delivery/:slug/repartidor" element={<DeliveryRepartidorPage />} />
              <Route path="/atelier" element={<AtelierHomePage />} />
              <Route path="/atelier/c/:slug" element={<AtelierCreatorPublicPage />} />
              <Route path="/atelier/cliente" element={<AtelierClientePages />} />
              <Route path="/atelier/cliente/solicitudes" element={<AtelierClientePages />} />
              <Route path="/atelier/cliente/pedidos" element={<AtelierClientePages />} />
              <Route path="/atelier/cliente/pedidos/:id" element={<AtelierClientePages />} />
              <Route path="/atelier/cliente/favoritos" element={<AtelierClientePages />} />
              <Route path="/atelier/creador" element={<AtelierCreadorPages />} />
              <Route path="/atelier/creador/solicitudes" element={<AtelierCreadorPages />} />
              <Route path="/atelier/creador/pedidos" element={<AtelierCreadorPages />} />
              <Route path="/atelier/creador/pedidos/:id" element={<AtelierCreadorPages />} />
              <Route path="/atelier/creador/servicios" element={<AtelierCreadorPages />} />
              <Route path="/atelier/creador/portafolio" element={<AtelierCreadorPages />} />
              <Route path="/atelier/creador/ganancias" element={<AtelierCreadorPages />} />
              <Route path="/atelier-admin" element={<AtelierAdminPages />} />
              <Route path="/atelier-admin/pedidos" element={<AtelierAdminPages />} />
              <Route path="/atelier-admin/usuarios" element={<AtelierAdminPages />} />
              <Route path="/atelier-admin/comision" element={<AtelierAdminPages />} />
              <Route path="/academia/:slug" element={<AcademiaAlumnoPage />} />
              <Route path="/agenda/:slug" element={<AgendaPublicPage />} />
              <Route path="/campo/vendedor" element={<CampoVendedorPage />} />
              <Route path="/taller/planta" element={<TallerPlantaPage />} />
              <Route path="/wms/operario" element={<WmsOperarioPage />} />
              <Route path="/despacho/chofer" element={<DespachoChoferPage />} />
              <Route path="/mantenimiento/tecnico" element={<ManttoTecnicoPage />} />
              <Route path="/sobre-nosotros" element={<AboutPage />} />
              <Route path="/equipo" element={<TeamPage />} />
              <Route path="/actualizaciones" element={<UpdatesPage />} />
              <Route path="/contactanos" element={<ContactPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/registro-ecommerce" element={<RegisterEcommercePage />} />
              <Route path="/registro-plataforma" element={<RegisterPlatformPage />} />
              <Route path="/tienda/:slug" element={<StorefrontPage />} />
              <Route path="/tienda/:slug/producto/:id" element={<StoreProductPage />} />
              <Route path="/tienda/:slug/opiniones" element={<StoreOpinionesPage />} />
              <Route path="/tienda/:slug/carrito" element={<StoreCartPage />} />
              <Route path="/tienda/:slug/login" element={<StoreLoginPage />} />
              <Route path="/tienda/:slug/registro" element={<StoreRegisterPage />} />
              <Route path="/tienda/:slug/cuenta/pedidos/:id/qr" element={<StoreOrderQrPage />} />
              <Route path="/tienda/:slug/cuenta" element={<StoreAccountLayout />}>
                <Route index element={<StoreAccountHomePage />} />
                <Route path="pedidos" element={<StoreOrdersPage />} />
                <Route path="solicitudes" element={<StoreSolicitudesPage />} />
                <Route path="pedidos/:id" element={<StoreOrderDetailPage />} />
                <Route path="favoritos" element={<StoreFavoritesPage />} />
                <Route path="opiniones" element={<StoreMisReviewsPage />} />
                <Route path="perfil" element={<StoreProfilePage />} />
              </Route>
              <Route path="/tienda/:slug/pago/resultado" element={<StorePaymentResultPage />} />
              {/* Ecommerce ERP (reemplaza Catálogo WhatsApp) */}
              <Route path="/s/:slug" element={<ErpStorefrontPage />} />
              <Route path="/s/:slug/producto/:id" element={<ErpStoreProductPage />} />
              <Route path="/s/:slug/opiniones" element={<ErpStoreOpinionesPage />} />
              <Route path="/s/:slug/carrito" element={<ErpStoreCartPage />} />
              <Route path="/s/:slug/login" element={<ErpStoreLoginPage />} />
              <Route path="/s/:slug/registro" element={<ErpStoreRegisterPage />} />
              <Route path="/s/:slug/cuenta/pedidos/:id/qr" element={<ErpStoreOrderQrPage />} />
              <Route path="/s/:slug/cuenta" element={<ErpStoreAccountLayout />}>
                <Route index element={<ErpStoreAccountHomePage />} />
                <Route path="pedidos" element={<ErpStoreOrdersPage />} />
                <Route path="solicitudes" element={<ErpStoreSolicitudesPage />} />
                <Route path="pedidos/:id" element={<ErpStoreOrderDetailPage />} />
                <Route path="favoritos" element={<ErpStoreFavoritesPage />} />
                <Route path="opiniones" element={<ErpStoreMisReviewsPage />} />
                <Route path="perfil" element={<ErpStoreProfilePage />} />
              </Route>
              <Route path="/s/:slug/pago/resultado" element={<ErpStorePaymentResultPage />} />
              {/* Legacy Catálogo WA → Tienda web ERP */}
              <Route path="/catalogo/:idTenant" element={<LegacyCatalogTenantRedirect />} />
              <Route path="/c/:slug/*" element={<LegacyCatalogSlugRedirect />} />
              <Route path="/c/:slug" element={<LegacyCatalogSlugRedirect />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/success" element={<PaymentResultPage />} />
              <Route path="/failure" element={<PaymentResultPage />} />
              <Route path="/pending" element={<PaymentResultPage />} />
              {/* Ecommerce admin — auth propia (JWT audience horytek-ecommerce) */}
              <Route path="/ecommerce-admin" element={<EcommerceAdminLayout />}>
                <Route index element={<EcommerceDashboardPage />} />
                <Route path="productos" element={<EcommerceProductsPage />} />
                <Route path="atributos" element={<EcommerceAtributosPage />} />
                <Route path="catalogo" element={<EcommerceTaxonomiaPage />} />
                <Route path="sucursales" element={<EcommerceSucursalesPage />} />
                <Route path="entregas" element={<EcommerceEntregasPage />} />
                <Route path="inventario" element={<EcommerceInventarioPage />} />
                <Route path="stock" element={<EcommerceStockPage />} />
                <Route path="transferencias" element={<EcommerceTransferenciasPage />} />
                <Route path="ordenes" element={<EcommerceOrdersPage />} />
                <Route path="solicitudes-stock" element={<EcommerceSolicitudesStockPage />} />
                <Route path="pedidos-retiro" element={<EcommercePedidosRetiroPage />} />
                <Route path="validar-retiro" element={<EcommerceValidarRetiroPage />} />
                <Route path="recojo" element={<EcommerceValidarRetiroPage />} />
                <Route path="resenas" element={<EcommerceReviewsPage />} />
                <Route path="usuarios" element={<EcommerceUsuariosPage />} />
                <Route path="roles" element={<EcommerceRolesPage />} />
                <Route path="configuracion" element={<EcommerceSettingsPage />} />
              </Route>
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

              {/* Admins de producto con JWT propio (no requieren sesión ERP) */}
              <Route path="/taxi-admin" element={<TaxiAdminPage />} />
              <Route path="/taxi-admin/conductores" element={<TaxiConductoresPage />} />
              <Route path="/taxi-admin/pasajeros" element={<TaxiPasajerosPage />} />
              <Route path="/taxi-admin/equipo" element={<TaxiEquipoPage />} />
              <Route path="/taxi-admin/operador" element={<TaxiOperadorPage />} />
              <Route path="/delivery-admin" element={<DeliveryAdminPage />} />
              <Route path="/delivery-admin/repartidores" element={<DeliveryRepartidoresPage />} />
              <Route path="/delivery-admin/clientes" element={<DeliveryClientesPage />} />
              <Route path="/delivery-admin/equipo" element={<DeliveryEquipoPage />} />
              <Route path="/delivery-admin/operador" element={<DeliveryOperadorPage />} />
              <Route path="/flotas-admin" element={<FlotasAdminPage />} />
              <Route path="/academia-admin" element={<AcademiaAdminPage />} />
              <Route path="/agenda-admin" element={<AgendaAdminPage />} />

              <Route path="/sobre-nosotros" element={<LandingSubPage pageId="sobre-nosotros" />} />
              <Route path="/equipo" element={<LandingSubPage pageId="equipo" />} />
              <Route path="/actualizaciones" element={<LandingSubPage pageId="actualizaciones" />} />
              <Route path="/terminos" element={<LandingSubPage pageId="terminos" />} />
              <Route path="/privacidad" element={<LandingSubPage pageId="privacidad" />} />
              <Route path="/contactanos" element={<LandingSubPage pageId="contactanos" />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                {/* Consolas de producto Horytek — fuera del DashboardLayout ERP */}
                <Route path="/mayorista-admin" element={<MayoristaPedidosPage />} />
                <Route path="/mayorista-admin/portales" element={<MayoristaPortalesPage />} />
                <Route path="/mayorista-admin/listas" element={<MayoristaListasPage />} />
                <Route
                  path="/mayorista-admin/compradores"
                  element={<MayoristaCompradoresPage />}
                />
                <Route path="/platform/sync" element={<SyncStockAdminPage />} />
                <Route path="/platform/mayorista" element={<MayoristaAdminPage />} />
                <Route path="/platform/taller" element={<TallerAdminPage />} />
                <Route path="/platform/preventa" element={<PreventaAdminPage />} />
                <Route path="/platform/crm" element={<CrmAdminPage />} />
                <Route path="/platform/envios" element={<EnviosAdminPage />} />
                <Route path="/platform/wms" element={<WmsAdminPage />} />
                <Route path="/platform/despacho" element={<DespachoAdminPage />} />
                <Route path="/platform/campo" element={<CampoAdminPage />} />
                <Route path="/platform/mantenimiento" element={<MantenimientoAdminPage />} />
                <Route path="/platform/recluta" element={<ReclutaAdminPage />} />

                {/* Main Dashboard Layout */}
                <Route element={<DashboardLayout />}>
                  {/* "Inicio" no requiere capability — visible para cualquier usuario autenticado. */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route
                    path="/catalog-express"
                    element={
                      <RequireCapability capability="catalogo.view">
                        <TiendaAdminLayout />
                      </RequireCapability>
                    }
                  >
                    <Route index element={<TiendaAdminIndexRedirect />} />
                    <Route path="pedidos" element={<TiendaAdminPedidosPage />} />
                    <Route path="recojo" element={<TiendaAdminRecojoPage />} />
                    <Route path="ordenes" element={<TiendaAdminOrdenesPage />} />
                    <Route path="resenas" element={<TiendaAdminResenasPage />} />
                    <Route path="cupones" element={<TiendaAdminCuponesPage />} />
                    <Route path="sucursales" element={<TiendaAdminSucursalesPage />} />
                    <Route path="entrega" element={<TiendaAdminEntregaPage />} />
                    <Route path="banners" element={<TiendaAdminBannersPage />} />
                    <Route path="configuracion" element={<TiendaAdminConfigPage />} />
                  </Route>
                  <Route
                    path="/products"
                    element={<RequireCapability capability="productos.view"><ProductsPage /></RequireCapability>}
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
