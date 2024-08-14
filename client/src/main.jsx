import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './main.css';

// Auth Context
import { AuthProvider } from "@/context/Auth/AuthProvider";

// App Routes
import AppRoutes from './index';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);