import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { adminListSucursales, adminPatchSucursal } from "../api/catalogoPublico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Sucursal = {
  id_sucursal: number;
  nombre: string;
  direccion: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  allow_pickup: boolean;
  allow_delivery: boolean;
  es_default: boolean;
  visible: boolean;
  estado_sucursal: number;
};

export default function TiendaAdminSucursalesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ telefono: "", whatsapp: "", es_default: false });

  const { data, isLoading } = useQuery({
    queryKey: ["tienda-admin-sucursales"],
    queryFn: adminListSucursales,
  });
  const sucursales = (data || []) as Sucursal[];

  const patchMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      adminPatchSucursal(id, body),
    onSuccess: () => {
      toast.success("Sucursal actualizada");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["tienda-admin-sucursales"] });
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || e.message || "No se pudo guardar"),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Sucursales</h1>
          <p className="text-sm text-stone-500 mt-1">
            Recojo y/o despacho delivery por sucursal. Los locales se crean en el ERP.
          </p>
        </div>
        <Button variant="outline" className="h-11 gap-2" asChild>
          <Link to="/logistics/branches">
            <ExternalLink className="size-4" /> Gestionar locales en ERP
          </Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-sm text-stone-500">Cargando…</p>}
        {sucursales.map((s) => (
          <div
            key={s.id_sucursal}
            className={`rounded-xl border bg-white p-4 ${s.visible ? "border-stone-200" : "border-stone-200 opacity-60"}`}
          >
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-teal-700 shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.nombre}</p>
                <p className="text-xs text-stone-500 mt-1">{s.direccion || "Sin dirección"}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.es_default ? (
                    <span className="text-[10px] uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  ) : null}
                  {!s.visible ? (
                    <span className="text-[10px] uppercase tracking-wide text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                      Inactiva
                    </span>
                  ) : null}
                  {Number(s.estado_sucursal) === 0 ? (
                    <span className="text-[10px] uppercase tracking-wide text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                      Inactiva en ERP
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <label className="flex items-center justify-between gap-2">
                    <span>Recojo</span>
                    <input
                      type="checkbox"
                      className="accent-teal-700"
                      checked={Boolean(s.allow_pickup)}
                      onChange={(e) =>
                        patchMut.mutate({ id: s.id_sucursal, body: { allow_pickup: e.target.checked } })
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
                        patchMut.mutate({
                          id: s.id_sucursal,
                          body: { allow_delivery: e.target.checked },
                        })
                      }
                    />
                  </label>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(s.id_sucursal);
                      setForm({
                        telefono: s.telefono || "",
                        whatsapp: s.whatsapp || "",
                        es_default: Boolean(s.es_default),
                      });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patchMut.mutate({ id: s.id_sucursal, body: { visible: !s.visible } })
                    }
                  >
                    {s.visible ? "Desactivar" : "Reactivar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing != null && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3 max-w-lg">
          <h2 className="font-medium">WhatsApp y default</h2>
          <div>
            <Label>Teléfono</Label>
            <Input
              className="mt-1 min-h-11"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input
              className="mt-1 min-h-11"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-teal-700"
              checked={form.es_default}
              onChange={(e) => setForm({ ...form, es_default: e.target.checked })}
            />
            Sucursal por defecto
          </label>
          <div className="flex gap-2">
            <Button
              disabled={patchMut.isPending}
              onClick={() =>
                patchMut.mutate({
                  id: editing,
                  body: {
                    telefono: form.telefono,
                    whatsapp: form.whatsapp,
                    es_default: form.es_default,
                  },
                })
              }
            >
              Guardar
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
