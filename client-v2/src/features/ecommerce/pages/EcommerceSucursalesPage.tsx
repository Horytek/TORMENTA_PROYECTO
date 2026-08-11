import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateSucursal,
  adminDeleteSucursal,
  adminListSucursales,
  adminUpdateSucursal,
} from "../api/ecommerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type Sucursal = {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  telefono?: string | null;
  whatsapp?: string | null;
  allow_pickup: number;
  allow_delivery: number;
  es_default: number;
  activo: number;
};

const emptyForm = {
  nombre: "",
  direccion: "",
  telefono: "",
  whatsapp: "",
  es_default: false,
};

export default function EcommerceSucursalesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ecom-sucursales"],
    queryFn: adminListSucursales,
  });
  const sucursales = (data?.data || []) as Sucursal[];

  const createMut = useMutation({
    mutationFn: () =>
      editing
        ? adminUpdateSucursal(editing, {
            ...form,
            allow_pickup: true,
            allow_delivery: false,
          })
        : adminCreateSucursal({
            ...form,
            allow_pickup: true,
            allow_delivery: false,
          }),
    onSuccess: () => {
      toast.success(editing ? "Sucursal actualizada" : "Sucursal creada");
      setForm(emptyForm);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["ecom-sucursales"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminDeleteSucursal(id),
    onSuccess: () => {
      toast.success("Sucursal desactivada");
      qc.invalidateQueries({ queryKey: ["ecom-sucursales"] });
    },
  });

  const reactivateMut = useMutation({
    mutationFn: (id: number) =>
      adminUpdateSucursal(id, {
        activo: true,
        allow_pickup: true,
        allow_delivery: false,
      }),
    onSuccess: () => {
      toast.success("Sucursal reactivada");
      qc.invalidateQueries({ queryKey: ["ecom-sucursales"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Sucursales</h1>
        <p className="text-sm text-stone-500 mt-1">Puntos de recojo en tienda (sin delivery en MVP)</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-sm text-stone-500">Cargando…</p>}
        {sucursales.map((s) => (
          <div
            key={s.id_sucursal}
            className={`rounded-xl border bg-white p-4 ${s.activo ? "border-stone-200" : "border-stone-200 opacity-60"}`}
          >
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-teal-700 shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.nombre}</p>
                <p className="text-xs text-stone-500 mt-1">{s.direccion}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.es_default ? (
                    <span className="text-[10px] uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  ) : null}
                  {!s.activo ? (
                    <span className="text-[10px] uppercase tracking-wide text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                      Inactiva
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(s.id_sucursal);
                  setForm({
                    nombre: s.nombre,
                    direccion: s.direccion,
                    telefono: s.telefono || "",
                    whatsapp: s.whatsapp || "",
                    es_default: Boolean(s.es_default),
                  });
                }}
              >
                Editar
              </Button>
              {s.activo ? (
                <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate(s.id_sucursal)}>
                  Desactivar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => reactivateMut.mutate(s.id_sucursal)}
                  disabled={reactivateMut.isPending}
                >
                  Reactivar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Plus className="size-4" />
          {editing ? "Editar sucursal" : "Nueva sucursal"}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Dirección (recojo)</Label>
            <Input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.es_default}
            onChange={(e) => setForm({ ...form, es_default: e.target.checked })}
          />
          Sucursal por defecto
        </label>
        <div className="flex gap-2">
          <Button
            disabled={!form.nombre.trim() || !form.direccion.trim() || createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            {editing ? "Guardar" : "Crear"}
          </Button>
          {editing && (
            <Button variant="ghost" onClick={() => { setEditing(null); setForm(emptyForm); }}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
