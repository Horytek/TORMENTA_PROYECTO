import { Navigate, useParams } from "react-router-dom";
import { getProductBySlug } from "@/features/platform/catalog/horytekProducts";

/** Redirect legacy ficha → experience landing. */
export default function SolucionProductoPage() {
  const { slug = "" } = useParams();
  const product = getProductBySlug(slug);
  if (!product) return <Navigate to="/soluciones" replace />;
  return <Navigate to={`/?product=${product.id}`} replace />;
}
