import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { getStore, getStoreProduct } from "../api/ecommerce";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StoreHeader } from "../components/vitrina/StoreHeader";
import { StoreFooter } from "../components/vitrina/StoreFooter";
import { ProductRail } from "../components/vitrina/ProductRail";
import { useStorefrontCatalog } from "../components/vitrina/hooks/useStorefrontCatalog";
import {
  formatPen,
  getCategoria,
  type StoreImagen,
  type StoreProducto,
  type StoreTienda,
} from "../types/storefront";

export default function StoreProductPage() {
  const { slug = "", id = "" } = useParams();
  const productId = Number(id);
  const setSlug = useEcommerceCartStore((s) => s.setSlug);
  const add = useEcommerceCartStore((s) => s.add);
  const count = useEcommerceCartStore((s) => s.count());
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const storeQ = useQuery({
    queryKey: ["store", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });

  const productQ = useQuery({
    queryKey: ["store-product", slug, productId],
    queryFn: () => getStoreProduct(slug, productId),
    enabled: Boolean(slug) && Number.isFinite(productId) && productId > 0,
  });

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

  const onAdd = (p: StoreProducto, cantidad = 1) => {
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

  if (productQ.isLoading || storeQ.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-white/50">
        Cargando producto…
      </div>
    );
  }

  if (!tienda || !producto || productQ.isError || !productQ.data?.success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#e8eef5] text-slate-600">
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
    <StoreShell tienda={tienda}>
      <StoreHeader
        tienda={tienda}
        slug={slug}
        cartCount={count}
        categorias={catalog.categorias}
        search={catalog.busqueda}
        onSearchChange={catalog.setBusqueda}
        onCategoria={catalog.setCategoria}
        categoriaActiva={catalog.categoria}
        compactSearch
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <Link
          to={`/tienda/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[var(--vitrina-accent)] mb-8"
        >
          <ArrowLeft className="size-4" />
          Volver al catálogo
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div className="flex gap-3">
            {galeria.length > 1 && (
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                {galeria.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    className={`aspect-square overflow-hidden border-2 transition ${
                      i === imgIdx ? "border-[var(--vitrina-accent)]" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 aspect-square bg-slate-100 overflow-hidden">
              {activeImg ? (
                <img src={activeImg} alt={producto.nombre} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-slate-300">Sin foto</div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            {cat && (
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-3">{cat}</span>
            )}
            <h1 className="vitrina-display text-4xl sm:text-5xl lg:text-6xl">{producto.nombre}</h1>
            <p className="mt-4 text-3xl font-semibold" style={{ color: "var(--vitrina-accent)" }}>
              {formatPen(Number(producto.precio))}
            </p>
            {producto.sku && (
              <p className="mt-2 text-xs font-mono text-slate-400">SKU {producto.sku}</p>
            )}
            {producto.descripcion && (
              <p className="mt-6 text-slate-600 leading-relaxed whitespace-pre-line">{producto.descripcion}</p>
            )}
            <p className="mt-4 text-sm text-slate-500">
              {producto.stock > 0 ? `${producto.stock} en stock` : "Agotado"}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center border border-slate-200 rounded-full bg-white">
                <button
                  type="button"
                  className="size-10 flex items-center justify-center"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Menos"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button
                  type="button"
                  className="size-10 flex items-center justify-center"
                  onClick={() => setQty((q) => Math.min(producto.stock || 99, q + 1))}
                  aria-label="Más"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <button
                type="button"
                disabled={producto.stock <= 0}
                onClick={() => onAdd(producto, qty)}
                className="vitrina-pill inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--vitrina-accent)" }}
              >
                <ShoppingBag className="size-4" />
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky buy bar mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3 safe-area-pb">
        <div>
          <p className="text-xs text-slate-400 truncate max-w-[10rem]">{producto.nombre}</p>
          <p className="font-semibold" style={{ color: "var(--vitrina-accent)" }}>
            {formatPen(Number(producto.precio))}
          </p>
        </div>
        <button
          type="button"
          disabled={producto.stock <= 0}
          onClick={() => onAdd(producto, qty)}
          className="vitrina-pill px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: "var(--vitrina-accent)" }}
        >
          Agregar
        </button>
      </div>

      <ProductRail
        title="También te puede interesar"
        eyebrow="Relacionados"
        productos={relacionados}
        slug={slug}
        onAdd={(p) => onAdd(p, 1)}
      />

      <div className="h-16 lg:hidden" />
      <StoreFooter tienda={tienda} slug={slug} />
    </StoreShell>
  );
}
