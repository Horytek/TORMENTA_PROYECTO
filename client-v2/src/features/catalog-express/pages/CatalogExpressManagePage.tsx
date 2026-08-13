import { useEffect, useState } from "react";
import { ExternalLink, MessageCircle, QrCode, Save, Store } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetTiendaConfig,
  adminPatchTiendaConfig,
  adminListPedidos,
  adminUpdatePedidoEstado,
  adminValidarPickup,
  adminCupones,
  adminSaveCupon,
  adminEntrega,
  adminSaveEntrega,
  adminBanners,
  adminSaveBanner,
  adminResenas,
  adminModerarResena,
} from "../api/catalogoPublico";
import { CatalogoSettingsCard } from "../components/CatalogoSettingsCard";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@/components/ui/button";

export const CatalogExpressManagePage = () => {
  const id_tenant = useUserStore((state) => state.id_tenant || state.user?.id_tenant);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"config" | "pedidos" | "cupones" | "entrega" | "banners" | "resenas" | "pickup">("config");
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [pickupToken, setPickupToken] = useState("");
  const [cuponForm, setCuponForm] = useState({ codigo: "", tipo: "porcentaje", valor: 10 });
  const [bannerForm, setBannerForm] = useState({ titulo: "", subtitulo: "", imagen_url: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const { data: cfg } = useQuery({
    queryKey: ["tienda-admin-config"],
    queryFn: adminGetTiendaConfig,
  });

  useEffect(() => {
    if (cfg) {
      setForm({
        activo: cfg.activo,
        slug: cfg.slug,
        nombre_publico: cfg.nombre_publico || "",
        whatsapp: cfg.whatsapp || "",
        checkout_habilitado: cfg.checkout_habilitado,
        emitir_cpe: cfg.emitir_cpe,
        stock_bajo_umbral: cfg.stock_bajo_umbral,
        mensaje_bienvenida: cfg.mensaje_bienvenida || "",
        mp_public_key: cfg.mp_public_key || "",
        mp_access_token: "",
        mp_modo: cfg.mp_modo || "test",
      });
    }
  }, [cfg]);

  const saveMut = useMutation({
    mutationFn: () => adminPatchTiendaConfig(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tienda-admin-config"] });
      setMsg("Configuración guardada");
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      setMsg(e.response?.data?.message || "Error al guardar"),
  });

  const { data: pedidos } = useQuery({
    queryKey: ["tienda-admin-pedidos"],
    queryFn: () => adminListPedidos(),
    enabled: tab === "pedidos",
  });

  const { data: cupones } = useQuery({
    queryKey: ["tienda-admin-cupones"],
    queryFn: adminCupones,
    enabled: tab === "cupones",
  });

  const { data: entrega } = useQuery({
    queryKey: ["tienda-admin-entrega"],
    queryFn: adminEntrega,
    enabled: tab === "entrega",
  });

  const { data: banners } = useQuery({
    queryKey: ["tienda-admin-banners"],
    queryFn: adminBanners,
    enabled: tab === "banners",
  });

  const { data: resenas } = useQuery({
    queryKey: ["tienda-admin-resenas"],
    queryFn: adminResenas,
    enabled: tab === "resenas",
  });

  const publicUrl = cfg?.slug
    ? `${window.location.origin}/c/${cfg.slug}`
    : `${window.location.origin}/catalogo/${id_tenant || 1}`;

  const tabs = [
    ["config", "Configuración"],
    ["pedidos", "Pedidos"],
    ["cupones", "Cupones"],
    ["entrega", "Entrega"],
    ["banners", "Banners"],
    ["resenas", "Reseñas"],
    ["pickup", "Validar retiro"],
  ] as const;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Store className="size-3.5" />
            Tienda ERP
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Tienda integrada
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 max-w-xl leading-relaxed">
            Catálogo público conectado al inventario, sucursales y ventas del ERP. Checkout web con
            Mercado Pago y WhatsApp como canal de consulta.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => window.open(publicUrl, "_blank")}
        >
          <ExternalLink className="size-4" /> Abrir tienda
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-stone-200 pb-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
              tab === id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">{msg}</p>}

      {tab === "config" && (
        <div className="space-y-4">
          <CatalogoSettingsCard />
          <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
            <h3 className="font-semibold text-sm">Configuración de tienda</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.activo)}
                onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked ? 1 : 0 }))}
              />
              Tienda activa (slug público)
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="h-10 border border-stone-200 rounded-lg px-3 text-sm"
                placeholder="Slug (ej. mi-tienda)"
                value={String(form.slug || "")}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
              <input
                className="h-10 border border-stone-200 rounded-lg px-3 text-sm"
                placeholder="WhatsApp"
                value={String(form.whatsapp || "")}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
              <input
                className="h-10 border border-stone-200 rounded-lg px-3 text-sm"
                placeholder="Nombre público"
                value={String(form.nombre_publico || "")}
                onChange={(e) => setForm((f) => ({ ...f, nombre_publico: e.target.value }))}
              />
              <input
                className="h-10 border border-stone-200 rounded-lg px-3 text-sm"
                type="number"
                placeholder="Umbral stock bajo"
                value={Number(form.stock_bajo_umbral ?? 5)}
                onChange={(e) => setForm((f) => ({ ...f, stock_bajo_umbral: Number(e.target.value) }))}
              />
            </div>
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="Mensaje de bienvenida"
              value={String(form.mensaje_bienvenida || "")}
              onChange={(e) => setForm((f) => ({ ...f, mensaje_bienvenida: e.target.value }))}
            />
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.checkout_habilitado)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, checkout_habilitado: e.target.checked ? 1 : 0 }))
                  }
                />
                Checkout web
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.emitir_cpe)}
                  onChange={(e) => setForm((f) => ({ ...f, emitir_cpe: e.target.checked ? 1 : 0 }))}
                />
                Emitir CPE automático (off por defecto)
              </label>
            </div>
            <div className="border-t border-stone-100 pt-4 space-y-2">
              <p className="text-xs font-semibold uppercase text-stone-500">Mercado Pago</p>
              <p className="text-xs text-stone-400">
                {cfg?.mp_conectado ? "Credenciales conectadas" : "Sin credenciales"}
              </p>
              <input
                className="w-full h-10 border border-stone-200 rounded-lg px-3 text-sm"
                placeholder="Public key"
                value={String(form.mp_public_key || "")}
                onChange={(e) => setForm((f) => ({ ...f, mp_public_key: e.target.value }))}
              />
              <input
                className="w-full h-10 border border-stone-200 rounded-lg px-3 text-sm"
                placeholder="Access token (solo al actualizar)"
                value={String(form.mp_access_token || "")}
                onChange={(e) => setForm((f) => ({ ...f, mp_access_token: e.target.value }))}
              />
              <select
                className="h-10 border border-stone-200 rounded-lg px-3 text-sm"
                value={String(form.mp_modo || "test")}
                onChange={(e) => setForm((f) => ({ ...f, mp_modo: e.target.value }))}
              >
                <option value="test">Test / Sandbox</option>
                <option value="prod">Producción</option>
              </select>
            </div>
            <Button onClick={() => saveMut.mutate()} className="gap-1.5" disabled={saveMut.isPending}>
              <Save className="size-4" /> Guardar
            </Button>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/80">
              <h3 className="text-sm font-semibold">Vista previa</h3>
              <span className="text-[11px] text-stone-400 font-mono">{publicUrl}</span>
            </div>
            <div className="bg-stone-100/80 p-3">
              <iframe
                src={publicUrl}
                className="w-full h-[min(70vh,640px)] rounded-xl border border-stone-200 bg-white"
                title="Vista previa"
              />
            </div>
          </div>
        </div>
      )}

      {tab === "pedidos" && (
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs text-stone-500">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(pedidos || []).map(
                (p: { id_pedido: number; codigo: string; estado: string; total: number }) => (
                  <tr key={p.id_pedido} className="border-t border-stone-100">
                    <td className="px-3 py-2 font-mono text-xs">{p.codigo}</td>
                    <td className="px-3 py-2">{p.estado}</td>
                    <td className="px-3 py-2">S/ {Number(p.total).toFixed(2)}</td>
                    <td className="px-3 py-2 space-x-1">
                      {["preparando", "listo_retiro", "enviado", "entregado"].map((st) => (
                        <button
                          key={st}
                          type="button"
                          className="text-[10px] px-2 py-0.5 rounded-full border border-stone-200"
                          onClick={async () => {
                            await adminUpdatePedidoEstado(p.id_pedido, st);
                            qc.invalidateQueries({ queryKey: ["tienda-admin-pedidos"] });
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "cupones" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              className="h-10 border rounded-lg px-3 text-sm"
              placeholder="Código"
              value={cuponForm.codigo}
              onChange={(e) => setCuponForm((f) => ({ ...f, codigo: e.target.value }))}
            />
            <select
              className="h-10 border rounded-lg px-3 text-sm"
              value={cuponForm.tipo}
              onChange={(e) => setCuponForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              <option value="porcentaje">%</option>
              <option value="monto">Monto</option>
            </select>
            <input
              type="number"
              className="h-10 border rounded-lg px-3 text-sm w-24"
              value={cuponForm.valor}
              onChange={(e) => setCuponForm((f) => ({ ...f, valor: Number(e.target.value) }))}
            />
            <Button
              size="sm"
              onClick={async () => {
                await adminSaveCupon(cuponForm);
                qc.invalidateQueries({ queryKey: ["tienda-admin-cupones"] });
                setCuponForm({ codigo: "", tipo: "porcentaje", valor: 10 });
              }}
            >
              Crear
            </Button>
          </div>
          <ul className="text-sm space-y-1">
            {(cupones || []).map(
              (c: { id_cupon: number; codigo: string; tipo: string; valor: number; activo: number }) => (
                <li key={c.id_cupon} className="border border-stone-200 rounded-lg px-3 py-2 flex justify-between">
                  <span className="font-mono font-semibold">{c.codigo}</span>
                  <span>
                    {c.tipo === "porcentaje" ? `${c.valor}%` : `S/ ${c.valor}`} ·{" "}
                    {c.activo ? "activo" : "off"}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {tab === "entrega" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              defaultChecked={Number(entrega?.config?.retiro_activo ?? 1) === 1}
              onChange={async (e) => {
                await adminSaveEntrega({
                  config: {
                    ...(entrega?.config || {}),
                    retiro_activo: e.target.checked,
                    delivery_activo: Number(entrega?.config?.delivery_activo) === 1,
                    costo_default: Number(entrega?.config?.costo_default) || 0,
                  },
                });
                qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] });
              }}
            />
            Retiro en tienda
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              defaultChecked={Number(entrega?.config?.delivery_activo) === 1}
              onChange={async (e) => {
                await adminSaveEntrega({
                  config: {
                    ...(entrega?.config || {}),
                    retiro_activo: Number(entrega?.config?.retiro_activo ?? 1) === 1,
                    delivery_activo: e.target.checked,
                    costo_default: Number(entrega?.config?.costo_default) || 0,
                  },
                });
                qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] });
              }}
            />
            Delivery
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const nombre = prompt("Nombre de zona");
              const distritos = prompt("Distritos (separados por coma)");
              const costo = prompt("Costo");
              if (!nombre) return;
              await adminSaveEntrega({
                zona: {
                  nombre,
                  distritos: (distritos || "").split(",").map((d) => d.trim()).filter(Boolean),
                  costo: Number(costo) || 0,
                },
              });
              qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] });
            }}
          >
            Agregar zona
          </Button>
          <ul className="text-sm space-y-1">
            {(entrega?.zonas || []).map(
              (z: { id_zona: number; nombre: string; costo: number }) => (
                <li key={z.id_zona} className="border rounded-lg px-3 py-2 flex justify-between">
                  <span>{z.nombre}</span>
                  <span>S/ {Number(z.costo).toFixed(2)}</span>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {tab === "banners" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              className="h-10 border rounded-lg px-3 text-sm"
              placeholder="Título"
              value={bannerForm.titulo}
              onChange={(e) => setBannerForm((f) => ({ ...f, titulo: e.target.value }))}
            />
            <input
              className="h-10 border rounded-lg px-3 text-sm"
              placeholder="Subtítulo"
              value={bannerForm.subtitulo}
              onChange={(e) => setBannerForm((f) => ({ ...f, subtitulo: e.target.value }))}
            />
            <Button
              size="sm"
              onClick={async () => {
                await adminSaveBanner(bannerForm);
                qc.invalidateQueries({ queryKey: ["tienda-admin-banners"] });
                setBannerForm({ titulo: "", subtitulo: "", imagen_url: "" });
              }}
            >
              Crear banner
            </Button>
          </div>
          <ul className="text-sm space-y-1">
            {(banners || []).map((b: { id_banner: number; titulo: string }) => (
              <li key={b.id_banner} className="border rounded-lg px-3 py-2">
                {b.titulo}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "resenas" && (
        <ul className="space-y-2">
          {(resenas || []).map(
            (r: {
              id_resena: number;
              producto: string;
              nombres: string;
              rating: number;
              cuerpo: string;
              estado: string;
            }) => (
              <li key={r.id_resena} className="border rounded-xl p-3 text-sm space-y-2">
                <p className="font-semibold">
                  {r.producto} · {"★".repeat(r.rating)} · {r.estado}
                </p>
                <p className="text-stone-600">{r.nombres}: {r.cuerpo}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminModerarResena(r.id_resena, { estado: "aprobada" });
                      qc.invalidateQueries({ queryKey: ["tienda-admin-resenas"] });
                    }}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await adminModerarResena(r.id_resena, { estado: "rechazada" });
                      qc.invalidateQueries({ queryKey: ["tienda-admin-resenas"] });
                    }}
                  >
                    Rechazar
                  </Button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {tab === "pickup" && (
        <div className="rounded-2xl border border-stone-200 p-5 space-y-3 max-w-md">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <QrCode className="size-4" /> Validar retiro
          </div>
          <input
            className="w-full h-10 border rounded-lg px-3 text-sm font-mono"
            placeholder="Token QR del pedido"
            value={pickupToken}
            onChange={(e) => setPickupToken(e.target.value)}
          />
          <Button
            onClick={async () => {
              try {
                const r = await adminValidarPickup(pickupToken);
                setMsg(`Entregado: ${r.codigo}`);
              } catch {
                setMsg("QR inválido");
              }
            }}
          >
            Confirmar entrega
          </Button>
          <p className="text-xs text-stone-400 flex items-center gap-1">
            <MessageCircle className="size-3" /> El comprador ve el QR en el detalle del pedido.
          </p>
        </div>
      )}
    </div>
  );
};

export default CatalogExpressManagePage;
