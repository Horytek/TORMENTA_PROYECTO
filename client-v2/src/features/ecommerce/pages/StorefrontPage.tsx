import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStore } from "../api/ecommerce";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StoreHeader } from "../components/vitrina/StoreHeader";
import { StoreFooter } from "../components/vitrina/StoreFooter";
import { FeaturedStage } from "../components/vitrina/FeaturedStage";
import { CategoryOrbit } from "../components/vitrina/CategoryOrbit";
import { TrustStrip } from "../components/vitrina/TrustStrip";
import { StoryTiles } from "../components/vitrina/StoryTiles";
import { ProductRail } from "../components/vitrina/ProductRail";
import { CatalogArena } from "../components/vitrina/CatalogArena";
import { useStorefrontCatalog } from "../components/vitrina/hooks/useStorefrontCatalog";
import { getCategoria, tiendaTheme, type StoreProducto, type StoreTienda } from "../types/storefront";

export default function StorefrontPage() {
  const { slug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["store", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });
  const setSlug = useEcommerceCartStore((s) => s.setSlug);
  const add = useEcommerceCartStore((s) => s.add);
  const count = useEcommerceCartStore((s) => s.count());

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const tienda = data?.data?.tienda as StoreTienda | undefined;
  const productos = (data?.data?.productos || []) as StoreProducto[];
  const catalog = useStorefrontCatalog(productos);
  const theme = tienda ? tiendaTheme(tienda) : null;

  const railNovedades = useMemo(
    () => [...productos].sort((a, b) => b.id_producto - a.id_producto).slice(0, 10),
    [productos]
  );

  const primeraCat = catalog.categorias[0]?.nombre;
  const railCategoria = useMemo(() => {
    if (!primeraCat) return productos.filter((p) => p.stock > 0).slice(0, 10);
    return productos.filter((p) => getCategoria(p) === primeraCat).slice(0, 10);
  }, [productos, primeraCat]);

  const onAdd = (p: StoreProducto) => {
    add({
      id_producto: p.id_producto,
      nombre: p.nombre,
      precio: Number(p.precio),
      imagen_url: p.imagen_url,
    });
    toast.success(`${p.nombre} agregado al carrito`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-white/50 font-[DM_Sans,sans-serif]">
        Cargando vitrina…
      </div>
    );
  }

  if (error || !data?.success || !tienda || !theme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8eef5] text-slate-600">
        Tienda no encontrada.
      </div>
    );
  }

  return (
    <StoreShell tienda={tienda}>
      <StoreHeader
        tienda={tienda}
        slug={slug}
        cartCount={count}
        categorias={catalog.categorias}
        search={catalog.busqueda}
        onSearchChange={(v) => {
          catalog.setBusqueda(v);
          if (v.trim()) document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
        }}
        onCategoria={catalog.setCategoria}
        categoriaActiva={catalog.categoria}
      />

      {!data?.data?.mp_ready && (
        <div className="bg-amber-50 text-amber-900 text-sm text-center px-4 py-2 border-b border-amber-200">
          Esta tienda aún no tiene Mercado Pago configurado. Puedes explorar el catálogo.
        </div>
      )}

      {theme.sections.stage && (
        <FeaturedStage tienda={tienda} slug={slug} productos={catalog.destacados} />
      )}
      {theme.sections.categories && (
        <CategoryOrbit
          categorias={catalog.categorias}
          activa={catalog.categoria}
          onSelect={catalog.setCategoria}
        />
      )}
      {theme.sections.trust && <TrustStrip tienda={tienda} />}
      {theme.sections.stories && <StoryTiles slug={slug} productos={catalog.storyProductos} />}
      {theme.sections.rails && (
        <>
          <ProductRail
            title="Recién llegados"
            eyebrow="Novedades"
            productos={railNovedades}
            slug={slug}
            onAdd={onAdd}
          />
          <ProductRail
            title={primeraCat ? primeraCat : "En stock ahora"}
            eyebrow="Selección"
            productos={railCategoria}
            slug={slug}
            onAdd={onAdd}
          />
        </>
      )}
      <CatalogArena
        slug={slug}
        totalCatalogo={productos.length}
        filtrados={catalog.filtrados}
        categorias={catalog.categorias}
        busqueda={catalog.busqueda}
        onBusqueda={catalog.setBusqueda}
        categoria={catalog.categoria}
        onCategoria={catalog.setCategoria}
        orden={catalog.orden}
        onOrden={catalog.setOrden}
        dense={catalog.dense}
        onDense={catalog.setDense}
        onAdd={onAdd}
      />
      <StoreFooter tienda={tienda} slug={slug} />
    </StoreShell>
  );
}
