import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStore } from "../api/ecommerce";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { useBranchStore } from "../store/useBranchStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StoreHeader } from "../components/vitrina/StoreHeader";
import { StoreFooter } from "../components/vitrina/StoreFooter";
import { ModuleRenderer } from "../components/vitrina/modules/ModuleRenderer";
import { useStorefrontCatalog } from "../components/vitrina/hooks/useStorefrontCatalog";
import { CartFab } from "../components/vitrina/quick/CartFab";
import { BackToTop } from "../components/vitrina/quick/BackToTop";
import { StoreSkeleton } from "../components/vitrina/detail/ProductSpecs";
import { PickupBranchesBlock } from "../design/PickupBranchesBlock";
import { StoreBottomNav } from "../design/StoreBottomNav";
import { tiendaTheme, type StoreProducto, type StoreSucursal, type StoreTienda } from "../types/storefront";

export default function StorefrontPage() {
  const { slug = "" } = useParams();
  const id_sucursal = useBranchStore((s) => s.id_sucursal);
  const initForStore = useBranchStore((s) => s.initForStore);
  const setBranch = useBranchStore((s) => s.setBranch);
  const sucursales = useBranchStore((s) => s.sucursales);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["store", slug, id_sucursal],
    queryFn: () => getStore(slug, id_sucursal),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
  });

  const setSlug = useEcommerceCartStore((s) => s.setSlug);
  const add = useEcommerceCartStore((s) => s.add);
  const count = useEcommerceCartStore((s) => s.count());

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  useEffect(() => {
    const list = (data?.data?.sucursales || []) as StoreSucursal[];
    if (slug && list.length) initForStore(slug, list);
  }, [data, slug, initForStore]);

  const handleBranchSelect = (id: number) => {
    setBranch(id);
  };

  const tienda = data?.data?.tienda as StoreTienda | undefined;
  const productos = (data?.data?.productos || []) as StoreProducto[];
  const catalog = useStorefrontCatalog(productos);
  const theme = tienda ? tiendaTheme(tienda) : null;
  const quickAdd = theme?.quick_actions?.quick_add !== false;
  const showFab = theme?.quick_actions?.cart_fab !== false;

  const onAdd = (p: StoreProducto) => {
    if (!id_sucursal && sucursales.length) {
      toast.error("Elige una sucursal de recojo primero");
      return;
    }
    add({
      id_producto: p.id_producto,
      nombre: p.nombre,
      precio: Number(p.precio),
      imagen_url: p.imagen_url,
    });
    toast.success(`${p.nombre} agregado al carrito`);
  };

  if (isLoading) return <StoreSkeleton />;

  if (error || !data?.success || !tienda || !theme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e14] text-slate-400">
        Tienda no encontrada.
      </div>
    );
  }

  return (
    <StoreShell tienda={tienda} slug={slug}>
      <StoreHeader
        tienda={tienda}
        slug={slug}
        cartCount={count}
        categorias={catalog.categorias}
        onCategoria={catalog.setCategoria}
        categoriaActiva={catalog.categoria}
        productos={productos}
        sucursales={sucursales}
        activeBranchId={id_sucursal}
        onBranchSelect={handleBranchSelect}
      />

      {!data?.data?.mp_ready && (
        <div className="bg-amber-500/15 text-amber-200 text-sm text-center px-4 py-2 border-b border-amber-500/20">
          Esta tienda aún no tiene Mercado Pago configurado. Puedes explorar el catálogo.
        </div>
      )}

      <ModuleRenderer
        modules={theme.modules}
        theme={theme}
        tienda={tienda}
        slug={slug}
        productos={productos}
        catalog={catalog}
        onAdd={onAdd}
        quickAdd={quickAdd}
      />

      {isFetching && !isLoading && (
        <div className="fixed inset-x-0 top-14 z-30 h-0.5 bg-[var(--vitrina-accent)] animate-pulse" aria-hidden />
      )}

      <PickupBranchesBlock sucursales={sucursales} />

      <StoreFooter tienda={tienda} slug={slug} />
      {showFab && <CartFab slug={slug} count={count} />}
      <BackToTop />
      <StoreBottomNav slug={slug} cartCount={count} />
      <div className="h-14 lg:hidden" aria-hidden />
    </StoreShell>
  );
}
