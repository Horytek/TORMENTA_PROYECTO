import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Wallet,
  AlertTriangle,
  Store,
  Settings,
  CreditCard,
  CheckCircle2,
  Circle,
  MapPin,
  ExternalLink,
  Tags,
  PackageCheck,
  ScanLine,
  MessageCircle,
} from "lucide-react";
import { ecommerceDashboard, ecommerceMe, adminInventarioResumen, pickupDashboardKpis, adminEntregaKpis, adminDisponibilidadStats } from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";

export default function EcommerceDashboardPage() {
  const user = useEcommerceAuthStore((s) => s.user);
  const tid = user?.id_tienda;
  const { data, isLoading } = useQuery({
    queryKey: ["ecom-dashboard", tid],
    queryFn: ecommerceDashboard,
    enabled: Boolean(tid),
  });
  const meQ = useQuery({
    queryKey: ["ecom-me", tid],
    queryFn: ecommerceMe,
    enabled: Boolean(tid),
  });
  const invQ = useQuery({
    queryKey: ["ecom-inv-resumen", tid],
    queryFn: adminInventarioResumen,
    enabled: Boolean(tid),
  });
  const pickupQ = useQuery({
    queryKey: ["ecom-pickup-kpis", tid],
    queryFn: pickupDashboardKpis,
    enabled: Boolean(tid),
  });
  const entregaKpiQ = useQuery({
    queryKey: ["ecom-entrega-kpis", tid],
    queryFn: adminEntregaKpis,
    enabled: Boolean(tid),
  });
  const dispQ = useQuery({
    queryKey: ["ecom-disp-stats", tid],
    queryFn: adminDisponibilidadStats,
    enabled: Boolean(tid),
  });
  const stats = data?.data?.stats;
  const recientes = data?.data?.recientes || [];
  const tienda = meQ.data?.data?.tienda;
  const mp = Boolean(meQ.data?.data?.mp_conectado);

  const checklist = [
    {
      ok: Boolean(tienda?.logo_url),
      label: "Logo de tienda",
      to: "/ecommerce-admin/configuracion",
    },
    {
      ok: Number(stats?.productos || 0) > 0,
      label: "Al menos 1 producto",
      to: "/ecommerce-admin/productos",
    },
    {
      ok: mp,
      label: "Mercado Pago conectado",
      to: "/ecommerce-admin/configuracion",
    },
    {
      ok: Boolean(tienda?.theme_json),
      label: "Tema / vitrina configurada",
      to: "/ecommerce-admin/configuracion",
    },
    {
      ok: Number(invQ.data?.data?.agotados ?? 0) === 0,
      label: "Inventario multisucursal OK",
      to: "/ecommerce-admin/inventario",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-stone-500 text-sm mt-1">
            {tienda?.nombre || user?.tienda || "Tu tienda"} · resumen operativo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.slug && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/tienda/${user.slug}`} target="_blank">
                <ExternalLink className="size-3.5 mr-1" />
                Ver vitrina
              </Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link to="/ecommerce-admin/productos">
              <Package className="size-3.5 mr-1" />
              Nuevo producto
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Productos", value: stats?.productos ?? 0, icon: Package, to: "/ecommerce-admin/productos" },
            {
              label: "Órdenes",
              value: stats?.ordenes_aprobadas ?? 0,
              icon: ShoppingBag,
              to: "/ecommerce-admin/ordenes",
            },
            {
              label: "Ventas",
              value: `S/ ${Number(stats?.ventas || 0).toFixed(2)}`,
              icon: Wallet,
              to: "/ecommerce-admin/ordenes",
            },
            {
              label: "Stock bajo",
              value: stats?.stock_bajo ?? 0,
              icon: AlertTriangle,
              to: "/ecommerce-admin/productos",
            },
            {
              label: "Consultas WA",
              value: dispQ.data?.data?.total ?? 0,
              icon: MessageCircle,
              to: "/ecommerce-admin/configuracion",
            },
          ].map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="rounded-xl border border-stone-200 bg-white p-4 hover:border-teal-600/40 transition"
            >
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wider text-stone-400">{c.label}</div>
                <c.icon className="size-4 text-stone-300" />
              </div>
              <div className="text-xl font-semibold mt-1">{c.value}</div>
            </Link>
          ))}
        </div>
      )}

      {pickupQ.data?.data && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-sm font-semibold text-stone-700">Retiro en tienda</h2>
            <Link
              to="/ecommerce-admin/validar-retiro"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900"
            >
              <ScanLine className="size-3.5" />
              Abrir recojos
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              {
                label: "Por preparar",
                value: pickupQ.data.data.pago_confirmado ?? 0,
                icon: PackageCheck,
                to: "/ecommerce-admin/pedidos-retiro",
              },
              {
                label: "Preparando",
                value: pickupQ.data.data.preparando ?? 0,
                icon: PackageCheck,
                to: "/ecommerce-admin/pedidos-retiro",
              },
              {
                label: "Listos retiro",
                value: pickupQ.data.data.listos_retiro ?? 0,
                icon: ScanLine,
                to: "/ecommerce-admin/validar-retiro",
              },
              {
                label: "Entregados hoy",
                value: pickupQ.data.data.entregados_hoy ?? 0,
                icon: ShoppingBag,
                to: "/ecommerce-admin/pedidos-retiro",
              },
              {
                label: "Activos",
                value: pickupQ.data.data.activos ?? 0,
                icon: PackageCheck,
                to: "/ecommerce-admin/pedidos-retiro",
              },
            ].map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="rounded-xl border border-stone-200 bg-white p-4 hover:border-teal-600/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wider text-stone-400">{c.label}</div>
                  <c.icon className="size-4 text-stone-300" />
                </div>
                <div className="text-xl font-semibold mt-1">{c.value}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {entregaKpiQ.data?.data && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-sm font-semibold text-stone-700">Métodos de entrega</h2>
            <Link
              to="/ecommerce-admin/entregas"
              className="text-xs font-medium text-teal-700 hover:text-teal-900"
            >
              Configurar
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Pedidos retiro",
                value: entregaKpiQ.data.data.pickup_total ?? 0,
                to: "/ecommerce-admin/pedidos-retiro?fulfillment=pickup",
              },
              {
                label: "Pedidos delivery",
                value: entregaKpiQ.data.data.delivery_total ?? 0,
                to: "/ecommerce-admin/pedidos-retiro",
              },
              {
                label: "Pedidos provincia",
                value: entregaKpiQ.data.data.provincia_total ?? 0,
                to: "/ecommerce-admin/pedidos-retiro",
              },
              {
                label: "Envío cobrado hoy",
                value: Number(entregaKpiQ.data.data.costo_envio_hoy || 0).toFixed(2),
                to: "/ecommerce-admin/entregas",
              },
            ].map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="rounded-xl border border-stone-200 bg-white p-4 hover:border-teal-600/40 transition"
              >
                <div className="text-[11px] uppercase tracking-wider text-stone-400">{c.label}</div>
                <div className="text-xl font-semibold mt-1">{c.value}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {invQ.data?.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Agotados (sucursal)", value: invQ.data.data.agotados ?? 0, to: "/ecommerce-admin/inventario" },
            { label: "Stock bajo sucursal", value: invQ.data.data.stock_bajo ?? 0, to: "/ecommerce-admin/inventario" },
            { label: "Reservado", value: invQ.data.data.reservado_total ?? 0, to: "/ecommerce-admin/inventario" },
            { label: "Transf. pendientes", value: invQ.data.data.transferencias_pendientes ?? 0, to: "/ecommerce-admin/transferencias" },
          ].map((c) => (
            <Link key={c.label} to={c.to} className="rounded-xl border border-stone-200 bg-white p-4 hover:border-teal-600/40">
              <div className="text-[11px] uppercase tracking-wider text-stone-400 flex items-center gap-1">
                <MapPin className="size-3" /> {c.label}
              </div>
              <div className="text-xl font-semibold mt-1">{c.value}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Store className="size-4" /> Checklist de lanzamiento
          </h2>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="flex items-center gap-2 text-sm py-2 px-2 rounded-lg hover:bg-stone-50"
                >
                  {item.ok ? (
                    <CheckCircle2 className="size-4 text-teal-600 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-stone-300 shrink-0" />
                  )}
                  <span className={item.ok ? "text-stone-600" : "text-stone-800 font-medium"}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium text-sm mb-3">Acciones rápidas</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: "/ecommerce-admin/productos", label: "Productos", icon: Package },
              { to: "/ecommerce-admin/atributos", label: "Atributos", icon: Tags },
              { to: "/ecommerce-admin/ordenes", label: "Órdenes", icon: ShoppingBag },
              { to: "/ecommerce-admin/configuracion", label: "Configuración", icon: Settings },
              { to: "/ecommerce-admin/configuracion", label: "Mercado Pago", icon: CreditCard },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex items-center gap-2 rounded-lg border border-stone-100 px-3 py-3 text-sm hover:bg-stone-50"
              >
                <a.icon className="size-4 text-stone-400" />
                {a.label}
              </Link>
            ))}
          </div>
          {tienda?.slug && (
            <p className="mt-4 text-xs text-stone-400">
              Storefront:{" "}
              <Link className="text-teal-700 hover:underline" to={`/tienda/${tienda.slug}`} target="_blank">
                /tienda/{tienda.slug}
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="px-4 py-3 border-b border-stone-100 flex justify-between items-center">
          <h2 className="font-medium text-sm">Órdenes recientes</h2>
          <Link to="/ecommerce-admin/ordenes" className="text-xs text-teal-700 hover:underline">
            Ver todas
          </Link>
        </div>
        <ul className="divide-y divide-stone-100">
          {recientes.length === 0 && (
            <li className="px-4 py-10 text-center">
              <ShoppingBag className="size-8 mx-auto text-stone-200 mb-2" />
              <p className="text-sm text-stone-400">Aún no hay órdenes.</p>
              <p className="text-xs text-stone-400 mt-1">Cuando vendan por la vitrina aparecerán aquí.</p>
            </li>
          )}
          {recientes.map(
            (o: {
              id_orden: number;
              codigo: string;
              estado: string;
              total: number;
              email_comprador?: string;
              created_at?: string;
            }) => (
              <li key={o.id_orden} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium font-mono text-sm truncate">{o.codigo}</p>
                    {o.email_comprador && (
                      <p className="text-xs text-stone-500 truncate mt-0.5">{o.email_comprador}</p>
                    )}
                    {o.created_at && (
                      <p className="text-[11px] text-stone-400 mt-1">
                        {new Date(o.created_at).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <p className="text-sm font-semibold tabular-nums">
                      S/ {Number(o.total).toFixed(2)}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                        o.estado === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : o.estado === "pending"
                            ? "bg-amber-50 text-amber-800"
                            : o.estado === "rejected" || o.estado === "cancelled"
                              ? "bg-red-50 text-red-700"
                              : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {o.estado === "approved"
                        ? "Aprobado"
                        : o.estado === "pending"
                          ? "Pendiente"
                          : o.estado === "rejected"
                            ? "Rechazado"
                            : o.estado === "cancelled"
                              ? "Cancelado"
                              : o.estado}
                    </span>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}
