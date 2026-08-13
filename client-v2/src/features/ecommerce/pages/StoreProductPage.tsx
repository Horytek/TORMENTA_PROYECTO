import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { getStore, getStoreProduct, getProductAvailability, validateCartStore, buyerCrearSolicitud } from "../api/ecommerce";
import { useEcommerceCartStore, type AttrSeleccion } from "../store/useEcommerceCartStore";
import { useBranchStore } from "../store/useBranchStore";
import { useStorefrontAuthStore } from "../store/useStorefrontAuthStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StoreHeader } from "../components/vitrina/StoreHeader";
import { StoreFooter } from "../components/vitrina/StoreFooter";
import { ProductRail } from "../components/vitrina/ProductRail";
import { useStorefrontCatalog } from "../components/vitrina/hooks/useStorefrontCatalog";
import { ProductSpecs, StoreSkeleton } from "../components/vitrina/detail/ProductSpecs";
import { FavoriteHeartButton } from "../components/vitrina/FavoriteHeartButton";
import { StickyBuyBar } from "../components/vitrina/quick/StickyBuyBar";
import { CartFab } from "../components/vitrina/quick/CartFab";
import { ProductAvailabilityPanel } from "../design/ProductAvailabilityPanel";
import { ProductReviewsSection } from "../components/reviews/ProductReviewsSection";
import {
  AttrPicker,
  attrsSnapshotFromPicker,
  requiredAttrsIncomplete,
  resolveVarianteId,
  varianteSelectionUnresolved,
} from "../components/vitrina/AttrPicker";
import { addProductToCart, QuickAddSheet, useQuickAddGuard } from "../components/vitrina/QuickAddSheet";
import { AvailabilityStatus } from "../design/AvailabilityStatus";
import { ConsultarWhatsAppButton } from "../design/ConsultarWhatsAppButton";
import { StockWhatsAppLeyenda } from "../components/vitrina/StockWhatsAppLeyenda";
import { resolveDisponibilidad } from "../utils/disponibilidad";
import { buildDisponibilidadWaMessage, waLink } from "../design/buildWaMessage";
import {
  formatPen,
  getCategoria,
  getMarca,
  type BranchAvailability,
  type StorefrontAttr,
  type StorefrontVariante,
  type StoreImagen,
  type StoreImagenInformativa,
  type StoreProducto,
  type StoreSucursal,
  type StoreTienda,
} from "../types/storefront";

export default function StoreProductPage() {
  const { slug = "", id = "" } = useParams();
  const navigate = useNavigate();
  const productId = Number(id);
  const setSlug = useEcommerceCartStore((s) => s.setSlug);
  const items = useEcommerceCartStore((s) => s.items);
  const token = useStorefrontAuthStore((s) => s.token);
  const count = useEcommerceCartStore((s) => s.count());
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [sels, setSels] = useState<AttrSeleccion[]>([]);
  const [pendingRelated, setPendingRelated] = useState<StoreProducto | null>(null);
  const canAdd = useQuickAddGuard();

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
  const imagenesInformativas = (productQ.data?.data?.imagenes_informativas || []) as StoreImagenInformativa[];
  const atributos = (productQ.data?.data?.atributos || []) as StorefrontAttr[];
  const variantes = (productQ.data?.data?.variantes || []) as StorefrontVariante[];
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
  const attrsIncomplete = requiredAttrsIncomplete(atributos, sels);
  const idVariante = producto ? resolveVarianteId(variantes, atributos, sels) : null;
  const comboUnresolved = producto
    ? varianteSelectionUnresolved(variantes, atributos, sels)
    : false;
  const branchAvail = availability.find((a) => a.sucursal.id_sucursal === id_sucursal) || availability[0];
  const variantRow = idVariante
    ? branchAvail?.variantes?.find((v) => v.id_variante === idVariante)
    : null;
  // Si hay variante resuelta usa su stock; si no hay attrs es_variante, stock de sucursal/producto.
  const stockForCta = comboUnresolved
    ? 0
    : variantRow?.disponible ??
      (idVariante ? branchAvail?.disponible : undefined) ??
      branchAvail?.disponible ??
      producto?.stock ??
      0;
  // Misma regla que el backend: attrs de selección o variantes (talla/color).
  const hasSeleccionAttrs = atributos.some((a) => a.requiere_seleccion || a.es_variante);
  const disp = producto
    ? resolveDisponibilidad(
        stockForCta,
        producto.attrs_json,
        tienda?.disponibilidad_config || undefined,
        { hasSeleccionAttrs }
      )
    : null;
  const availabilityForUi = useMemo(() => {
    const mapBranch = (a: BranchAvailability) => {
      const stock = idVariante
        ? Number(a.variantes?.find((v) => Number(v.id_variante) === Number(idVariante))?.disponible) ||
          0
        : Number(a.disponible) || 0;
      return {
        ...a,
        disponible: stock,
        disponibilidad: resolveDisponibilidad(stock, producto?.attrs_json, tienda?.disponibilidad_config, {
          hasSeleccionAttrs,
        }),
      };
    };
    return availability.map(mapBranch);
  }, [availability, idVariante, producto?.attrs_json, tienda?.disponibilidad_config, hasSeleccionAttrs]);

  const waAttrs = producto ? attrsSnapshotFromPicker(atributos, sels) : [];
  const productUrl = typeof window !== "undefined" ? window.location.href.split("?")[0] : undefined;

  const onAdd = async (p: StoreProducto, cantidad = 1) => {
    // Misma fuente de verdad que el CTA: stock de variante en PDP actual; listados usan agregate.
    const isCurrent = p.id_producto === producto?.id_producto;
    const stockGate = isCurrent ? stockForCta : Number(p.stock) || 0;
    const pDisp =
      (isCurrent && disp) ||
      p.disponibilidad ||
      resolveDisponibilidad(stockGate, p.attrs_json, tienda?.disponibilidad_config, {
        hasSeleccionAttrs: isCurrent ? hasSeleccionAttrs : false,
      });
    if (!pDisp.cta.allowAddToCart) {
      toast.error("Antes de agregar este producto necesitamos confirmar su disponibilidad.");
      return;
    }
    if (stockGate < cantidad) {
      toast.error("Este producto ya no está disponible en la cantidad seleccionada.");
      return;
    }
    if (!canAdd(p)) return;
    if (isCurrent && comboUnresolved) {
      toast.error("Esta combinación no está disponible.");
      return;
    }
    if (!isCurrent) {
      setPendingRelated(p);
      return;
    }
    try {
      const selecciones = sels;
      const id_variante = resolveVarianteId(variantes, atributos, selecciones);
      const v = await validateCartStore(slug, {
        items: [
          {
            id_producto: p.id_producto,
            id_variante,
            cantidad,
            selecciones: selecciones.map((s) => ({
              id_atributo: s.id_atributo,
              id_valor: s.id_valor ?? null,
              valor: s.valor,
            })),
          },
        ],
        id_sucursal: id_sucursal || null,
      });
      if (!v?.data?.ok) {
        const msg = v?.data?.items?.[0]?.message || "Este producto ya no está disponible en la cantidad seleccionada.";
        toast.error(msg);
        return;
      }
      addProductToCart({
        producto: p,
        qty: cantidad,
        atributos,
        variantes,
        selecciones: sels,
        imagen: galeria[imgIdx] || p.imagen_url,
      });
      toast.success(`${p.nombre} agregado al carrito`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onEnviarSolicitud = async () => {
    if (!producto) return;
    if (attrsIncomplete) {
      toast.error("Selecciona todas las características del producto");
      return;
    }
    if (!id_sucursal) {
      toast.error("Selecciona una sucursal");
      return;
    }
    if (!token) {
      toast.message("Inicia sesión para enviar la solicitud");
      navigate(`/tienda/${slug}/login?next=/tienda/${slug}/producto/${productId}`);
      return;
    }
    try {
      const attrs: Record<string, string> = {};
      for (const a of waAttrs) attrs[a.nombre] = a.valor;
      const res = await buyerCrearSolicitud(slug, {
        id_producto: producto.id_producto,
        id_variante: idVariante,
        id_sucursal,
        cantidad: qty,
        attrs,
      });
      if (res.duplicated) {
        toast.message(res.message || "Ya tienes una solicitud pendiente");
      } else {
        toast.success(res.message || "Solicitud enviada");
      }
      navigate(`/tienda/${slug}/cuenta/solicitudes`);
    } catch (e) {
      toast.error((e as Error).message);
    }
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
  const marca = getMarca(producto);
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
            <div className="flex-1 aspect-square bg-[var(--vitrina-fog)] overflow-hidden rounded-[var(--store-radius-lg)] relative">
              <div className="absolute top-3 right-3 z-10">
                <FavoriteHeartButton id_producto={producto.id_producto} />
              </div>
              {galeria.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 size-10 flex items-center justify-center bg-black/40 text-white"
                    onClick={() => setImgIdx((i) => (i - 1 + galeria.length) % galeria.length)}
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 size-10 flex items-center justify-center bg-black/40 text-white"
                    onClick={() => setImgIdx((i) => (i + 1) % galeria.length)}
                    aria-label="Siguiente"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
              {activeImg ? (
                <img
                  src={activeImg}
                  alt={producto.nombre}
                  className={`size-full object-cover cursor-zoom-in transition-transform duration-300 ${
                    zoom ? "scale-150 cursor-zoom-out" : "scale-100"
                  }`}
                  onClick={() => setZoom((z) => !z)}
                  onTouchStart={(e) => {
                    (e.currentTarget as HTMLImageElement).dataset.tx = String(e.touches[0].clientX);
                  }}
                  onTouchEnd={(e) => {
                    const start = Number((e.currentTarget as HTMLImageElement).dataset.tx || 0);
                    const dx = e.changedTouches[0].clientX - start;
                    if (dx > 40) setImgIdx((i) => (i - 1 + galeria.length) % galeria.length);
                    if (dx < -40) setImgIdx((i) => (i + 1) % galeria.length);
                  }}
                />
              ) : (
                <div className="size-full flex items-center justify-center store-muted">Sin foto</div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wider store-muted">
              {marca && (
                <span className="font-semibold" style={{ color: "var(--vitrina-accent)" }}>
                  {marca}
                </span>
              )}
              {marca && cat && <span aria-hidden>·</span>}
              {cat && <span>{cat}</span>}
            </div>
            <h1 className="vitrina-display text-4xl sm:text-5xl">{producto.nombre}</h1>
            <p className="text-2xl font-semibold" style={{ color: "var(--vitrina-accent)" }}>
              {formatPen(Number(producto.precio))}
            </p>
            {disp && <AvailabilityStatus disp={disp} />}
            {variantRow && disp?.estado === "consultar" && (
              <p className="text-sm text-amber-800">Consulta disponibilidad de esta talla</p>
            )}
            {producto.descripcion && (
              <p className="store-muted leading-relaxed whitespace-pre-line text-sm">{producto.descripcion}</p>
            )}
            <ProductSpecs producto={producto} />

            <AttrPicker atributos={atributos} value={sels} onChange={setSels} />

            {availabilityForUi.length > 0 && (
              <ProductAvailabilityPanel
                availability={availabilityForUi}
                activeBranchId={id_sucursal}
                onSelectBranch={setBranch}
                allowConsultEmpty
                modeSolicitud={Boolean(disp?.cta.showEnviarSolicitud)}
              />
            )}

            {comboUnresolved && (
              <p className="text-sm text-red-700">
                Esta combinación de atributos no está disponible. Prueba otra opción o consulta por WhatsApp.
              </p>
            )}

            {disp?.cta.showEnviarSolicitud && (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={attrsIncomplete || !id_sucursal}
                  onClick={onEnviarSolicitud}
                  className="w-full sm:w-auto vitrina-pill inline-flex items-center justify-center gap-2 h-11 px-8 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: "var(--vitrina-accent)" }}
                >
                  Enviar solicitud
                </button>
                <p className="text-xs store-muted">Confirma la disponibilidad antes de comprar.</p>
                <Link to={`/tienda/${slug}/cuenta/solicitudes`} className="text-xs underline store-muted">
                  Ver mis solicitudes
                </Link>
              </div>
            )}

            {disp?.cta.showWhatsapp && (
              <ConsultarWhatsAppButton
                slug={slug}
                telefono={tienda.telefono}
                tiendaNombre={tienda.nombre}
                branch={activeBranch}
                product={producto}
                qty={qty}
                sku={variantRow?.sku || producto.sku}
                attrs={waAttrs}
                id_variante={idVariante}
                productUrl={productUrl}
                origen="producto"
                primary={disp.cta.primary === "whatsapp"}
                mensajeIntro={tienda.disponibilidad_config?.mensaje_intro}
                label={
                  disp.cta.primary === "whatsapp"
                    ? "Consultar por WhatsApp"
                    : "También por WhatsApp"
                }
              />
            )}

            <div className="hidden lg:flex flex-wrap items-center gap-4 mt-2">
              {disp?.cta.showCart && (
                <>
                  <div className="inline-flex items-center border store-hairline bg-[var(--vitrina-elevated)] rounded-[var(--store-radius-pill)] overflow-hidden">
                    <button type="button" className="size-11 flex items-center justify-center" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                      <Minus className="size-4" />
                    </button>
                    <span className="w-10 text-center font-semibold">{qty}</span>
                    <button
                      type="button"
                      className="size-11 flex items-center justify-center"
                      onClick={() => setQty((q) => Math.min(Math.max(stockForCta, 1), q + 1))}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!disp.cta.allowAddToCart || attrsIncomplete || comboUnresolved}
                    onClick={() => onAdd(producto, qty)}
                    className="vitrina-pill inline-flex items-center gap-2 h-11 px-8 text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: "var(--vitrina-accent)" }}
                  >
                    <ShoppingBag className="size-4" />
                    Agregar al carrito
                  </button>
                </>
              )}
            </div>

            <StockWhatsAppLeyenda
              mensaje={tienda.disponibilidad_config?.mensaje_leyenda_stock}
              whatsappHref={
                !disp?.cta.showWhatsapp
                  ? waLink(
                      activeBranch?.whatsapp || activeBranch?.telefono || tienda.telefono,
                      buildDisponibilidadWaMessage({
                        tiendaNombre: tienda.nombre,
                        product: producto,
                        branch: activeBranch,
                        qty,
                        sku: variantRow?.sku || producto.sku,
                        attrs: waAttrs,
                        productUrl,
                        intro: tienda.disponibilidad_config?.mensaje_intro,
                      })
                    )
                  : null
              }
            />
          </div>
        </div>
      </div>

      {(disp?.cta.showCart || disp?.cta.primary === "whatsapp" || disp?.cta.showEnviarSolicitud) && (
      <StickyBuyBar
        precio={Number(producto.precio) * qty}
        disabled={
          disp?.cta.showEnviarSolicitud
            ? attrsIncomplete || !id_sucursal || comboUnresolved
            : !disp?.cta.allowAddToCart || attrsIncomplete || comboUnresolved
        }
        onAdd={() =>
          disp?.cta.showEnviarSolicitud ? onEnviarSolicitud() : onAdd(producto, qty)
        }
        addLabel={disp?.cta.showEnviarSolicitud ? "Enviar solicitud" : undefined}
        inCart={inCart}
        slug={slug}
        whatsapp={
          disp?.cta.primary === "whatsapp" && !disp?.cta.showEnviarSolicitud ? (
            <ConsultarWhatsAppButton
              slug={slug}
              telefono={tienda.telefono}
              tiendaNombre={tienda.nombre}
              branch={activeBranch}
              product={producto}
              qty={qty}
              sku={variantRow?.sku || producto.sku}
              attrs={waAttrs}
              id_variante={idVariante}
              productUrl={productUrl}
              origen="producto"
              label="Consultar disponibilidad"
              className="flex-1"
              mensajeIntro={tienda.disponibilidad_config?.mensaje_intro}
            />
          ) : null
        }
      />
      )}

      {imagenesInformativas.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-10 lg:pb-14">
          <h2 className="text-lg font-semibold tracking-tight mb-2">Información del producto</h2>
          <p className="text-sm store-muted mb-6">Guías, fichas y detalles útiles</p>
          <div className="space-y-6">
            {imagenesInformativas.map((img) => (
              <figure
                key={img.id_imagen}
                className="rounded-[var(--store-radius,1rem)] overflow-hidden border store-hairline bg-[var(--vitrina-elevated)]"
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-auto object-contain max-h-[min(90vh,900px)] mx-auto"
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </section>
      )}

      <ProductReviewsSection slug={slug} id_producto={productId} />

      <ProductRail
        title="También te puede interesar"
        eyebrow="Relacionados"
        productos={relacionados}
        slug={slug}
        onAdd={(p) => onAdd(p, 1)}
      />

      <StoreFooter tienda={tienda} slug={slug} />
      <CartFab slug={slug} count={count} />
      <QuickAddSheet slug={slug} producto={pendingRelated} onClose={() => setPendingRelated(null)} />
    </StoreShell>
  );
}
