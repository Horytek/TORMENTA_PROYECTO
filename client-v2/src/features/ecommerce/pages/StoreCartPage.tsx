import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { Bike, Package, Store } from "lucide-react";
import { useEcommerceCartStore } from "../store/useEcommerceCartStore";
import { useBranchStore } from "../store/useBranchStore";
import { useStorefrontAuthStore } from "../store/useStorefrontAuthStore";
import {
  checkoutStore,
  getStore,
  buyerMe,
  storeEntregaOpciones,
  storeEntregaCotizar,
} from "../api/ecommerce";
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
import { ConsultarWhatsAppButton } from "../design/ConsultarWhatsAppButton";
import { buildWaMessage, waLink } from "../design/buildWaMessage";
import { formatPen, type StoreProducto, type StoreSucursal, type StoreTienda } from "../types/storefront";
import { cn } from "@/lib/utils";

const FALLBACK_TIENDA: StoreTienda = {
  slug: "",
  nombre: "Tienda",
  color_primario: "#0E7C7B",
};

type Fulfillment = "pickup" | "delivery" | "provincia";

export default function StoreCartPage() {
  const { slug = "" } = useParams();
  const { items, setQty, remove, total, setSlug, clear } = useEcommerceCartStore();
  const count = useEcommerceCartStore((s) => s.count());
  const id_sucursal = useBranchStore((s) => s.id_sucursal);
  const setBranch = useBranchStore((s) => s.setBranch);
  const initForStore = useBranchStore((s) => s.initForStore);
  const sucursales = useBranchStore((s) => s.sucursales);
  const activeBranch = useBranchStore((s) => s.activeBranch());
  const { token, user, hydrate, setSession, clear: clearAuth } = useStorefrontAuthStore();
  const [telefono, setTelefono] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [idDestino, setIdDestino] = useState<number | null>(null);
  const [idAgencia, setIdAgencia] = useState<number | null>(null);
  const [idZona, setIdZona] = useState<number | null>(null);
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [quoteMsg, setQuoteMsg] = useState<string | null>(null);

  const subtotal = total();

  useEffect(() => {
    if (slug) {
      setSlug(slug);
      hydrate(slug);
    }
  }, [slug, setSlug, hydrate]);

  useEffect(() => {
    const t = useStorefrontAuthStore.getState().token;
    if (!slug || !t) return;
    buyerMe(slug)
      .then((res) => {
        if (res.success && res.data?.user) setSession(t, res.data.user, slug);
      })
      .catch(() => clearAuth());
  }, [slug, setSession, clearAuth]);

  useEffect(() => {
    if (user?.telefono) setTelefono(user.telefono);
  }, [user?.telefono]);

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

  const opcionesQ = useQuery({
    queryKey: ["entrega-opciones", slug, subtotal, id_sucursal],
    queryFn: () =>
      storeEntregaOpciones(slug, {
        subtotal,
        id_sucursal: id_sucursal || undefined,
      }),
    enabled: Boolean(slug) && items.length > 0,
  });

  const opciones = (opcionesQ.data?.data?.opciones || []) as {
    fulfillment: Fulfillment;
    label: string;
    desde?: number | null;
    gratis_desde?: number | null;
    disponible?: boolean;
    motivo?: string | null;
    requiere_agencia?: boolean;
  }[];
  const destinos = (opcionesQ.data?.data?.destinos || []) as {
    id_destino: number;
    departamento: string;
    provincia?: string | null;
    costo: number;
  }[];
  const agencias = (opcionesQ.data?.data?.agencias || []) as {
    id_agencia: number;
    nombre: string;
  }[];
  const zonas = (opcionesQ.data?.data?.zonas || []) as {
    id_zona: number;
    nombre: string;
    costo: number;
  }[];

  useEffect(() => {
    if (!opciones.length) return;
    if (!opciones.some((o) => o.fulfillment === fulfillment)) {
      setFulfillment(opciones[0].fulfillment);
    }
  }, [opciones, fulfillment]);

  useEffect(() => {
    if (!slug || items.length === 0) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await storeEntregaCotizar(slug, {
          fulfillment,
          subtotal,
          id_sucursal,
          id_destino: idDestino,
          id_zona: idZona,
          lat: lat ? Number(lat) : null,
          lng: lng ? Number(lng) : null,
        });
        if (cancelled) return;
        if (res.success && res.data?.disponible) {
          setCostoEnvio(Number(res.data.costo || 0));
          setQuoteMsg(null);
          if (res.data.zona?.id_zona) setIdZona(res.data.zona.id_zona);
        } else {
          setCostoEnvio(0);
          setQuoteMsg(res.data?.motivo || "No disponible");
        }
      } catch {
        if (!cancelled) {
          setCostoEnvio(0);
          setQuoteMsg("No se pudo cotizar");
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug, fulfillment, subtotal, id_sucursal, idDestino, idZona, lat, lng, items.length]);

  const tienda = (storeQ.data?.data?.tienda as StoreTienda | undefined) || {
    ...FALLBACK_TIENDA,
    slug,
    nombre: slug || "Tienda",
  };
  const productos = (storeQ.data?.data?.productos || []) as StoreProducto[];
  const catalog = useStorefrontCatalog(productos);
  const pickupBranches = useMemo(
    () => sucursales.filter((s) => s.allow_pickup !== false),
    [sucursales]
  );

  const handleBranchSelect = (id: number) => setBranch(id);

  const gratisHint = useMemo(() => {
    const opt = opciones.find((o) => o.fulfillment === fulfillment);
    if (!opt?.gratis_desde) return null;
    const falta = Number(opt.gratis_desde) - subtotal;
    if (falta <= 0) return "¡Delivery gratis en este pedido!";
    return `Te faltan ${formatPen(falta)} para delivery gratis`;
  }, [opciones, fulfillment, subtotal]);

  const totalFinal = Math.round((subtotal + costoEnvio) * 100) / 100;

  const consultItems = items.filter((i) => {
    const p = productos.find((x) => x.id_producto === i.id_producto);
    return p?.disponibilidad && !p.disponibilidad.cta.allowAddToCart;
  });

  const canPay = (() => {
    if (consultItems.length) return false;
    if (!token) return false;
    if (quoteMsg && fulfillment !== "pickup") return false;
    if (fulfillment === "pickup") return Boolean(id_sucursal);
    if (fulfillment === "delivery") return Boolean(direccion.trim());
    if (fulfillment === "provincia") {
      const reqAg = opciones.find((o) => o.fulfillment === "provincia")?.requiere_agencia;
      return Boolean(idDestino) && (!reqAg || Boolean(idAgencia));
    }
    return false;
  })();

  const checkoutMut = useMutation({
    mutationFn: () => {
      if (!token) throw new Error("Inicia sesión para comprar");
      return checkoutStore(slug, {
        items: items.map((i) => ({
          id_producto: i.id_producto,
          id_variante: i.id_variante,
          cantidad: i.cantidad,
          selecciones: i.selecciones,
        })),
        id_sucursal: fulfillment === "pickup" ? id_sucursal : id_sucursal || undefined,
        fulfillment,
        telefono_comprador: telefono.trim() || undefined,
        id_zona: fulfillment === "delivery" ? idZona : undefined,
        id_destino: fulfillment === "provincia" ? idDestino : undefined,
        id_agencia: fulfillment === "provincia" ? idAgencia : undefined,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        entrega:
          fulfillment === "pickup"
            ? undefined
            : {
                direccion: direccion.trim() || undefined,
                referencia: referencia.trim() || undefined,
                distrito: distrito.trim() || undefined,
                telefono: telefono.trim() || undefined,
              },
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
        sessionStorage.setItem(`ecom-pickup-${slug}`, JSON.stringify(res.data.pickup));
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

  const methodIcon = { pickup: Store, delivery: Bike, provincia: Package };

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
        <p className="text-sm store-muted mt-1">Elige cómo recibir tu pedido e inicia sesión para pagar</p>

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
          <>
            <ul className="mt-8 space-y-3">
              {items.map((i) => (
                <li
                  key={i.line_key}
                  className="vitrina-card border store-hairline bg-[var(--vitrina-elevated)] p-4 flex gap-4"
                >
                  <div className="store-thumb size-20 bg-[var(--vitrina-fog)] shrink-0">
                    {i.imagen_url && <img src={i.imagen_url} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{i.nombre}</div>
                    {i.attrs_label && (
                      <div className="text-xs store-muted mt-0.5">{i.attrs_label}</div>
                    )}
                    {consultItems.some((c) => c.line_key === i.line_key) && (
                      <p className="text-xs text-amber-800 mt-1">⚠ Requiere confirmar disponibilidad</p>
                    )}
                    <div className="text-sm mt-0.5" style={{ color: "var(--vitrina-accent)" }}>
                      {formatPen(i.precio)}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Input
                        type="number"
                        min={1}
                        className="w-20 h-8 rounded-full"
                        value={i.cantidad}
                        onChange={(e) => setQty(i.line_key, Number(e.target.value))}
                      />
                      <Button variant="ghost" size="sm" onClick={() => remove(i.line_key)}>
                        Quitar
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {opciones.length > 0 && (
              <div className="mt-8 space-y-3">
                <h2 className="font-semibold">Método de entrega</h2>
                <div className="grid gap-2 sm:grid-cols-3">
                  {opciones.map((o) => {
                    const Icon = methodIcon[o.fulfillment];
                    return (
                      <button
                        key={o.fulfillment}
                        type="button"
                        onClick={() => setFulfillment(o.fulfillment)}
                        className={cn(
                          "text-left rounded-xl border p-4 transition",
                          fulfillment === o.fulfillment
                            ? "border-[var(--vitrina-accent)] ring-1 ring-[var(--vitrina-accent)]/40"
                            : "store-hairline bg-[var(--vitrina-elevated)]"
                        )}
                      >
                        <Icon className="size-5 mb-2 text-stone-500" />
                        <p className="font-medium text-sm">{o.label}</p>
                        <p className="text-xs store-muted mt-1">
                          {o.desde != null ? `Desde ${formatPen(Number(o.desde))}` : "—"}
                        </p>
                      </button>
                    );
                  })}
                </div>
                {gratisHint && fulfillment === "delivery" && (
                  <p className="text-sm text-teal-800 bg-teal-50 rounded-lg px-3 py-2">{gratisHint}</p>
                )}
              </div>
            )}

            {fulfillment === "pickup" && pickupBranches.length > 0 && (
              <div className="mt-6 space-y-3">
                <BranchSelector
                  sucursales={pickupBranches}
                  activeId={id_sucursal ?? pickupBranches[0]?.id_sucursal}
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

            {fulfillment === "delivery" && (
              <div className="mt-6 space-y-3 vitrina-card border store-hairline p-4 bg-[var(--vitrina-elevated)]">
                {zonas.length > 0 && (
                  <div>
                    <Label>Zona</Label>
                    <select
                      className="mt-1 w-full h-10 rounded-md border store-hairline px-2 text-sm bg-white"
                      value={idZona ?? ""}
                      onChange={(e) => setIdZona(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Detectar por coordenadas / elegir</option>
                      {zonas.map((z) => (
                        <option key={z.id_zona} value={z.id_zona}>
                          {z.nombre} · {formatPen(z.costo)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label>Dirección</Label>
                  <Input className="mt-1" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Distrito</Label>
                    <Input className="mt-1" value={distrito} onChange={(e) => setDistrito(e.target.value)} />
                  </div>
                  <div>
                    <Label>Referencia</Label>
                    <Input className="mt-1" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Lat (opc.)</Label>
                    <Input className="mt-1" value={lat} onChange={(e) => setLat(e.target.value)} />
                  </div>
                  <div>
                    <Label>Lng (opc.)</Label>
                    <Input className="mt-1" value={lng} onChange={(e) => setLng(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {fulfillment === "provincia" && (
              <div className="mt-6 space-y-3 vitrina-card border store-hairline p-4 bg-[var(--vitrina-elevated)]">
                <div>
                  <Label>Destino</Label>
                  <select
                    className="mt-1 w-full h-10 rounded-md border store-hairline px-2 text-sm bg-white"
                    value={idDestino ?? ""}
                    onChange={(e) => setIdDestino(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Selecciona</option>
                    {destinos.map((d) => (
                      <option key={d.id_destino} value={d.id_destino}>
                        {d.departamento}
                        {d.provincia ? ` / ${d.provincia}` : ""} · {formatPen(d.costo)}
                      </option>
                    ))}
                  </select>
                </div>
                {agencias.length > 0 && (
                  <div>
                    <Label>Agencia</Label>
                    <select
                      className="mt-1 w-full h-10 rounded-md border store-hairline px-2 text-sm bg-white"
                      value={idAgencia ?? ""}
                      onChange={(e) => setIdAgencia(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Selecciona</option>
                      {agencias.map((a) => (
                        <option key={a.id_agencia} value={a.id_agencia}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label>Dirección / referencia</Label>
                  <Input className="mt-1" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                </div>
              </div>
            )}

            <div className="mt-8 space-y-4 vitrina-card border store-hairline bg-[var(--vitrina-elevated)] p-6">
              <div className="flex justify-between text-sm">
                <span className="store-muted">Subtotal</span>
                <span>{formatPen(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="store-muted">Envío</span>
                <span>{formatPen(costoEnvio)}</span>
              </div>
              {quoteMsg && fulfillment !== "pickup" && (
                <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">{quoteMsg}</p>
              )}
              <div className="flex justify-between items-baseline border-t store-hairline pt-3">
                <span className="store-muted">Total</span>
                <span className="vitrina-display text-3xl" style={{ color: "var(--vitrina-accent)" }}>
                  {formatPen(totalFinal)}
                </span>
              </div>

              {!token ? (
                <div className="rounded-lg bg-[var(--vitrina-accent-soft)] p-4 text-center space-y-3">
                  <p className="text-sm">Debes iniciar sesión para completar tu compra.</p>
                  <div className="flex gap-2 justify-center">
                    <Button asChild size="sm">
                      <Link to={`/tienda/${slug}/login`} state={{ from: `/tienda/${slug}/carrito` }}>
                        Iniciar sesión
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/tienda/${slug}/registro`}>Registrarme</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm space-y-1 border-b store-hairline pb-3">
                    <p>
                      <span className="store-muted">Comprador:</span> {user?.nombre}
                    </p>
                    <p>
                      <span className="store-muted">Email:</span> {user?.email}
                    </p>
                  </div>
                  <div>
                    <Label>Teléfono de contacto</Label>
                    <Input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="mt-1 rounded-full"
                      placeholder="Opcional"
                    />
                  </div>
                </>
              )}

              {consultItems.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                  <p className="text-sm text-amber-900 font-medium">
                    Uno de los productos requiere confirmar disponibilidad.
                  </p>
                  {consultItems.map((item) => {
                    const prod = productos.find((p) => p.id_producto === item.id_producto);
                    if (!prod) return null;
                    return (
                      <ConsultarWhatsAppButton
                        key={item.line_key}
                        slug={slug}
                        telefono={tienda.telefono}
                        tiendaNombre={tienda.nombre}
                        branch={activeBranch}
                        product={prod}
                        qty={item.cantidad}
                        origen="carrito"
                        label={`Consultar ${prod.nombre}`}
                        mensajeIntro={tienda.disponibilidad_config?.mensaje_intro}
                      />
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                className="vitrina-pill w-full py-3 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--vitrina-accent)" }}
                disabled={!canPay || checkoutMut.isPending}
                onClick={() => checkoutMut.mutate()}
              >
                {checkoutMut.isPending ? "Redirigiendo…" : "Pagar con Mercado Pago"}
              </button>
              {waHref && (
                <a href={waHref} target="_blank" rel="noreferrer" className="block text-center text-sm store-muted hover:underline">
                  ¿Dudas? Escríbenos por WhatsApp
                </a>
              )}
            </div>
          </>
        )}
      </div>

      <StoreFooter tienda={tienda} slug={slug} />
    </StoreShell>
  );
}
