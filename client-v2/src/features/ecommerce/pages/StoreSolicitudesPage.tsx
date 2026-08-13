import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buyerCancelarSolicitud, buyerListSolicitudes } from "../api/ecommerce";
import { comprarSolicitudAlCarrito } from "../utils/comprarSolicitudAlCarrito";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Solicitud = {
  id_solicitud: number;
  codigo: string;
  estado: string;
  producto_nombre?: string;
  sucursal_nombre?: string;
  cantidad_solicitada: number;
  cantidad_aprobada?: number | null;
  attrs_json?: Record<string, unknown>;
  expires_at?: string | null;
  comentario_cliente?: string | null;
  id_producto: number;
};

const TONE: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-900",
  en_revision: "bg-sky-100 text-sky-900",
  aprobada: "bg-emerald-100 text-emerald-900",
  rechazada: "bg-red-100 text-red-800",
  expirada: "bg-stone-100 text-stone-600",
  cancelada: "bg-stone-200 text-stone-700",
};

function expiresLabel(iso?: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const ms = t - Date.now();
  if (ms <= 0) return "Expiró";
  const m = Math.ceil(ms / 60000);
  if (m < 60) return `Expira en ${m} min`;
  const h = Math.floor(m / 60);
  return `Expira en ${h} h ${m % 60} min`;
}

export default function StoreSolicitudesPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const listQ = useQuery({
    queryKey: ["buyer-solicitudes", slug],
    queryFn: () => buyerListSolicitudes(slug),
    enabled: Boolean(slug),
  });
  const rows = (listQ.data?.data || []) as Solicitud[];

  const cancelMut = useMutation({
    mutationFn: (id: number) => buyerCancelarSolicitud(slug, id),
    onSuccess: () => {
      toast.success("Solicitud cancelada");
      qc.invalidateQueries({ queryKey: ["buyer-solicitudes", slug] });
      qc.invalidateQueries({ queryKey: ["buyer-notif-unread", slug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const comprarMut = useMutation({
    mutationFn: (id: number) => comprarSolicitudAlCarrito(slug, id),
    onSuccess: (res) => {
      toast.success(res.alreadyInCart ? "Ya está en tu carrito" : "Listo para comprar");
      navigate(`/tienda/${slug}/carrito`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Solicitudes de disponibilidad</h2>
        <p className="text-sm store-muted">Aquí ves el estado de tus confirmaciones. No son pedidos.</p>
      </div>
      {listQ.isLoading && <p className="text-sm store-muted">Cargando…</p>}
      {!listQ.isLoading && rows.length === 0 && (
        <div className="vitrina-card p-6 text-sm store-muted">Aún no tienes solicitudes.</div>
      )}
      <div className="space-y-3">
        {rows.map((s) => {
          const exp = expiresLabel(s.expires_at);
          const vigente =
            s.estado === "aprobada" && (!s.expires_at || new Date(s.expires_at).getTime() > Date.now());
          return (
            <div key={s.id_solicitud} className="vitrina-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", TONE[s.estado])}>
                  {s.estado.replace("_", " ")}
                </span>
                <span className="text-xs font-mono store-muted">#{s.codigo}</span>
              </div>
              <div className="font-medium">{s.producto_nombre}</div>
              <ul className="text-sm store-muted space-y-0.5">
                {s.attrs_json &&
                  Object.entries(s.attrs_json).map(([k, v]) => (
                    <li key={k}>
                      {k}: {String(v)}
                    </li>
                  ))}
                <li>
                  Cantidad: {s.cantidad_aprobada || s.cantidad_solicitada}
                  {s.sucursal_nombre ? ` · ${s.sucursal_nombre}` : ""}
                </li>
              </ul>
              {vigente && (
                <p className="text-sm text-emerald-800">
                  Stock confirmado. Puedes continuar con tu compra
                  {exp ? ` · ${exp}` : s.expires_at ? ` antes de ${new Date(s.expires_at).toLocaleString()}` : ""}.
                </p>
              )}
              {s.estado === "aprobada" && !vigente && (
                <p className="text-sm store-muted">Esta confirmación expiró.</p>
              )}
              {s.estado === "rechazada" && s.comentario_cliente && (
                <p className="text-sm text-red-800">{s.comentario_cliente}</p>
              )}
              {s.estado === "expirada" && (
                <p className="text-sm store-muted">Esta confirmación expiró.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {vigente && (
                  <Button
                    size="sm"
                    onClick={() => comprarMut.mutate(s.id_solicitud)}
                    disabled={comprarMut.isPending}
                  >
                    Ir a comprar
                  </Button>
                )}
                {(s.estado === "pendiente" || s.estado === "en_revision") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelMut.mutate(s.id_solicitud)}
                    disabled={cancelMut.isPending}
                  >
                    Cancelar
                  </Button>
                )}
                {(s.estado === "expirada" || s.estado === "rechazada" || (s.estado === "aprobada" && !vigente)) && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/tienda/${slug}/producto/${s.id_producto}`}>Solicitar nuevamente</Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
