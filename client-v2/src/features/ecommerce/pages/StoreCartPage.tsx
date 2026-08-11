import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { useBranchStore } from "../store/useBranchStore";
import { checkoutStore, getStore } from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StoreHeader } from "../components/vitrina/StoreHeader";
import { StoreFooter } from "../components/vitrina/StoreFooter";
import { useStorefrontCatalog } from "../components/vitrina/hooks/useStorefrontCatalog";
import { BranchAddressCard } from "../design/BranchAddressCard";
import { BranchSelector } from "../design/BranchSelector";
import { buildWaMessage, waLink } from "../design/buildWaMessage";
import { formatPen, type StoreProducto, type StoreSucursal, type StoreTienda } from "../types/storefront";

const FALLBACK_TIENDA: StoreTienda = {
  slug: "",
  nombre: "Tienda",
  color_primario: "#0E7C7B",
};

export default function StoreCartPage() {
  const { slug = "" } = useParams();
  const { items, setQty, remove, total, setSlug, clear } = useEcommerceCartStore();
  const count = useEcommerceCartStore((s) => s.count());
  const id_sucursal = useBranchStore((s) => s.id_sucursal);
  const setBranch = useBranchStore((s) => s.setBranch);
  const initForStore = useBranchStore((s) => s.initForStore);
  const sucursales = useBranchStore((s) => s.sucursales);
  const activeBranch = useBranchStore((s) => s.activeBranch());
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const storeQ = useQuery({
    queryKey: ["store", slug, id_sucursal],
    queryFn: () => getStore(slug, id_sucursal),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const list = (storeQ.data?.data?.sucursales || []) as StoreSucursal[];
    if (slug && list.length) initForStore(slug, list);
  }, [storeQ.data, slug, initForStore]);

  const tienda = (storeQ.data?.data?.tienda as StoreTienda | undefined) || {
    ...FALLBACK_TIENDA,
    slug,
    nombre: slug || "Tienda",
  };
  const productos = (storeQ.data?.data?.productos || []) as StoreProducto[];
  const catalog = useStorefrontCatalog(productos);

  const handleBranchSelect = (id: number) => {
    setBranch(id);
  };

  const checkoutMut = useMutation({
    mutationFn: () => {
      if (!id_sucursal) {
        throw new Error("Elige una sucursal de recojo");
      }
      return checkoutStore(slug, {
        items: items.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
        id_sucursal,
        fulfillment: "pickup",
        email_comprador: email.trim(),
        nombre_comprador: nombre.trim() || undefined,
        whatsapp_context: activeBranch
          ? { sucursal: activeBranch.nombre, direccion: activeBranch.direccion }
          : undefined,
      });
    },
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Error en checkout");
        return;
      }
      if (res.data?.pickup?.direccion) {
        sessionStorage.setItem(
          `ecom-pickup-${slug}`,
          JSON.stringify(res.data.pickup)
        );
      }
      clear();
      const isTest = String(res.data.modo || "test").toLowerCase() === "test";
      const checkoutUrl = isTest
        ? res.data.sandbox_init_point ||
          res.data.init_point ||
          (res.data.preference_id
            ? `https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=${res.data.preference_id}`
            : null)
        : res.data.init_point ||
          res.data.sandbox_init_point ||
          (res.data.preference_id
            ? `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${res.data.preference_id}`
            : null);
      if (!checkoutUrl) {
        toast.error("No se recibió URL de pago");
        return;
      }
      window.location.href = checkoutUrl;
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || e.message || "Error");
    },
  });

  const waHref = waLink(
    activeBranch?.whatsapp || activeBranch?.telefono || tienda.telefono,
    buildWaMessage({ tiendaNombre: tienda.nombre, branch: activeBranch, cart: items })
  );

  return (
    <StoreShell tienda={tienda} slug={slug}>
      <StoreHeader
        tienda={tienda}
        slug={slug}
        cartCount={count}
        categorias={catalog.categorias}
        onCategoria={catalog.setCategoria}
        categoriaActiva={null}
        productos={productos}
        sucursales={sucursales}
        activeBranchId={id_sucursal}
        onBranchSelect={handleBranchSelect}
      />

      <div className="max-w-2xl mx-auto px-4 py-12 lg:py-16 flex-1 w-full pb-28 lg:pb-16">
        <Link to={`/tienda/${slug}`} className="text-sm store-muted hover:text-[var(--vitrina-accent)] min-h-11 inline-flex items-center">
          ← Volver a la tienda
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight mt-4">Tu carrito</h1>
        <p className="text-sm store-muted mt-1">Recojo en tienda — sin envío a domicilio por ahora</p>

        {sucursales.length > 0 && (
          <div className="mt-6 space-y-3">
            <BranchSelector
              sucursales={sucursales}
              activeId={id_sucursal ?? sucursales[0]?.id_sucursal}
              onSelect={handleBranchSelect}
            />
            {activeBranch && (
              <div className="rounded-xl border store-hairline bg-[var(--vitrina-accent-soft)] p-4">
                <p className="text-xs uppercase tracking-wide store-muted">Recogerás en</p>
                <p className="font-semibold mt-1">{activeBranch.nombre}</p>
                <BranchAddressCard sucursal={activeBranch} compact className="mt-2 border-0 bg-transparent p-0" />
              </div>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-12 text-center py-16 border border-dashed store-hairline bg-[var(--vitrina-elevated)]">
            <p className="store-muted mb-4">Tu carrito está vacío.</p>
            <Link
              to={`/tienda/${slug}#catalogo`}
              className="inline-flex h-11 px-6 items-center text-sm font-semibold text-white"
              style={{ background: "var(--vitrina-accent)" }}
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((i) => (
              <li
                key={i.id_producto}
                className="vitrina-card border store-hairline bg-[var(--vitrina-elevated)] p-4 flex gap-4"
              >
                <div className="store-thumb size-20 bg-[var(--vitrina-fog)] shrink-0">
                  {i.imagen_url && <img src={i.imagen_url} alt="" className="size-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{i.nombre}</div>
                  <div className="text-sm mt-0.5" style={{ color: "var(--vitrina-accent)" }}>
                    {formatPen(i.precio)}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      type="number"
                      min={1}
                      className="w-20 h-8 rounded-full"
                      value={i.cantidad}
                      onChange={(e) => setQty(i.id_producto, Number(e.target.value))}
                    />
                    <Button variant="ghost" size="sm" onClick={() => remove(i.id_producto)}>
                      Quitar
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="mt-8 space-y-4 vitrina-card border store-hairline bg-[var(--vitrina-elevated)] p-6">
            <div className="flex justify-between items-baseline">
              <span className="store-muted">Total</span>
              <span className="vitrina-display text-3xl" style={{ color: "var(--vitrina-accent)" }}>
                {formatPen(total())}
              </span>
            </div>
            <div>
              <Label>Tu email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 rounded-full"
              />
            </div>
            <div>
              <Label>Nombre (opcional)</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 rounded-full"
              />
            </div>
            {!id_sucursal && sucursales.length > 0 && (
              <p className="text-sm text-amber-700 bg-amber-500/10 px-3 py-2 rounded-lg">
                Selecciona la sucursal donde recogerás tu pedido.
              </p>
            )}
            <button
              type="button"
              className="vitrina-pill w-full py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--vitrina-accent)" }}
              disabled={!email.trim() || !id_sucursal || checkoutMut.isPending}
              onClick={() => checkoutMut.mutate()}
            >
              {checkoutMut.isPending ? "Redirigiendo…" : "Pagar y recoger en tienda"}
            </button>
            {waHref && (
              <a href={waHref} target="_blank" rel="noreferrer" className="block text-center text-sm store-muted hover:underline">
                ¿Dudas? Escríbenos por WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      <StoreFooter tienda={tienda} slug={slug} />
    </StoreShell>
  );
}
