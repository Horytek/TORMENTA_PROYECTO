import { Navigate } from "react-router-dom";

/** Legacy: el admin Mayorista vive fuera del ERP en /mayorista-admin. */
export default function MayoristaAdminPage() {
  return <Navigate to="/mayorista-admin" replace />;
}
