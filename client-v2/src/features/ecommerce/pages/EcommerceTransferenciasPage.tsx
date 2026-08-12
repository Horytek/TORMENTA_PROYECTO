import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminCreateTransferencia,
  adminSearchVariantes,
  adminListTransferencias,
  adminListSucursales,
  adminUpdateTransferenciaEstado,
} from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";

const TRANSICIONES: Record<string, string[]> = {
  solicitada: ["en_transito", "cancelada"],
  en_transito: ["recibida", "cancelada"],
  recibida: [],
  cancelada: [],
};

export default function EcommerceTransferenciasPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const { data: sucQ } = useQuery({
    queryKey: ["ecom-sucursales", tid],
    queryFn: () => adminListSucursales(),
    enabled: Boolean(tid),
  });
  const sucursales = sucQ?.data || [];
  const sucursalesActivas = useMemo(
    () => sucursales.filter((s: any) => Number(s.activo) === 1),
    [sucursales]
  );

  const [form, setForm] = useState<{
    id_sucursal_origen: number | "";
    id_sucursal_destino: number | "";
    id_variante: number | "";
    cantidad: number | "";
    notas: string;
  }>({
    id_sucursal_origen: "",
    id_sucursal_destino: "",
    id_variante: "",
    cantidad: "",
    notas: "",
  });

  const [busquedaProducto, setBusquedaProducto] = useState("");

  const { data, isError, error } = useQuery({
    queryKey: ["ecom-transferencias", tid],
    queryFn: adminListTransferencias,
    enabled: Boolean(tid),
  });
  const transferencias = data?.data || [];

  const varianteSearchQ = useQuery({
    queryKey: ["ecom-var-search", tid, busquedaProducto],
    queryFn: () => adminSearchVariantes(busquedaProducto),
    enabled: Boolean(tid) && busquedaProducto.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
  const variantesEncontradas = varianteSearchQ.data?.data || [];

  const estadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      adminUpdateTransferenciaEstado(id, estado),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["ecom-transferencias", tid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: () =>
      adminCreateTransferencia({
        id_sucursal_origen: Number(form.id_sucursal_origen),
        id_sucursal_destino: Number(form.id_sucursal_destino),
        notas: form.notas || null,
        lineas: [{ id_variante: Number(form.id_variante), cantidad: Number(form.cantidad) }],
      }),
    onSuccess: () => {
      toast.success("Transferencia creada");
      setForm({
        id_sucursal_origen: "",
        id_sucursal_destino: "",
        id_variante: "",
        cantidad: "",
        notas: "",
      });
      setBusquedaProducto("");
      qc.invalidateQueries({ queryKey: ["ecom-transferencias", tid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Transferencias</h1>
        <p className="text-sm text-stone-500">Movimiento de stock entre sucursales ecommerce</p>
      </div>

      <details className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
        <summary className="cursor-pointer select-none font-semibold">Nueva transferencia</summary>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Sucursal origen</Label>
            <select
              className="h-9 mt-1 w-full rounded-md border border-stone-200 px-2 text-sm"
              value={form.id_sucursal_origen}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : "";
                setForm((f) => ({
                  ...f,
                  id_sucursal_origen: val,
                  id_sucursal_destino: val === f.id_sucursal_destino ? "" : f.id_sucursal_destino,
                }));
              }}
            >
              <option value="">Selecciona</option>
              {sucursalesActivas.map((s: any) => (
                <option key={s.id_sucursal} value={s.id_sucursal}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Sucursal destino</Label>
            <select
              className="h-9 mt-1 w-full rounded-md border border-stone-200 px-2 text-sm"
              value={form.id_sucursal_destino}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : "";
                setForm((f) => ({ ...f, id_sucursal_destino: val }));
              }}
            >
              <option value="">Selecciona</option>
              {sucursalesActivas
                .filter((s: any) => s.id_sucursal !== form.id_sucursal_origen)
                .map((s: any) => (
                  <option key={s.id_sucursal} value={s.id_sucursal}>
                    {s.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <Label>Buscar producto</Label>
            <Input
              className="mt-1"
              value={busquedaProducto}
              onChange={(e) => {
                const val = e.target.value;
                setBusquedaProducto(val);
                setForm((f) => ({ ...f, id_variante: "" }));
              }}
              placeholder="Nombre / SKU / talla / color…"
            />
          </div>

          <div>
            <Label>Cantidad</Label>
            <Input
              className="mt-1"
              value={form.cantidad}
              onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value ? Number(e.target.value) : "" }))}
              placeholder="Ej: 2"
            />
          </div>
        </div>

        <div>
          <Label>Seleccionar variante (del resultado)</Label>
          <select
            className="h-9 mt-1 w-full rounded-md border border-stone-200 px-2 text-sm"
            value={form.id_variante}
            onChange={(e) => setForm((f) => ({ ...f, id_variante: e.target.value ? Number(e.target.value) : "" }))}
            disabled={!variantesEncontradas.length}
          >
            <option value="">{variantesEncontradas.length ? "Selecciona" : "Sin resultados"}</option>
            {variantesEncontradas.map((v: any) => (
              <option key={v.id_variante} value={v.id_variante}>
                {v.producto_nombre}
                {v.variante_sku ? ` (${v.variante_sku})` : ""}
                {v.talla ? ` - ${v.talla}` : ""}
                {v.color ? ` - ${v.color}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            disabled={
              createMut.isPending ||
              !form.id_sucursal_origen ||
              !form.id_sucursal_destino ||
              !form.id_variante ||
              !form.cantidad ||
              Number(form.id_sucursal_origen) === Number(form.id_sucursal_destino)
            }
            onClick={() => createMut.mutate()}
          >
            Crear
          </Button>
        </div>
      </details>

      <div className="grid gap-3">
        {isError && (
          <p className="text-sm text-red-600">
            Error al cargar transferencias: {error instanceof Error ? error.message : "Error"}
          </p>
        )}
        {transferencias.length === 0 && (
          <p className="text-sm text-stone-500">Sin transferencias aún. Créalas desde inventario o API admin.</p>
        )}
        {transferencias.map((t: Record<string, unknown>) => (
          <div key={String(t.id_transferencia)} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">
                  #{String(t.id_transferencia)} · {String(t.origen_nombre)} → {String(t.destino_nombre)}
                </p>
                <p className="text-xs text-stone-500 mt-1">{String(t.created_at)}</p>
              </div>
              <span className="text-xs font-semibold uppercase px-2 py-1 rounded-full bg-stone-100">
                {String(t.estado)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {(TRANSICIONES[String(t.estado)] || []).map((e) => (
                <Button
                  key={e}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    estadoMut.mutate({ id: Number(t.id_transferencia), estado: e })
                  }
                >
                  → {e.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
