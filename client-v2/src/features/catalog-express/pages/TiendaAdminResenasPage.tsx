import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquareText } from "lucide-react";
import {
  adminGetResenaConfig,
  adminModerarResena,
  adminPatchResenaConfig,
  adminResenaStats,
  adminResenas,
} from "../api/catalogoPublico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
  { value: "oculta", label: "Ocultas" },
];

type Resena = {
  id_resena: number;
  producto: string;
  nombres: string;
  email?: string;
  rating: number;
  titulo?: string | null;
  cuerpo: string;
  estado: string;
  respuesta_comercio?: string | null;
  created_at?: string;
};

export default function TiendaAdminResenasPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"lista" | "config">("lista");
  const [estado, setEstado] = useState("pendiente");
  const [q, setQ] = useState("");
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const statsQ = useQuery({
    queryKey: ["tienda-admin-resena-stats"],
    queryFn: adminResenaStats,
  });
  const listQ = useQuery({
    queryKey: ["tienda-admin-resenas", estado, q],
    queryFn: () =>
      adminResenas({
        estado: estado || undefined,
        q: q.trim() || undefined,
      }),
  });
  const configQ = useQuery({
    queryKey: ["tienda-admin-resena-config"],
    queryFn: adminGetResenaConfig,
  });

  const patchEstado = useMutation({
    mutationFn: ({ id, estado: e }: { id: number; estado: string }) =>
      adminModerarResena(id, { estado: e }),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["tienda-admin-resenas"] });
      qc.invalidateQueries({ queryKey: ["tienda-admin-resena-stats"] });
    },
    onError: () => toast.error("No se pudo actualizar"),
  });

  const replyMut = useMutation({
    mutationFn: ({ id, cuerpo }: { id: number; cuerpo: string }) =>
      adminModerarResena(id, { respuesta_comercio: cuerpo }),
    onSuccess: () => {
      toast.success("Respuesta publicada");
      setReplyFor(null);
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["tienda-admin-resenas"] });
    },
    onError: () => toast.error("Error al responder"),
  });

  const configMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminPatchResenaConfig(body),
    onSuccess: () => {
      toast.success("Configuración guardada");
      qc.invalidateQueries({ queryKey: ["tienda-admin-resena-config"] });
    },
    onError: () => toast.error("No se pudo guardar"),
  });

  const stats = statsQ.data;
  const reviews = (listQ.data || []) as Resena[];
  const config = configQ.data;

  const kpis = useMemo(
    () => [
      { label: "Promedio", value: stats?.promedio?.toFixed?.(1) ?? stats?.promedio ?? "—" },
      { label: "Pendientes", value: stats?.pendientes ?? 0 },
      { label: "Aprobadas", value: stats?.publicadas ?? 0 },
      { label: "Total", value: stats?.total ?? 0 },
    ],
    [stats]
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MessageSquareText className="size-6" /> Reseñas
          </h1>
          <p className="text-sm text-stone-500 mt-1">Modera opiniones, responde y configura el módulo.</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1 bg-stone-100/60">
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md",
              tab === "lista" && "bg-white shadow-sm font-medium"
            )}
            onClick={() => setTab("lista")}
          >
            Lista
          </button>
          <button
            type="button"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md",
              tab === "config" && "bg-white shadow-sm font-medium"
            )}
            onClick={() => setTab("config")}
          >
            Configuración
          </button>
        </div>
      </div>

      {tab === "lista" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-stone-200 bg-white px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">{k.label}</div>
                <div className="text-lg font-semibold">{k.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-md border border-stone-200 px-2 text-sm bg-white"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {ESTADOS.map((e) => (
                <option key={e.value || "all"} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
            <Input
              className="max-w-xs"
              placeholder="Buscar producto o cliente…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id_resena} className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">
                      {r.producto} · {"★".repeat(r.rating)}
                      <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-stone-400">
                        {r.estado}
                      </span>
                    </p>
                    <p className="text-xs text-stone-500">
                      {r.nombres}
                      {r.email ? ` · ${r.email}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.estado !== "aprobada" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchEstado.mutate({ id: r.id_resena, estado: "aprobada" })}
                      >
                        Aprobar
                      </Button>
                    )}
                    {r.estado !== "rechazada" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchEstado.mutate({ id: r.id_resena, estado: "rechazada" })}
                      >
                        Rechazar
                      </Button>
                    )}
                    {r.estado !== "oculta" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => patchEstado.mutate({ id: r.id_resena, estado: "oculta" })}
                      >
                        Ocultar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyFor(r.id_resena);
                        setReplyText(r.respuesta_comercio || "");
                      }}
                    >
                      Responder
                    </Button>
                  </div>
                </div>
                {r.titulo && <p className="text-sm font-medium">{r.titulo}</p>}
                <p className="text-sm text-stone-600">{r.cuerpo}</p>
                {r.respuesta_comercio && (
                  <p className="text-xs bg-stone-50 rounded-lg px-3 py-2 text-stone-600">
                    Respuesta: {r.respuesta_comercio}
                  </p>
                )}
                {replyFor === r.id_resena && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Respuesta del comercio"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={!replyText.trim() || replyMut.isPending}
                        onClick={() =>
                          replyMut.mutate({ id: r.id_resena, cuerpo: replyText.trim() })
                        }
                      >
                        Publicar respuesta
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReplyFor(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
            {!listQ.isLoading && reviews.length === 0 && (
              <li className="text-sm text-stone-400 text-center py-8">Sin reseñas en este filtro.</li>
            )}
          </ul>
        </>
      )}

      {tab === "config" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4 max-w-lg">
          <h2 className="font-semibold text-sm">Módulo de reseñas</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Number(config?.habilitado ?? 1) === 1}
              onChange={(e) =>
                configMut.mutate({
                  habilitado: e.target.checked,
                  requiere_compra: Number(config?.requiere_compra ?? 1) === 1,
                  moderacion: Number(config?.moderacion ?? 1) === 1,
                })
              }
            />
            Habilitado en la vitrina
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Number(config?.requiere_compra ?? 1) === 1}
              onChange={(e) =>
                configMut.mutate({
                  habilitado: Number(config?.habilitado ?? 1) === 1,
                  requiere_compra: e.target.checked,
                  moderacion: Number(config?.moderacion ?? 1) === 1,
                })
              }
            />
            Requiere compra verificada
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Number(config?.moderacion ?? 1) === 1}
              onChange={(e) =>
                configMut.mutate({
                  habilitado: Number(config?.habilitado ?? 1) === 1,
                  requiere_compra: Number(config?.requiere_compra ?? 1) === 1,
                  moderacion: e.target.checked,
                })
              }
            />
            Moderación previa (pendiente → aprobar)
          </label>
        </div>
      )}
    </div>
  );
}
