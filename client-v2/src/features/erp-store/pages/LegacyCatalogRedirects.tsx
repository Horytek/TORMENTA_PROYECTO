import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import api from "@/api/axios";

/** Redirige /c/:slug/* → /s/:slug/* */
export function RedirectCatalogSlugToErpStore() {
  const params = useParams();
  const slug = params.slug || "";
  const location = useLocation();
  // path after /c/:slug
  const prefix = `/c/${slug}`;
  let rest = location.pathname.startsWith(prefix)
    ? location.pathname.slice(prefix.length)
    : params["*"]
      ? `/${params["*"]}`
      : "";
  // /p/:id → /producto/:id
  rest = rest.replace(/^\/p\//, "/producto/");
  // cuenta paths already align
  return <Navigate to={`/s/${slug}${rest || ""}${location.search}`} replace />;
}

/** Redirige /catalogo/:idTenant → /s/:slug */
export function RedirectCatalogTenantToErpStore() {
  const { idTenant = "" } = useParams();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/catalogo/${idTenant}`);
        const s = data?.data?.store?.slug;
        if (!cancelled) setSlug(s ? String(s) : String(idTenant));
      } catch {
        if (!cancelled) setSlug(String(idTenant));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idTenant]);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Redirigiendo a la tienda…
      </div>
    );
  }
  return <Navigate to={`/s/${slug}`} replace />;
}
