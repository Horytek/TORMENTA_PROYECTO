import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PackageCheck } from "lucide-react";
import { adminListPedidos, adminUpdatePedidoEstado } from "../api/catalogoPublico";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente_pago", label: "Pendiente pago" },
  { value: "pagado", label: "Pagado" },
  { value: "preparando", label: "Preparando" },
  { value: "listo_retiro", label: "Listo retiro" },
  { value: "enviado", label: "Enviado" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

const ACCIONES = ["preparando", "listo_retiro", "enviado", "entregado", "cancelado"] as const;

type Pedido = {
  id_pedido: number;
  codigo: string;
  estado: string;
  total: number;
  mp_status?: string | null;
  metodo_entrega?: string;
  comprador_nombre?: string;
  comprador_email?: string;
  sucursal_nombre?: string;
  created_at?: string;
};

export default function TiendaAdminPedidosPage() {
  const qc = useQueryClient();
  const [estado, setEstado] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tienda-admin-pedidos", estado],
    queryFn: () => adminListPedidos(estado ? { estado } : undefined),
  });

  const pedidos = (data || []) as Pedido[];

  const updateMut = useMutation({
    mutationFn: ({ id, st }: { id: number; st: string }) => adminUpdatePedidoEstado(id, st),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["tienda-admin-pedidos"] });
    },
    onError: () => toast.error("No se pudo actualizar"),
  });

  const kpis = useMemo(() => {
    const list = pedidos;
    return [
      { label: "En cola", value: list.filter((p) => ["pagado", "preparando"].includes(p.estado)).length },
      { label: "Listos", value: list.filter((p) => p.estado === "listo_retiro").length },
      { label: "Entregados", value: list.filter((p) => p.estado === "entregado").length },
    ];
  }, [pedidos]);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
            <PackageCheck className="size-6" /> Pedidos
          </h1>
          <p className="text-stone-500 text-sm mt-1">Cola de fulfillment de la tienda web.</p>
        </div>
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
      </div>

      <div className="grid grid-cols-3 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-stone-200 bg-white px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-stone-400">{k.label}</div>
            <div className="text-lg font-semibold">{isLoading ? "…" : k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs text-stone-500">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Pago</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id_pedido} className="border-t border-stone-100 align-top">
                <td className="px-3 py-2 font-mono text-xs">
                  {p.codigo}
                  {p.sucursal_nombre && (
                    <div className="text-[10px] text-stone-400 mt-0.5">{p.sucursal_nombre}</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div>{p.comprador_nombre || "—"}</div>
                  <div className="text-[11px] text-stone-400">{p.comprador_email}</div>
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium">
                    {p.estado}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-stone-500">{p.mp_status || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">S/ {Number(p.total).toFixed(2)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {ACCIONES.filter((st) => st !== p.estado).map((st) => (
                      <Button
                        key={st}
                        type="button"
                        size="sm"
                        variant="outline"
                        className={cn("h-7 text-[10px] px-2", st === "cancelado" && "text-red-700")}
                        disabled={updateMut.isPending}
                        onClick={() => updateMut.mutate({ id: p.id_pedido, st })}
                      >
                        {st}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && pedidos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-stone-400 text-sm">
                  Sin pedidos en este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
