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
        umbral_limitado: Number(form.umbral_limitado),
        umbral_confirmacion: Number(form.umbral_confirmacion),
        mostrar_boton_producto: form.mostrar_boton_producto,
        mostrar_boton_variante: form.mostrar_boton_variante,
        mensaje_confianza: form.mensaje_confianza,
        mensaje_leyenda_stock: form.mensaje_leyenda_stock,
        mensaje_intro: form.mensaje_intro,
        validez_confirmacion_min: Number(form.validez_confirmacion_min),
        reserva_checkout_min: Number(form.reserva_checkout_min),
        permitir_checkout_parcial: Boolean(form.permitir_checkout_parcial),
        solicitudes_activas: Boolean(form.solicitudes_activas),
        reserva_al_aprobar: Boolean(form.reserva_al_aprobar),
        reserva_minutos: Number(form.reserva_minutos),
        permitir_aprobacion_parcial: Boolean(form.permitir_aprobacion_parcial),
        congelar_precio_al_aprobar: Boolean(form.congelar_precio_al_aprobar),
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
    reservas_por_expirar?: { id_reserva: number; producto_nombre?: string; expires_at?: string }[];
    intentos_sin_stock?: number;
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label>Umbral de consulta</Label>
            <Input
              className="mt-1 min-h-11"
              inputMode="numeric"
              value={form.umbral_consulta}
              onChange={(e) => setForm({ ...form, umbral_consulta: Number(e.target.value) || 0 })}
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Stock ≤ {form.umbral_consulta || 0} → consultar (si la consulta está activa).
            </p>
          </div>
          <div>
            <Label>Umbral limitado</Label>
            <Input
              className="mt-1 min-h-11"
              inputMode="numeric"
              value={form.umbral_limitado}
              onChange={(e) => setForm({ ...form, umbral_limitado: Number(e.target.value) || 0 })}
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Stock ≤ {form.umbral_limitado || 0} → disponibilidad limitada (aún permite carrito).
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
              Tiempo de validez de la autorización tras aprobar una solicitud.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-3 space-y-3">
          <h3 className="text-sm font-medium text-teal-900">Solicitudes de confirmación</h3>
          <label className="flex items-center justify-between gap-3 min-h-11 rounded-lg border border-teal-100 bg-white px-3">
            <span className="text-sm">Activar solicitudes de disponibilidad</span>
            <Switch
              checked={form.solicitudes_activas !== false}
              onCheckedChange={(v) => setForm({ ...form, solicitudes_activas: v })}
            />
          </label>
          <div>
            <Label>Umbral de confirmación (stock bajo)</Label>
            <Input
              className="mt-1 min-h-11"
              inputMode="numeric"
              value={form.umbral_confirmacion}
              onChange={(e) =>
                setForm({ ...form, umbral_confirmacion: Number(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label>Minutos de reserva al aprobar</Label>
            <Input
              className="mt-1 min-h-11"
              inputMode="numeric"
              value={form.reserva_minutos}
              onChange={(e) => setForm({ ...form, reserva_minutos: Number(e.target.value) || 30 })}
            />
          </div>
          <label className="flex items-center justify-between gap-3 min-h-11 rounded-lg border border-teal-100 bg-white px-3">
            <span className="text-sm">Reservar stock al aprobar</span>
            <Switch
              checked={form.reserva_al_aprobar !== false}
              onCheckedChange={(v) => setForm({ ...form, reserva_al_aprobar: v })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 min-h-11 rounded-lg border border-teal-100 bg-white px-3">
            <span className="text-sm">Permitir aprobación parcial</span>
            <Switch
              checked={form.permitir_aprobacion_parcial !== false}
              onCheckedChange={(v) => setForm({ ...form, permitir_aprobacion_parcial: v })}
            />
          </label>
          <label className="flex items-center justify-between gap-3 min-h-11 rounded-lg border border-teal-100 bg-white px-3">
            <span className="text-sm">Congelar precio al aprobar</span>
            <Switch
              checked={Boolean(form.congelar_precio_al_aprobar)}
              onCheckedChange={(v) => setForm({ ...form, congelar_precio_al_aprobar: v })}
            />
          </label>
          <p className="text-xs text-teal-800">
            Operadores de tienda atienden solicitudes en Pedidos → Solicitudes de stock.
          </p>
        </div>

        <div>
          <Label>Reserva en checkout (min)</Label>
          <Input
            className="mt-1 min-h-11 max-w-xs"
            inputMode="numeric"
            value={form.reserva_checkout_min}
            onChange={(e) =>
              setForm({ ...form, reserva_checkout_min: Number(e.target.value) || 15 })
            }
          />
          <p className="text-[11px] text-stone-400 mt-1">
            Tras este tiempo, órdenes pending abandonadas liberan el stock reservado (cron cada 5 min).
          </p>
        </div>

        <label className="flex items-center justify-between gap-3 min-h-11 rounded-lg border border-stone-100 px-3">
          <span>
            <span className="text-sm block">Checkout parcial (carrito mixto)</span>
            <span className="text-[11px] text-stone-400">
              Permite pagar solo ítems de compra directa y dejar los de consulta en el carrito
            </span>
          </span>
          <Switch
            checked={Boolean(form.permitir_checkout_parcial)}
            onCheckedChange={(v) => setForm({ ...form, permitir_checkout_parcial: v })}
          />
        </label>

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
          <Label>Leyenda de stock</Label>
          <Textarea
            className="mt-1 min-h-20"
            value={form.mensaje_leyenda_stock}
            onChange={(e) => setForm({ ...form, mensaje_leyenda_stock: e.target.value })}
          />
          <p className="text-[11px] text-stone-400 mt-1">
            Texto de respaldo en estado «disponibilidad limitada» si no hay mensaje de confianza.
          </p>
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
        {(stats?.intentos_sin_stock ?? 0) > 0 && (
          <p className="text-sm text-red-700">
            Intentos de compra sin stock (7 días): {stats?.intentos_sin_stock}
          </p>
        )}
        {!!stats?.reservas_por_expirar?.length && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
            <p className="text-sm font-medium text-amber-900">Reservas por expirar (&lt; 30 min)</p>
            {stats.reservas_por_expirar.map((r) => (
              <p key={r.id_reserva} className="text-sm text-amber-800">
                #{r.id_reserva} · {r.producto_nombre || "Producto"} · expira{" "}
                {r.expires_at ? new Date(r.expires_at).toLocaleString() : "—"}
              </p>
            ))}
          </div>
        )}
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
