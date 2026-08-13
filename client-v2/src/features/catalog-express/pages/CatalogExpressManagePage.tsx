import { Navigate } from "react-router-dom";

/** @deprecated Reemplazada por el shell /catalog-express/* */
export default function CatalogExpressManagePage() {
  return <Navigate to="/catalog-express/pedidos" replace />;
}
