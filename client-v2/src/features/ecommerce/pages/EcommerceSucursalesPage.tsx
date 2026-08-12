import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateSucursal,
  adminDeleteSucursal,
  adminListSucursales,
  adminUpdateSucursal,
} from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
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
  allow_pickup: number | boolean;
  allow_delivery: number | boolean;
  es_default: number | boolean;
  activo: number | boolean;
};

const emptyForm = {
  nombre: "",
  direccion: "",
  telefono: "",
  whatsapp: "",
  es_default: false,
  allow_pickup: true,
  allow_delivery: false,
};

export default function EcommerceSucursalesPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ecom-sucursales-admin", tid],
    queryFn: () => adminListSucursales({ incluirInactivas: true }),
    enabled: Boolean(tid),
  });
  const sucursales = (data?.data || []) as Sucursal[];

  const createMut = useMutation({
    mutationFn: () =>
      editing
        ? adminUpdateSucursal(editing, { ...form })
        : adminCreateSucursal({ ...form }),
    onSuccess: () => {
      toast.success(editing ? "Sucursal actualizada" : "Sucursal creada");
      setForm(emptyForm);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["ecom-sucursales-admin", tid] });
      qc.invalidateQueries({ queryKey: ["ecom-sucursales", tid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminDeleteSucursal(id),
    onSuccess: () => {
      toast.success("Sucursal desactivada");
      qc.invalidateQueries({ queryKey: ["ecom-sucursales-admin", tid] });
      qc.invalidateQueries({ queryKey: ["ecom-sucursales", tid] });
    },
  });

  const reactivateMut = useMutation({
    mutationFn: (id: number) =>
      adminUpdateSucursal(id, {
        activo: true,
      }),
    onSuccess: () => {
      toast.success("Sucursal reactivada");
      qc.invalidateQueries({ queryKey: ["ecom-sucursales-admin", tid] });
      qc.invalidateQueries({ queryKey: ["ecom-sucursales", tid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFlag = useMutation({
    mutationFn: ({
      id,
      allow_pickup,
      allow_delivery,
    }: {
      id: number;
      allow_pickup?: boolean;
      allow_delivery?: boolean;
    }) => adminUpdateSucursal(id, { allow_pickup, allow_delivery }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ecom-sucursales-admin", tid] });
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || e.message),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Sucursales</h1>
        <p className="text-sm text-stone-500 mt-1">
          Recojo y/o despacho delivery por sucursal
        </p>
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
                {Boolean(s.activo) && (
                  <div className="mt-3 space-y-1.5 text-xs">
                    <label className="flex items-center justify-between gap-2">
                      <span>Recojo</span>
                      <input
                        type="checkbox"
                        className="accent-teal-700"
                        checked={Boolean(s.allow_pickup)}
                        onChange={(e) =>
                          toggleFlag.mutate({
                            id: s.id_sucursal,
                            allow_pickup: e.target.checked,
                          })
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2">
                      <span>Delivery</span>
                      <input
                        type="checkbox"
                        className="accent-teal-700"
                        checked={Boolean(s.allow_delivery)}
                        onChange={(e) =>
                          toggleFlag.mutate({
                            id: s.id_sucursal,
                            allow_delivery: e.target.checked,
                          })
                        }
                      />
                    </label>
                  </div>
                )}
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
                    allow_pickup: Boolean(s.allow_pickup),
                    allow_delivery: Boolean(s.allow_delivery),
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
            <Label>Dirección</Label>
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.allow_pickup}
            onChange={(e) => setForm({ ...form, allow_pickup: e.target.checked })}
          />
          Permite recojo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.allow_delivery}
            onChange={(e) => setForm({ ...form, allow_delivery: e.target.checked })}
          />
          Atiende delivery
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
