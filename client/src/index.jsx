import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes';

const Dashboard = lazy(() => import('@/layouts/Dashboard/Dashboard'));
const Login = lazy(() => import('@/layouts/Login/Login'));

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route 
        path="/*" 
        element={<Dashboard />} 
      />
    </Route>
  </Routes>
);

export default AppRoutes;