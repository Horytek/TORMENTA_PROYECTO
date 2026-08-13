import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStoreBySlug } from "../api/catalogoPublico";
import CatalogoPublicoPage from "./CatalogoPublicoPage";

/**
 * Wrapper: carga tienda por slug y reutiliza la vitrina.
 * Si no existe, muestra 404.
 */
export default function CatalogStoreBySlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["store-slug", slug],
    queryFn: () => getStoreBySlug(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    // Inyecta id_tenant en history state para la página legacy
    if (data?.store?.id_tenant) {
      // no-op: CatalogoPublicoPage leerá slug via location
    }
  }, [data]);

  if (isLoading) {
    return <div className="p-12 text-center text-stone-500">Cargando tienda…</div>;
  }
  if (isError || !data) {
    return (
      <div className="p-12 text-center space-y-3">
        <p className="text-stone-600">Tienda no encontrada</p>
        <button type="button" onClick={() => navigate("/")} className="underline text-sm">
          Ir al inicio
        </button>
      </div>
    );
  }

  return <CatalogoPublicoPage slugOverride={slug} storeBootstrap={data} />;
}

/** Redirect legacy /catalogo/:idTenant → intenta slug si hay config; si no, render directo */
export function CatalogLegacyRedirect() {
  return <CatalogoPublicoPage />;
}

export function CatalogHomeLink({ slug }: { slug: string }) {
  return <Link to={`/c/${slug}`}>Tienda</Link>;
}
