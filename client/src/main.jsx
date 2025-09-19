import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './layouts/Login/Login';
import Dashboard from './layouts/Dashboard/Dashboard';
import { AppSidebar } from './components/Sidebar/AppSidebar';
import { SidebarProvider } from "@/components/ui/Sidebar";
import './main.css';
import { ScrollShadow } from "@heroui/react";
import { AuthProvider } from "@/context/Auth/AuthProvider";
import { ProtectedRoute } from "./routes";
import { HeroUIProvider } from "@heroui/react";
import LandingPage from './pages/landing/LandingPage';
import ServiciosPage from './pages/Landing/ServiciosPage';
import AboutPage from './pages/Landing/aboutPage';
import EquipoPage from './pages/Landing/EquipoPage';
import ActualizacionesPage from './pages/Landing/ActualizacionesPage';
import TerminosCondicionesPage from './pages/Landing/TerminosCondicionesPage';
import PoliticaPrivacidadPage from './pages/Landing/PoliticaPrivacidadPage';
import EmpleoPage from './pages/Landing/EmpleoPage';
import ContactanosPage from './pages/Landing/ContactanosPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <HeroUIProvider>
          <Routes>
            {/* Rutas públicas SIN SidebarProvider */}
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
            
            {/* Rutas del ERP CON SidebarProvider */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/*"
                element={
                  <SidebarProvider>
                    <div className="flex h-screen w-screen overflow-hidden">
                      <AppSidebar />
                      <ScrollShadow hideScrollBar className="flex-1 h-full">
                        <Dashboard />
                      </ScrollShadow>
                    </div>
                  </SidebarProvider>
                }
              />
            </Route>
          </Routes>
        </HeroUIProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);