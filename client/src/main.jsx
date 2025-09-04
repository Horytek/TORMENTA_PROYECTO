import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './layouts/Login/Login';
import Dashboard from './layouts/Dashboard/Dashboard';
import { AppSidebar } from './components/Sidebar/AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";
import './main.css';
import { ScrollShadow } from "@heroui/react";
import { AuthProvider } from "@/context/Auth/AuthProvider";
import { ProtectedRoute } from "./routes";
import { HeroUIProvider } from "@heroui/react";
import LandingPage from './pages/Landing/LandingPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <HeroUIProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route element={<ProtectedRoute />}>
                <Route
                  path="/*"
                  element={
                    <div className="flex h-screen w-screen overflow-hidden">
                      <AppSidebar />
                      <ScrollShadow hideScrollBar className="flex-1 h-full">
                        <Dashboard />
                      </ScrollShadow>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </SidebarProvider>
        </HeroUIProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);