import React, { Suspense, lazy, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { NuqsAdapter } from 'nuqs/adapters/react-router';
import "./main.css";
// Import landing styles early to ensure landing-specific rules (backgrounds, landing-body) are available
import "./styles/landing/index.css";
import LoaderProvider, { LoaderOverlay, SuspenseFallbackTrigger } from "./components/common/NavigationLoader";
import { ScrollShadow, HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/context/Auth/AuthProvider";
import { ProtectedRoute } from "./routes";
import { useTheme } from "@heroui/use-theme";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { Toaster } from "react-hot-toast";

const Login = lazy(() => import("./layouts/Login/Login"));
const Dashboard = lazy(() => import("./layouts/Dashboard/Dashboard"));
const LandingPage = lazy(() => import("./pages/Landing/LandingPage"));
const StatusPage = lazy(() => import("./pages/Status/StatusPage"));
const ServiciosPage = lazy(() => import("./pages/Landing/ServiciosPage"));
const AboutPage = lazy(() => import("./pages/Landing/AboutPage"));
const EquipoPage = lazy(() => import("./pages/Landing/EquipoPage"));
const ActualizacionesPage = lazy(() => import("./pages/Landing/ActualizacionesPage"));
const TerminosCondicionesPage = lazy(() => import("./pages/Landing/TerminosCondicionesPage"));
const PoliticaPrivacidadPage = lazy(() => import("./pages/Landing/PoliticaPrivacidadPage"));
const EmpleoPage = lazy(() => import("./pages/Landing/EmpleoPage"));
const ContactanosPage = lazy(() => import("./pages/Landing/ContactanosPage"));
const BlogPage = lazy(() => import("./pages/Landing/BlogPage"));
const RegistroLicenciaPage = lazy(() => import("./pages/Landing/RegistroLicenciaPage"));
const RegistroPage = lazy(() => import("./pages/Landing/RegistroPage"));

const ChatbotClientWidget = lazy(() =>
  import("@/components/Chatbot/DeepSeekChatbot")
);

function ThemeClassSync() {
  const { theme } = useTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}

function ProtectedLayout() {
  const [widgetsReady, setWidgetsReady] = useState(false);

  useEffect(() => {
    if (widgetsReady) return;
    if (typeof window === "undefined") return;

    const enableWidgets = () => setWidgetsReady(true);
    const events = ["pointerdown", "keydown"];

    events.forEach((eventName) => {
      window.addEventListener(eventName, enableWidgets, { once: true, passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, enableWidgets);
      });
    };
  }, [widgetsReady]);

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col bg-transparent text-slate-900 dark:text-zinc-100">
      <Dashboard />
      {widgetsReady && (
        <Suspense fallback={null}>
          <ChatbotClientWidget />
        </Suspense>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <Router>
        <NuqsAdapter>
          <AuthProvider>
            <HeroUIProvider>
              <LoaderProvider>
                <ThemeClassSync />
                <Suspense fallback={<SuspenseFallbackTrigger />}>
                  <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/status" element={<StatusPage />} />
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/landing/servicios" element={<ServiciosPage />} />
                    <Route path="/landing/about" element={<AboutPage />} />
                    <Route path="/landing/team" element={<EquipoPage />} />
                    <Route path="/landing/actualizaciones" element={<ActualizacionesPage />} />
                    <Route path="/landing/terminos-y-condiciones" element={<TerminosCondicionesPage />} />
                    <Route path="/landing/politica-de-privacidad" element={<PoliticaPrivacidadPage />} />
                    <Route path="/landing/empleos" element={<EmpleoPage />} />
                    <Route path="/landing/contactanos" element={<ContactanosPage />} />
                    <Route path="/landing/blog" element={<BlogPage />} />
                    <Route path="/landing/registro-licencia" element={<RegistroLicenciaPage />} />
                    <Route path="/landing/registro" element={<RegistroPage />} />
                    <Route path="/blog" element={<BlogPage />} />
                    <Route path="/blog/article" element={<BlogPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/*" element={<ProtectedLayout />} />
                    </Route>
                  </Routes>
                </Suspense>
                <LoaderOverlay />
                <Toaster position="top-center" reverseOrder={true} containerStyle={{ zIndex: 99999 }} />
              </LoaderProvider>
            </HeroUIProvider>
          </AuthProvider>
        </NuqsAdapter>
      </Router>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
