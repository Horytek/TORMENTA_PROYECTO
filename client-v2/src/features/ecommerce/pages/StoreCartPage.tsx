import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { checkoutStore, getStore } from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { StoreShell } from "../components/vitrina/StoreShell";
import { StoreHeader } from "../components/vitrina/StoreHeader";
import { StoreFooter } from "../components/vitrina/StoreFooter";
import { useStorefrontCatalog } from "../components/vitrina/hooks/useStorefrontCatalog";
import { formatPen, type StoreProducto, type StoreTienda } from "../types/storefront";

const FALLBACK_TIENDA: StoreTienda = {
  slug: "",
  nombre: "Tienda",
  color_primario: "#0E7C7B",
};

export default function StoreCartPage() {
  const { slug = "" } = useParams();
  const { items, setQty, remove, total, setSlug, clear } = useEcommerceCartStore();
  const count = useEcommerceCartStore((s) => s.count());
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const storeQ = useQuery({
    queryKey: ["store", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });

  const tienda = (storeQ.data?.data?.tienda as StoreTienda | undefined) || {
    ...FALLBACK_TIENDA,
    slug,
    nombre: slug || "Tienda",
  };
  const productos = (storeQ.data?.data?.productos || []) as StoreProducto[];
  const catalog = useStorefrontCatalog(productos);

  const checkoutMut = useMutation({
    mutationFn: () =>
      checkoutStore(slug, {
        items: items.map((i) => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
        email_comprador: email.trim(),
        nombre_comprador: nombre.trim() || undefined,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Error en checkout");
        return;
      }
      clear();
      window.location.href =
        res.data.init_point ||
        `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${res.data.preference_id}`;
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || e.message || "Error");
    },
  });

  return (
    <StoreShell tienda={tienda}>
      <StoreHeader
        tienda={tienda}
        slug={slug}
        cartCount={count}
        categorias={catalog.categorias}
        search=""
        onSearchChange={() => {}}
        onCategoria={() => {}}
        categoriaActiva={null}
        compactSearch
      />

      <div className="max-w-2xl mx-auto px-4 py-12 lg:py-16 flex-1 w-full">
        <Link
          to={`/tienda/${slug}`}
          className="text-sm text-slate-500 hover:text-[var(--vitrina-accent)] transition-colors"
        >
          ← Volver a la tienda
        </Link>
        <h1 className="vitrina-display text-4xl sm:text-5xl mt-4">Tu carrito</h1>

        {items.length === 0 ? (
          <div className="mt-12 text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white/60">
            <p className="text-slate-400 mb-4">Tu carrito está vacío.</p>
            <Link
              to={`/tienda/${slug}`}
              className="vitrina-pill inline-flex px-6 py-2.5 text-sm font-semibold text-white"
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
                className="vitrina-card border border-slate-200 bg-white p-4 flex gap-4"
              >
                <div className="size-20 bg-slate-100 overflow-hidden shrink-0">
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
          <div className="mt-8 space-y-4 vitrina-card border border-slate-200 bg-white p-6">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500">Total</span>
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
            <button
              type="button"
              className="vitrina-pill w-full py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--vitrina-accent)" }}
              disabled={!email.trim() || checkoutMut.isPending}
              onClick={() => checkoutMut.mutate()}
            >
              {checkoutMut.isPending ? "Redirigiendo…" : "Pagar con Mercado Pago"}
            </button>
          </div>
        )}
      </div>

      <StoreFooter tienda={tienda} slug={slug} />
    </StoreShell>
  );
}
