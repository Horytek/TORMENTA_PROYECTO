import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import {
  adminDisponibilidadStats,
  adminGetDisponibilidadConfig,
  adminPatchDisponibilidadConfig,
} from "../../api/ecommerce";
import { DEFAULT_DISP_CONFIG, type DisponibilidadConfig, type MetodoCompra } from "../../utils/disponibilidad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const METODOS: { value: MetodoCompra; label: string; hint: string }[] = [
  { value: "auto", label: "Automático", hint: "Según umbral de stock" },
  { value: "directa", label: "Compra directa", hint: "Carrito, salvo stock bajo o agotado" },
  { value: "consultar", label: "Consultar disponibilidad", hint: "WhatsApp obligatorio" },
  { value: "ambos", label: "Ambos", hint: "Comprar y consultar a la vez" },
];

export function DisponibilidadSettingsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState<DisponibilidadConfig>(DEFAULT_DISP_CONFIG);

  const cfgQ = useQuery({
    queryKey: ["ecom-disp-config"],
    queryFn: adminGetDisponibilidadConfig,
  });
  const statsQ = useQuery({
    queryKey: ["ecom-disp-stats"],
    queryFn: adminDisponibilidadStats,
  });

  useEffect(() => {
    const data = cfgQ.data?.data as (DisponibilidadConfig & { telefono_general?: string | null }) | undefined;
    if (!data) return;
    setForm({ ...DEFAULT_DISP_CONFIG, ...data });
  }, [cfgQ.data]);

  const saveMut = useMutation({
    mutationFn: () =>
      adminPatchDisponibilidadConfig({
        consulta_activa: form.consulta_activa,
        metodo_default: form.metodo_default,
        umbral_consulta: Number(form.umbral_consulta),
        umbral_agotado: Number(form.umbral_agotado),
        mostrar_boton_producto: form.mostrar_boton_producto,
        mostrar_boton_variante: form.mostrar_boton_variante,
        mensaje_confianza: form.mensaje_confianza,
        mensaje_intro: form.mensaje_intro,
        validez_confirmacion_min: Number(form.validez_confirmacion_min),
      }),
    onSuccess: () => {
      toast.success("Configuración de disponibilidad guardada");
      qc.invalidateQueries({ queryKey: ["ecom-disp-config"] });
      qc.invalidateQueries({ queryKey: ["ecom-me"] });
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo guardar"),
  });

  const stats = statsQ.data?.data as {
    total?: number;
    productos?: { id_producto: number; nombre: string; consultas: number; stock?: number }[];
    variantes?: { id_variante: number; nombre: string; sku?: string | null; consultas: number }[];
    sucursales?: { id_sucursal: number; nombre: string | null; consultas: number }[];
    alerta?: { id_producto: number; nombre: string; consultas: number; stock: number }[];
  } | undefined;
  const telefonoGeneral = (cfgQ.data?.data as { telefono_general?: string | null } | undefined)?.telefono_general;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
        <div>
          <h2 className="font-medium">WhatsApp y disponibilidad</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            El stock registrado no confirma que el producto esté físicamente en tienda. Estas reglas
            deciden cuándo el cliente debe consultar por WhatsApp antes de comprar.
          </p>
        </div>

        <label className="flex items-center justify-between gap-3 min-h-11 rounded-lg border border-stone-100 px-3">
          <span className="text-sm">Activar consulta de disponibilidad</span>
          <Switch
            checked={form.consulta_activa}
            onCheckedChange={(v) => setForm({ ...form, consulta_activa: v })}
          />
        </label>

        <div>
          <Label>Método de consulta predeterminado</Label>
          <select
            className="mt-1 w-full min-h-11 rounded-md border border-stone-200 bg-white px-3 text-sm"
            value={form.metodo_default}
            onChange={(e) => setForm({ ...form, metodo_default: e.target.value as MetodoCompra })}
          >
            {METODOS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} — {m.hint}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Umbral de consulta</Label>
            <Input
              className="mt-1 min-h-11"
              inputMode="numeric"
              value={form.umbral_consulta}
              onChange={(e) => setForm({ ...form, umbral_consulta: Number(e.target.value) || 0 })}
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Stock 1–{form.umbral_consulta || 0} → consultar. Por encima → compra directa.
            </p>
          </div>
          <div>
            <Label>Umbral agotado</Label>
            <Input
              className="mt-1 min-h-11"
              inputMode="numeric"
              value={form.umbral_agotado}
              onChange={(e) => setForm({ ...form, umbral_agotado: Number(e.target.value) || 0 })}
            />
            <p className="text-[11px] text-stone-400 mt-1">Stock ≤ este valor se muestra agotado.</p>
          </div>
          <div>
            <Label>Validez de confirmación (min)</Label>
            <Input
              className="mt-1 min-h-11"
              inputMode="numeric"
              value={form.validez_confirmacion_min}
              onChange={(e) =>
                setForm({ ...form, validez_confirmacion_min: Number(e.target.value) || 120 })
              }
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Para reservas futuras. Abrir WhatsApp no reserva stock.
            </p>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 min-h-11 rounded-lg border border-stone-100 px-3">
          <span className="text-sm">Mostrar botón de WhatsApp en productos</span>
          <Switch
            checked={form.mostrar_boton_producto}
            onCheckedChange={(v) => setForm({ ...form, mostrar_boton_producto: v })}
          />
        </label>
        <label className="flex items-center justify-between gap-3 min-h-11 rounded-lg border border-stone-100 px-3">
          <span className="text-sm">Mostrar consulta al elegir variante</span>
          <Switch
            checked={form.mostrar_boton_variante}
            onCheckedChange={(v) => setForm({ ...form, mostrar_boton_variante: v })}
          />
        </label>

        <div>
          <Label>Mensaje de confianza</Label>
          <Textarea
            className="mt-1 min-h-20"
            value={form.mensaje_confianza}
            onChange={(e) => setForm({ ...form, mensaje_confianza: e.target.value })}
          />
        </div>
        <div>
          <Label>Inicio del mensaje de WhatsApp</Label>
          <Textarea
            className="mt-1 min-h-16"
            value={form.mensaje_intro}
            onChange={(e) => setForm({ ...form, mensaje_intro: e.target.value })}
          />
          <p className="text-[11px] text-stone-400 mt-1">
            El resto (producto, SKU, atributos, sucursal y enlace) se genera solo. Sin datos privados del cliente.
          </p>
        </div>

        <div className="rounded-lg bg-stone-50 border border-stone-100 p-3 text-sm text-stone-600 space-y-1">
          <p className="font-medium text-stone-800">WhatsApp</p>
          <p>
            Número general de la tienda:{" "}
            <span className="font-medium">{telefonoGeneral || "sin configurar (pestaña Tu tienda)"}</span>
          </p>
          <p>
            Cada sucursal puede tener su propio número en{" "}
            <Link to="/ecommerce-admin/sucursales" className="text-teal-700 hover:underline">
              Sucursales
            </Link>
            . Si no hay número local, se usa el general.
          </p>
        </div>

        <Button
          type="button"
          className="min-h-11"
          disabled={saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? "Guardando…" : "Guardar disponibilidad"}
        </Button>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
        <div>
          <h2 className="font-medium inline-flex items-center gap-2">
            <MessageCircle className="size-4" />
            Consultas de disponibilidad
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Se registran al abrir WhatsApp. No cambian el stock ni crean reservas.
          </p>
        </div>
        <p className="text-2xl font-semibold">{stats?.total ?? 0}</p>
        {!!stats?.alerta?.length && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
            <p className="text-sm font-medium text-amber-900">Alta demanda / baja disponibilidad</p>
            {stats.alerta.map((a) => (
              <p key={a.id_producto} className="text-sm text-amber-800">
                {a.nombre}: {a.consultas} consultas · stock {a.stock}
              </p>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Productos más consultados</p>
            <ul className="space-y-1">
              {(stats?.productos || []).length === 0 && <li className="text-stone-400">Aún no hay datos</li>}
              {(stats?.productos || []).map((p) => (
                <li key={p.id_producto} className="flex justify-between gap-2">
                  <span className="truncate">{p.nombre}</span>
                  <span className="text-stone-500 shrink-0">{p.consultas}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Variantes</p>
            <ul className="space-y-1">
              {(stats?.variantes || []).length === 0 && <li className="text-stone-400">Aún no hay datos</li>}
              {(stats?.variantes || []).map((v) => (
                <li key={v.id_variante} className="flex justify-between gap-2">
                  <span className="truncate">{v.nombre}{v.sku ? ` · ${v.sku}` : ""}</span>
                  <span className="text-stone-500 shrink-0">{v.consultas}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">Sucursales</p>
            <ul className="space-y-1">
              {(stats?.sucursales || []).length === 0 && <li className="text-stone-400">Aún no hay datos</li>}
              {(stats?.sucursales || []).map((s) => (
                <li key={s.id_sucursal} className="flex justify-between gap-2">
                  <span className="truncate">{s.nombre || `Sucursal ${s.id_sucursal}`}</span>
                  <span className="text-stone-500 shrink-0">{s.consultas}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
