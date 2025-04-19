import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './layouts/Login/Login';
import Dashboard from './layouts/Dashboard/Dashboard';

import './main.css';  // Tailwind CSS

// Auth Context
import { AuthProvider } from "@/context/Auth/AuthProvider";

// Protected Route
import { ProtectedRoute } from "./routes";

import { NextUIProvider } from '@nextui-org/react';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <NextUIProvider > 
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/*" element={<Dashboard />} />
            </Route>
          </Routes>
        </NextUIProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);
