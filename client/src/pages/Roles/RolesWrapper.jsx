import { Routes, Route } from 'react-router-dom';
import Roles from './Roles';

function RolesWrapper() {
  return (
    <Routes>
      <Route index element={<Roles />} />
      <Route path="permisos" element={<Roles />} />
      <Route path="paginas" element={<Roles />} />
    </Routes>
  );
}

export default RolesWrapper;
