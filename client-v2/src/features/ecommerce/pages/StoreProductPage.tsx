import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { getStore, getStoreProduct, getProductAvailability } from "../api/ecommerce";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { useBranchStore } from "../store/useBranchStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StoreHeader } from "../components/vitrina/StoreHeader";
import { StoreFooter } from "../components/vitrina/StoreFooter";
import { ProductRail } from "../components/vitrina/ProductRail";
import { useStorefrontCatalog } from "../components/vitrina/hooks/useStorefrontCatalog";
import { ProductSpecs, StockBadge, StoreSkeleton } from "../components/vitrina/detail/ProductSpecs";
import { StickyBuyBar } from "../components/vitrina/quick/StickyBuyBar";
import { CartFab } from "../components/vitrina/quick/CartFab";
import { ProductAvailabilityPanel } from "../design/ProductAvailabilityPanel";
import { WhatsAppAssist } from "../design/WhatsAppAssist";
import {
  formatPen,
  getCategoria,
  type BranchAvailability,
  type StoreImagen,
  type StoreProducto,
  type StoreSucursal,
  type StoreTienda,
} from "../types/storefront";

export default function StoreProductPage() {
  const { slug = "", id = "" } = useParams();
  const productId = Number(id);
  const setSlug = useEcommerceCartStore((s) => s.setSlug);
  const add = useEcommerceCartStore((s) => s.add);
  const items = useEcommerceCartStore((s) => s.items);
  const count = useEcommerceCartStore((s) => s.count());
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const id_sucursal = useBranchStore((s) => s.id_sucursal);
  const setBranch = useBranchStore((s) => s.setBranch);
  const initForStore = useBranchStore((s) => s.initForStore);
  const sucursales = useBranchStore((s) => s.sucursales);
  const activeBranch = useBranchStore((s) => s.activeBranch());

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const storeQ = useQuery({
    queryKey: ["store", slug, id_sucursal],
    queryFn: () => getStore(slug, id_sucursal),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
  });

  const productQ = useQuery({
    queryKey: ["store-product", slug, productId, id_sucursal],
    queryFn: () => getStoreProduct(slug, productId, id_sucursal),
    enabled: Boolean(slug) && Number.isFinite(productId) && productId > 0,
    placeholderData: keepPreviousData,
  });

  const availabilityQ = useQuery({
    queryKey: ["product-availability", slug, productId],
    queryFn: () => getProductAvailability(slug, productId),
    enabled: Boolean(slug) && Number.isFinite(productId) && productId > 0,
  });

  useEffect(() => {
    const list = (storeQ.data?.data?.sucursales || productQ.data?.data?.sucursales || []) as StoreSucursal[];
    if (slug && list.length) initForStore(slug, list);
  }, [storeQ.data, productQ.data, slug, initForStore]);

  const tienda = (productQ.data?.data?.tienda || storeQ.data?.data?.tienda) as StoreTienda | undefined;
  const producto = productQ.data?.data?.producto as StoreProducto | undefined;
  const imagenes = (productQ.data?.data?.imagenes || []) as StoreImagen[];
  const catalogo = (storeQ.data?.data?.productos || []) as StoreProducto[];
  const catalog = useStorefrontCatalog(catalogo);

  const galeria = useMemo(() => {
    if (imagenes.length > 0) return imagenes.map((i) => i.url);
    if (producto?.imagen_url) return [producto.imagen_url];
    return [] as string[];
  }, [imagenes, producto]);

  const relacionados = useMemo(() => {
    if (!producto) return [];
    const cat = getCategoria(producto);
    const otros = catalogo.filter((p) => p.id_producto !== producto.id_producto);
    if (cat) {
      const same = otros.filter((p) => getCategoria(p) === cat);
      if (same.length >= 3) return same.slice(0, 8);
    }
    return otros.slice(0, 8);
  }, [catalogo, producto]);

  const inCart = Boolean(producto && items.some((i) => i.id_producto === producto.id_producto));
  const availability = (availabilityQ.data?.data || []) as BranchAvailability[];

  const onAdd = (p: StoreProducto, cantidad = 1) => {
    if (!id_sucursal && sucursales.length) {
      toast.error("Elige una sucursal de recojo primero");
      return;
    }
    add(
      {
        id_producto: p.id_producto,
        nombre: p.nombre,
        precio: Number(p.precio),
        imagen_url: p.imagen_url || galeria[0],
      },
      cantidad
    );
    toast.success(`${p.nombre} agregado al carrito`);
  };

  if (productQ.isLoading || storeQ.isLoading) return <StoreSkeleton />;

  if (!tienda || !producto || productQ.isError || !productQ.data?.success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0a0e14] text-slate-400">
        <p>Producto no encontrado.</p>
        <Link to={`/tienda/${slug}`} className="text-sm font-semibold underline">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const cat = getCategoria(producto);
  const activeImg = galeria[imgIdx] || galeria[0];

  return (
    <StoreShell tienda={tienda} slug={slug}>
      <StoreHeader
        tienda={tienda}
        slug={slug}
        cartCount={count}
        categorias={catalog.categorias}
        onCategoria={catalog.setCategoria}
        categoriaActiva={catalog.categoria}
        productos={catalogo}
        sucursales={sucursales}
        activeBranchId={id_sucursal}
        onBranchSelect={setBranch}
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12 pb-28 lg:pb-12">
        <Link
          to={`/tienda/${slug}`}
          className="inline-flex items-center gap-2 text-sm store-muted hover:text-[var(--vitrina-accent)] mb-8 min-h-11"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
          <div className="flex gap-3">
            {galeria.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                {galeria.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    className={`store-thumb aspect-square overflow-hidden border ${
                      i === imgIdx ? "border-[var(--vitrina-accent)]" : "store-hairline opacity-70"
                    }`}
                  >
                    <img src={url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 aspect-square bg-[var(--vitrina-fog)] overflow-hidden rounded-[var(--store-radius-lg)]">
              {activeImg ? (
                <img src={activeImg} alt={producto.nombre} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center store-muted">Sin foto</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {cat && <span className="text-[11px] uppercase tracking-wider store-muted">{cat}</span>}
            <h1 className="vitrina-display text-4xl sm:text-5xl">{producto.nombre}</h1>
            <p className="text-2xl font-semibold" style={{ color: "var(--vitrina-accent)" }}>
              {formatPen(Number(producto.precio))}
            </p>
            <StockBadge stock={producto.stock} />
            {producto.descripcion && (
              <p className="store-muted leading-relaxed whitespace-pre-line text-sm">{producto.descripcion}</p>
            )}
            <ProductSpecs producto={producto} />

            {availability.length > 0 && (
              <ProductAvailabilityPanel
                availability={availability}
                activeBranchId={id_sucursal}
                onSelectBranch={setBranch}
              />
            )}

            <WhatsAppAssist
              telefono={tienda.telefono}
              tiendaNombre={tienda.nombre}
              branch={activeBranch}
              product={producto}
              qty={qty}
              label="Consultar por WhatsApp"
            />

            <div className="hidden lg:flex flex-wrap items-center gap-4 mt-4">
              <div className="inline-flex items-center border store-hairline bg-[var(--vitrina-elevated)] rounded-[var(--store-radius-pill)] overflow-hidden">
                <button type="button" className="size-11 flex items-center justify-center" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  type="button"
                  className="size-11 flex items-center justify-center"
                  onClick={() => setQty((q) => Math.min(producto.stock || 99, q + 1))}
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <button
                type="button"
                disabled={producto.stock <= 0}
                onClick={() => onAdd(producto, qty)}
                className="vitrina-pill inline-flex items-center gap-2 h-11 px-8 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--vitrina-accent)" }}
              >
                <ShoppingBag className="size-4" />
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </div>

      <StickyBuyBar
        precio={Number(producto.precio) * qty}
        disabled={producto.stock <= 0}
        onAdd={() => onAdd(producto, qty)}
        inCart={inCart}
        slug={slug}
      />

      <ProductRail
        title="También te puede interesar"
        eyebrow="Relacionados"
        productos={relacionados}
        slug={slug}
        onAdd={(p) => onAdd(p, 1)}
      />

      <StoreFooter tienda={tienda} slug={slug} />
      <CartFab slug={slug} count={count} />
    </StoreShell>
  );
}
