import React, { Suspense, lazy, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./main.css";
import { ScrollShadow, HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/context/Auth/AuthProvider";
import { ProtectedRoute } from "./routes";
import { useTheme } from "@heroui/use-theme";

const Login = lazy(() => import("./layouts/Login/Login"));
const Dashboard = lazy(() => import("./layouts/Dashboard/Dashboard"));
const Messenger = lazy(() => import("./pages/Messenger/Messenger"));
const LandingPage = lazy(() => import("./pages/Landing/LandingPage"));
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
const AppSidebar = lazy(() =>
  import("./components/Sidebar/AppSidebar").then((module) => ({
    default: module.AppSidebar,
  }))
);
const SidebarProvider = lazy(() =>
  import("@/components/ui/Sidebar").then((module) => ({
    default: module.SidebarProvider,
  }))
);

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

function AppFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-slate-600 dark:bg-slate-950 dark:text-slate-200">
      <span className="text-sm font-medium">Cargando interfaz...</span>
    </div>
  );
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
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <AppSidebar />
        <ScrollShadow hideScrollBar className="flex-1 h-full">
          <Dashboard />
          {widgetsReady && (
            <Suspense fallback={null}>
              <ChatbotClientWidget />
            </Suspense>
          )}
        </ScrollShadow>
      </div>
    </SidebarProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <HeroUIProvider>
          <ThemeClassSync />
          <Suspense fallback={<AppFallback />}>
            <Routes>
              <Route path="/" element={<Login />} />
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
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/article" element={<BlogPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/*" element={<ProtectedLayout />} />
                <Route path="/messenger" element={<Messenger />} />
              </Route>
            </Routes>
          </Suspense>
        </HeroUIProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
