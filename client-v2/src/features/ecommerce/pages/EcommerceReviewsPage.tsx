import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquareText, Star } from "lucide-react";
import {
  adminGetReviewConfig,
  adminListReviews,
  adminPatchReviewConfig,
  adminPatchReviewEstado,
  adminReplyReview,
  adminReviewStats,
} from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReviewStars } from "../components/reviews/ReviewStars";
import { cn } from "@/lib/utils";

const TIPOS = [
  { value: "", label: "Todos los tipos" },
  { value: "producto", label: "Producto" },
  { value: "pedido", label: "Pedido" },
  { value: "sucursal", label: "Sucursal" },
  { value: "general", label: "General" },
];

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "publicada", label: "Publicadas" },
  { value: "ocultada", label: "Ocultas" },
  { value: "rechazada", label: "Rechazadas" },
];

type ReviewAdmin = {
  id_review: number;
  tipo: string;
  rating: number;
  titulo?: string | null;
  comentario?: string | null;
  estado: string;
  nombre_publico?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  producto_nombre?: string | null;
  compra_verificada?: boolean;
  created_at?: string;
  reply?: { cuerpo: string } | null;
  media?: { url: string }[];
};

export default function EcommerceReviewsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"lista" | "config">("lista");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("pendiente");
  const [q, setQ] = useState("");
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const statsQ = useQuery({
    queryKey: ["admin-review-stats"],
    queryFn: adminReviewStats,
  });
  const listQ = useQuery({
    queryKey: ["admin-reviews", tipo, estado, q],
    queryFn: () =>
      adminListReviews({
        tipo: tipo || undefined,
        estado: estado || undefined,
        q: q.trim() || undefined,
      }),
  });
  const configQ = useQuery({
    queryKey: ["admin-review-config"],
    queryFn: adminGetReviewConfig,
  });

  const patchEstado = useMutation({
    mutationFn: ({ id, estado: e }: { id: number; estado: string }) =>
      adminPatchReviewEstado(id, e),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["admin-review-stats"] });
    },
    onError: () => toast.error("No se pudo actualizar"),
  });

  const replyMut = useMutation({
    mutationFn: ({ id, cuerpo }: { id: number; cuerpo: string }) =>
      adminReplyReview(id, cuerpo),
    onSuccess: () => {
      toast.success("Respuesta publicada");
      setReplyFor(null);
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Error al responder";
      toast.error(msg);
    },
  });

  const configMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminPatchReviewConfig(body),
    onSuccess: () => {
      toast.success("Configuración guardada");
      qc.invalidateQueries({ queryKey: ["admin-review-config"] });
    },
    onError: () => toast.error("No se pudo guardar"),
  });

  const stats = statsQ.data?.data;
  const reviews = (listQ.data?.data || []) as ReviewAdmin[];
  const config = configQ.data?.data;

  const kpis = useMemo(
    () => [
      { label: "Promedio", value: stats?.promedio?.toFixed?.(1) ?? "—" },
      { label: "Pendientes", value: stats?.pendientes ?? 0 },
      { label: "Publicadas", value: stats?.publicadas ?? 0 },
      { label: "Total", value: stats?.total ?? 0 },
    ],
    [stats]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MessageSquareText className="size-6" /> Reseñas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modera opiniones, responde y configura el módulo.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1 bg-muted/40">
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md",
              tab === "lista" && "bg-background shadow-sm font-medium"
            )}
            onClick={() => setTab("lista")}
          >
            Lista
          </button>
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md",
              tab === "config" && "bg-background shadow-sm font-medium"
            )}
            onClick={() => setTab("config")}
          >
            Configuración
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{k.value}</p>
          </div>
        ))}
      </div>

      {tab === "lista" && (
        <>
          {(stats?.top_productos?.length > 0 || stats?.bottom_productos?.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 space-y-2">
                <p className="text-sm font-medium">Top productos</p>
                <ul className="text-sm space-y-1">
                  {(stats?.top_productos || []).map(
                    (p: { id_producto: number; nombre: string; promedio: number; n: number }) => (
                      <li key={p.id_producto} className="flex justify-between gap-2">
                        <span className="truncate">{p.nombre}</span>
                        <span className="tabular-nums text-muted-foreground shrink-0">
                          {p.promedio}★ · {p.n}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="rounded-xl border p-4 space-y-2">
                <p className="text-sm font-medium">Peor valorados</p>
                <ul className="text-sm space-y-1">
                  {(stats?.bottom_productos || []).map(
                    (p: { id_producto: number; nombre: string; promedio: number; n: number }) => (
                      <li key={p.id_producto} className="flex justify-between gap-2">
                        <span className="truncate">{p.nombre}</span>
                        <span className="tabular-nums text-muted-foreground shrink-0">
                          {p.promedio}★ · {p.n}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <select
              className="h-9 rounded-md border px-2 text-sm bg-background"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPOS.map((t) => (
                <option key={t.value || "all"} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border px-2 text-sm bg-background"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {ESTADOS.map((t) => (
                <option key={t.value || "all-e"} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Input
              className="h-9 max-w-xs"
              placeholder="Buscar…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {listQ.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {!listQ.isLoading && reviews.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin reseñas con estos filtros.</p>
            )}
            {reviews.map((r) => (
              <article key={r.id_review} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ReviewStars value={r.rating} size="sm" />
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted capitalize">{r.tipo}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted capitalize">{r.estado}</span>
                      {r.compra_verificada && (
                        <span className="text-xs text-emerald-700">Verificada</span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {r.nombre_publico || r.cliente_nombre || "Cliente"}
                      {r.producto_nombre ? ` · ${r.producto_nombre}` : ""}
                    </p>
                    {r.titulo && <p className="text-sm font-medium">{r.titulo}</p>}
                    {r.comentario && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                        {r.comentario}
                      </p>
                    )}
                    {r.reply?.cuerpo && (
                      <p className="text-xs mt-2 border-l-2 pl-2 text-muted-foreground">
                        Respuesta: {r.reply.cuerpo}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString("es-PE")
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.estado !== "publicada" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => patchEstado.mutate({ id: r.id_review, estado: "publicada" })}
                    >
                      Publicar
                    </Button>
                  )}
                  {r.estado !== "ocultada" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => patchEstado.mutate({ id: r.id_review, estado: "ocultada" })}
                    >
                      Ocultar
                    </Button>
                  )}
                  {r.estado !== "rechazada" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => patchEstado.mutate({ id: r.id_review, estado: "rechazada" })}
                    >
                      Rechazar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setReplyFor(r.id_review);
                      setReplyText(r.reply?.cuerpo || "");
                    }}
                  >
                    Responder
                  </Button>
                </div>
                {replyFor === r.id_review && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      className="w-full min-h-[80px] rounded-md border p-2 text-sm"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Respuesta de la tienda"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!replyText.trim() || replyMut.isPending}
                        onClick={() =>
                          replyMut.mutate({ id: r.id_review, cuerpo: replyText.trim() })
                        }
                      >
                        Guardar respuesta
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReplyFor(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      {tab === "config" && config && (
        <div className="rounded-xl border p-5 space-y-4 max-w-xl">
          <p className="text-sm text-muted-foreground">
            Por defecto solo compradores pueden reseñar productos y la publicación es manual.
          </p>
          {(
            [
              ["activo", "Módulo activo"],
              ["allow_producto", "Permitir reseñas de producto"],
              ["allow_pedido", "Permitir reseñas de pedido"],
              ["allow_sucursal", "Permitir reseñas de sucursal"],
              ["allow_general", "Permitir opiniones generales"],
              ["solo_compradores", "Solo compradores (productos)"],
              ["allow_imagenes", "Permitir imágenes"],
              ["allow_respuestas", "Permitir respuestas de tienda"],
              ["solicitar_post_entrega", "Solicitar post-entrega (fase 2)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(config[key])}
                onChange={(e) =>
                  configMut.mutate({ [key]: e.target.checked })
                }
              />
            </label>
          ))}
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Moderación</span>
            <select
              className="h-9 rounded-md border px-2 bg-background"
              value={config.moderacion || "manual"}
              onChange={(e) => configMut.mutate({ moderacion: e.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="auto">Automática</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Máx. imágenes</span>
            <Input
              type="number"
              min={1}
              max={10}
              className="w-20 h-9"
              defaultValue={config.max_imagenes || 5}
              onBlur={(e) => {
                const n = Number(e.target.value);
                if (n >= 1 && n <= 10) configMut.mutate({ max_imagenes: n });
              }}
            />
          </label>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5 pt-2">
            <Star className="size-3.5 mt-0.5 shrink-0" />
            Fase 2: IA, notificaciones reales, videos, votos útiles y delay de solicitud
            automática (`dias_espera_solicitud`).
          </p>
        </div>
      )}
    </div>
  );
}
