import { Routes, Route, Navigate } from 'react-router-dom';
import Productos from './Productos';

function ProductosWrapper() {
  return (
    <Routes>
      {/* Ruta principal de productos con pestañas */}
      <Route index element={<Productos />} />
      <Route path="marcas" element={<Productos />} />
      <Route path="categorias" element={<Productos />} />
      <Route path="subcategorias" element={<Productos />} />
      
      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/productos" replace />} />
    </Routes>
  );
}

export default ProductosWrapper;
