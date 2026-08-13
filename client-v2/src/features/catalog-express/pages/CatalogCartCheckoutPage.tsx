import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Trash2 } from "lucide-react";
import { getStoreBySlug, checkoutPedido, validarCupon, cotizarEnvio, loginBuyer, registerBuyer } from "../api/catalogoPublico";
import { useCatalogCartStore } from "../store/useCatalogCartStore";
import { useCatalogBuyerStore } from "../store/useCatalogBuyerStore";
import { useCatalogBranchStore } from "../store/useCatalogBranchStore";
import { buildWaConsultaMessage, waLink } from "../lib/buildWaMessage";
import { CatalogShell } from "../components/CatalogShell";

export default function CatalogCartCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clear, subtotal, setSlug } = useCatalogCartStore();
  const { token, comprador, setAuth, logout } = useCatalogBuyerStore();
  const { id_sucursal, setSucursal } = useCatalogBranchStore();

  const [metodo, setMetodo] = useState<"retiro" | "delivery">("retiro");
  const [distrito, setDistrito] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cupon, setCupon] = useState("");
  const [descuento, setDescuento] = useState(0);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombres, setNombres] = useState("");

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  const { data: storeData } = useQuery({
    queryKey: ["catalog-store", slug],
    queryFn: () => getStoreBySlug(slug!),
    enabled: !!slug,
  });

  const sucursales = storeData?.sucursales ?? [];
  const store = storeData?.store;
  const total = Math.max(0, subtotal() - descuento + costoEnvio);

  useEffect(() => {
    if (!id_sucursal && sucursales[0]) setSucursal(sucursales[0].id_sucursal);
  }, [sucursales, id_sucursal, setSucursal]);

  const applyCupon = async () => {
    if (!slug || !cupon.trim()) return;
    try {
      const r = await validarCupon(slug, cupon.trim(), subtotal());
      setDescuento(Number(r.descuento) || 0);
      setError(null);
    } catch (e: unknown) {
      setDescuento(0);
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cupón inválido");
    }
  };

  const quoteEnvio = async () => {
    if (!slug || !distrito.trim()) return;
    const r = await cotizarEnvio(slug, distrito.trim());
    setCostoEnvio(Number(r.costo) || 0);
  };

  const doAuth = async () => {
    if (!slug) return;
    setError(null);
    try {
      const data =
        authMode === "login"
          ? await loginBuyer(slug, { email, password })
          : await registerBuyer(slug, { email, password, nombres });
      setAuth(slug, data.token, data.comprador);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error de autenticación");
    }
  };

  const pagar = async () => {
    if (!slug || !token) {
      setError("Inicia sesión para continuar");
      return;
    }
    if (!id_sucursal) {
      setError("Selecciona una sucursal");
      return;
    }
    if (!items.length) return;
    setLoading(true);
    setError(null);
    try {
      const data = await checkoutPedido(
        slug,
        {
          id_sucursal,
          metodo_entrega: metodo,
          distrito: metodo === "delivery" ? distrito : null,
          direccion_entrega: metodo === "delivery" ? direccion : null,
          cupon_codigo: cupon || null,
          items: items.map((it) => ({
            id_producto: it.producto.codigo,
            id_sku: it.id_sku || null,
            cantidad: it.cantidad,
          })),
          idempotency_key: crypto.randomUUID(),
        },
        token
      );
      if (data?.preference?.init_point) {
        clear();
        window.location.href = data.preference.init_point;
        return;
      }
      // Sin MP: ir a resultado / WhatsApp
      clear();
      navigate(`/c/${slug}/pago/resultado?status=pending&codigo=${data?.pedido?.codigo}`);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || "No se pudo crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  const waConsult = () => {
    const msg = buildWaConsultaMessage({
      negocio: store?.nombre || storeData?.negocio?.nombre || "",
      tipo: "carrito",
    });
    const detail = items
      .map((it) => `• ${it.cantidad}x ${it.producto.descripcion}`)
      .join("\n");
    const link = waLink(store?.telefono || storeData?.negocio?.telefono, `${msg}\n${detail}\nTotal: S/ ${total.toFixed(2)}`);
    if (link) window.open(link, "_blank");
  };

  return (
    <CatalogShell>
      <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Carrito</h1>
            <Link to={`/c/${slug}`} className="text-sm underline text-stone-500">
              Seguir comprando
            </Link>
          </div>

          {!items.length && (
            <p className="text-stone-500 py-12 text-center">Tu carrito está vacío</p>
          )}

          <ul className="space-y-3">
            {items.map((it) => (
              <li
                key={`${it.producto.codigo}-${it.id_sku ?? 0}`}
                className="flex gap-3 rounded-xl border border-stone-200 p-3"
              >
                <div className="size-20 rounded-lg bg-stone-100 overflow-hidden shrink-0">
                  {(it.producto.images?.[0] || it.producto.imagen_url) && (
                    <img
                      src={it.producto.images?.[0] || it.producto.imagen_url!}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-2">{it.producto.descripcion}</p>
                  {it.attrs && (
                    <p className="text-xs text-stone-400 mt-0.5">{Object.values(it.attrs).join(" · ")}</p>
                  )}
                  <p className="text-sm font-bold mt-1">
                    S/ {((it.precio_unitario ?? it.producto.precio) * it.cantidad).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min={1}
                      value={it.cantidad}
                      onChange={(e) =>
                        updateQty(it.producto.codigo, it.id_sku, Number(e.target.value) || 1)
                      }
                      className="w-16 h-8 border border-stone-200 rounded-md px-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(it.producto.codigo, it.id_sku)}
                      className="text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {!token ? (
            <div className="rounded-2xl border border-stone-200 p-4 space-y-3">
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  className={authMode === "login" ? "font-bold" : "text-stone-400"}
                  onClick={() => setAuthMode("login")}
                >
                  Iniciar sesión
                </button>
                <span>·</span>
                <button
                  type="button"
                  className={authMode === "register" ? "font-bold" : "text-stone-400"}
                  onClick={() => setAuthMode("register")}
                >
                  Crear cuenta
                </button>
              </div>
              {authMode === "register" && (
                <input
                  placeholder="Nombres"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  className="w-full h-10 border border-stone-200 rounded-lg px-3 text-sm"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 border border-stone-200 rounded-lg px-3 text-sm"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 border border-stone-200 rounded-lg px-3 text-sm"
              />
              <button
                type="button"
                onClick={doAuth}
                className="w-full h-10 rounded-full bg-stone-900 text-white text-sm font-semibold"
              >
                Continuar
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 p-3 text-sm flex justify-between">
              <span>
                Hola, <strong>{comprador?.nombres}</strong>
              </span>
              <button type="button" className="underline text-stone-500" onClick={logout}>
                Salir
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-stone-200 p-4 space-y-3">
            <h2 className="font-semibold text-sm">Entrega</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMetodo("retiro")}
                className={`flex-1 h-10 rounded-full text-sm font-medium border ${metodo === "retiro" ? "bg-stone-900 text-white border-stone-900" : "border-stone-200"}`}
              >
                Retiro en tienda
              </button>
              <button
                type="button"
                onClick={() => setMetodo("delivery")}
                className={`flex-1 h-10 rounded-full text-sm font-medium border ${metodo === "delivery" ? "bg-stone-900 text-white border-stone-900" : "border-stone-200"}`}
              >
                Delivery
              </button>
            </div>

            <select
              value={id_sucursal ?? ""}
              onChange={(e) => setSucursal(Number(e.target.value))}
              className="w-full h-10 border border-stone-200 rounded-lg px-3 text-sm"
            >
              <option value="">Sucursal</option>
              {sucursales.map((s) => (
                <option key={s.id_sucursal} value={s.id_sucursal}>
                  {s.nombre}
                </option>
              ))}
            </select>

            {metodo === "delivery" && (
              <>
                <input
                  placeholder="Distrito"
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  onBlur={quoteEnvio}
                  className="w-full h-10 border border-stone-200 rounded-lg px-3 text-sm"
                />
                <input
                  placeholder="Dirección"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full h-10 border border-stone-200 rounded-lg px-3 text-sm"
                />
              </>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-stone-200 p-5 h-fit space-y-3 sticky top-4">
          <h2 className="font-semibold">Resumen</h2>
          <div className="flex gap-2">
            <input
              value={cupon}
              onChange={(e) => setCupon(e.target.value)}
              placeholder="Cupón"
              className="flex-1 h-9 border border-stone-200 rounded-lg px-2 text-sm"
            />
            <button type="button" onClick={applyCupon} className="text-sm font-semibold px-3">
              Aplicar
            </button>
          </div>
          <div className="text-sm space-y-1 border-t border-stone-100 pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>S/ {subtotal().toFixed(2)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Descuento</span>
                <span>-S/ {descuento.toFixed(2)}</span>
              </div>
            )}
            {costoEnvio > 0 && (
              <div className="flex justify-between">
                <span>Envío</span>
                <span>S/ {costoEnvio.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="button"
            disabled={!items.length || loading}
            onClick={pagar}
            className="w-full h-11 rounded-full bg-stone-900 text-white text-sm font-semibold disabled:opacity-40"
          >
            {loading
              ? "Procesando…"
              : store?.mp_conectado
                ? "Pagar con Mercado Pago"
                : "Confirmar pedido"}
          </button>

          <button
            type="button"
            onClick={waConsult}
            className="w-full h-10 rounded-full bg-emerald-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="size-4" /> Consultar por WhatsApp
          </button>

          {!store?.checkout_habilitado && (
            <p className="text-[11px] text-amber-700">Checkout web deshabilitado — usa WhatsApp.</p>
          )}
        </aside>
      </div>
    </CatalogShell>
  );
}
