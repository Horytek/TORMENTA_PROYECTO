import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Package, Store, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminGetEntregaConfig,
  adminPatchEntregaConfig,
  adminListZonas,
  adminCreateZona,
  adminDeleteZona,
  adminListDestinos,
  adminCreateDestino,
  adminDeleteDestino,
  adminListAgencias,
  adminCreateAgencia,
  adminDeleteAgencia,
  adminListSucursales,
} from "../api/ecommerce";
import { useEcommerceAuthStore } from "../store/useEcommerceAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZonaPolygonEditor } from "../components/admin/ZonaPolygonEditor";
import { formatPen } from "../types/storefront";
import { cn } from "@/lib/utils";

type Panel = "retiro" | "delivery" | "provincia" | null;

export default function EcommerceEntregasPage() {
  const qc = useQueryClient();
  const tid = useEcommerceAuthStore((s) => s.user?.id_tienda);
  const [panel, setPanel] = useState<Panel>(null);

  const configQ = useQuery({
    queryKey: ["ecom-entrega-config", tid],
    queryFn: adminGetEntregaConfig,
    enabled: Boolean(tid),
  });
  const config = configQ.data?.data;

  const zonasQ = useQuery({
    queryKey: ["ecom-zonas", tid],
    queryFn: adminListZonas,
    enabled: Boolean(tid),
  });
  const destinosQ = useQuery({
    queryKey: ["ecom-destinos", tid],
    queryFn: adminListDestinos,
    enabled: Boolean(tid),
  });
  const agenciasQ = useQuery({
    queryKey: ["ecom-agencias", tid],
    queryFn: adminListAgencias,
    enabled: Boolean(tid),
  });
  const sucQ = useQuery({
    queryKey: ["ecom-sucursales-admin", tid],
    queryFn: () => adminListSucursales({ incluirInactivas: false }),
    enabled: Boolean(tid),
  });

  const patchMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminPatchEntregaConfig(body),
    onSuccess: () => {
      toast.success("Configuración guardada");
      qc.invalidateQueries({ queryKey: ["ecom-entrega-config", tid] });
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || e.message),
  });

  const cards = useMemo(
    () => [
      {
        key: "retiro" as const,
        title: "Retiro en tienda",
        icon: Store,
        activo: Boolean(config?.retiro_activo),
        resumen: "Gratis · QR en mostrador",
        toggle: (v: boolean) => patchMut.mutate({ retiro_activo: v }),
      },
      {
        key: "delivery" as const,
        title: "Delivery",
        icon: Bike,
        activo: Boolean(config?.delivery_activo),
        resumen:
          config?.delivery_gratis_desde != null
            ? `Gratis desde ${formatPen(Number(config.delivery_gratis_desde))}`
            : "Tarifa por zona o fija",
        toggle: (v: boolean) => patchMut.mutate({ delivery_activo: v }),
      },
      {
        key: "provincia" as const,
        title: "Envío a provincia",
        icon: Package,
        activo: Boolean(config?.provincia_activo),
        resumen: "Tarifas por destino + agencias",
        toggle: (v: boolean) => patchMut.mutate({ provincia_activo: v }),
      },
    ],
    [config, patchMut]
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Entregas</h1>
        <p className="text-sm text-stone-500 mt-1">
          Activa métodos y configura costos. El checkout solo muestra lo activo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.key}
            className={cn(
              "rounded-xl border bg-white p-5 space-y-4",
              c.activo ? "border-teal-600/40" : "border-stone-200"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <c.icon className="size-5 text-stone-500" />
                <h2 className="font-semibold">{c.title}</h2>
              </div>
              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <span className="text-stone-500">{c.activo ? "Activo" : "Off"}</span>
                <input
                  type="checkbox"
                  className="size-4 accent-teal-700"
                  checked={c.activo}
                  onChange={(e) => c.toggle(e.target.checked)}
                />
              </label>
            </div>
            <p className="text-sm text-stone-500">{c.resumen}</p>
            <Button variant="outline" className="w-full" onClick={() => setPanel(c.key)}>
              Configurar
            </Button>
          </div>
        ))}
      </div>

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setPanel(null)}>
          <div
            className="h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {panel === "retiro" && "Retiro"}
                {panel === "delivery" && "Delivery"}
                {panel === "provincia" && "Provincia"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setPanel(null)}>
                Cerrar
              </Button>
            </div>

            {panel === "retiro" && config && (
              <RetiroPanel
                config={config}
                onSave={(body) => patchMut.mutate(body)}
                pending={patchMut.isPending}
                sucursales={(sucQ.data?.data || []) as { nombre: string; allow_pickup: number }[]}
              />
            )}
            {panel === "delivery" && config && (
              <DeliveryPanel
                config={config}
                onSaveConfig={(body) => patchMut.mutate(body)}
                pending={patchMut.isPending}
                zonas={(zonasQ.data?.data || []) as Record<string, unknown>[]}
                sucursales={(sucQ.data?.data || []) as { id_sucursal: number; nombre: string }[]}
                tid={tid}
              />
            )}
            {panel === "provincia" && config && (
              <ProvinciaPanel
                config={config}
                onSaveConfig={(body) => patchMut.mutate(body)}
                pending={patchMut.isPending}
                destinos={(destinosQ.data?.data || []) as Record<string, unknown>[]}
                agencias={(agenciasQ.data?.data || []) as Record<string, unknown>[]}
                tid={tid}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RetiroPanel({
  config,
  onSave,
  pending,
  sucursales,
}: {
  config: Record<string, unknown>;
  onSave: (b: Record<string, unknown>) => void;
  pending: boolean;
  sucursales: { nombre: string; allow_pickup: number }[];
}) {
  const [prep, setPrep] = useState(String(config.retiro_prep_minutos ?? 60));
  const [instr, setInstr] = useState(String(config.retiro_instrucciones || ""));

  return (
    <div className="space-y-4">
      <div>
        <Label>Minutos de preparación (estimado)</Label>
        <Input type="number" value={prep} onChange={(e) => setPrep(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Instrucciones al cliente</Label>
        <textarea
          className="mt-1 w-full min-h-24 rounded-md border border-stone-200 p-2 text-sm"
          value={instr}
          onChange={(e) => setInstr(e.target.value)}
        />
      </div>
      <div className="text-sm text-stone-500">
        Sucursales con recojo:{" "}
        {sucursales.filter((s) => s.allow_pickup).map((s) => s.nombre).join(", ") || "ninguna"}
      </div>
      <Button
        disabled={pending}
        onClick={() =>
          onSave({
            retiro_prep_minutos: Number(prep) || null,
            retiro_instrucciones: instr || null,
          })
        }
      >
        Guardar
      </Button>
    </div>
  );
}

function DeliveryPanel({
  config,
  onSaveConfig,
  pending,
  zonas,
  sucursales,
  tid,
}: {
  config: Record<string, unknown>;
  onSaveConfig: (b: Record<string, unknown>) => void;
  pending: boolean;
  zonas: Record<string, unknown>[];
  sucursales: { id_sucursal: number; nombre: string }[];
  tid?: number;
}) {
  const qc = useQueryClient();
  const [modelo, setModelo] = useState(String(config.delivery_modelo || "zona"));
  const [base, setBase] = useState(String(config.delivery_costo_base ?? 0));
  const [recargo, setRecargo] = useState(String(config.delivery_recargo ?? 0));
  const [pedidoMin, setPedidoMin] = useState(
    config.delivery_pedido_min != null ? String(config.delivery_pedido_min) : ""
  );
  const [gratis, setGratis] = useState(
    config.delivery_gratis_desde != null ? String(config.delivery_gratis_desde) : ""
  );
  const [tiempo, setTiempo] = useState(String(config.delivery_tiempo_texto || ""));

  const [nombre, setNombre] = useState("");
  const [costo, setCosto] = useState("10");
  const [idSuc, setIdSuc] = useState(sucursales[0]?.id_sucursal || 0);
  const [geo, setGeo] = useState<GeoJSON.Polygon | null>(null);

  const createZona = useMutation({
    mutationFn: () =>
      adminCreateZona({
        nombre,
        costo: Number(costo),
        id_sucursal: idSuc,
        geojson: geo,
      }),
    onSuccess: () => {
      toast.success("Zona creada");
      setNombre("");
      setGeo(null);
      qc.invalidateQueries({ queryKey: ["ecom-zonas", tid] });
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || e.message),
  });

  const delZona = useMutation({
    mutationFn: (id: number) => adminDeleteZona(id),
    onSuccess: () => {
      toast.success("Zona desactivada");
      qc.invalidateQueries({ queryKey: ["ecom-zonas", tid] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <Label>Modelo de cobro</Label>
          <select
            className="mt-1 w-full h-10 rounded-md border border-stone-200 px-2 text-sm"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
          >
            <option value="zona">Por zona (mapa)</option>
            <option value="fija">Tarifa fija</option>
            <option value="base_recargo">Base + recargo</option>
          </select>
        </div>
        {(modelo === "fija" || modelo === "base_recargo") && (
          <div>
            <Label>Costo base</Label>
            <Input value={base} onChange={(e) => setBase(e.target.value)} className="mt-1" />
          </div>
        )}
        {modelo === "base_recargo" && (
          <div>
            <Label>Recargo</Label>
            <Input value={recargo} onChange={(e) => setRecargo(e.target.value)} className="mt-1" />
          </div>
        )}
        <div>
          <Label>Pedido mínimo</Label>
          <Input value={pedidoMin} onChange={(e) => setPedidoMin(e.target.value)} className="mt-1" placeholder="Opcional" />
        </div>
        <div>
          <Label>Gratis desde</Label>
          <Input value={gratis} onChange={(e) => setGratis(e.target.value)} className="mt-1" placeholder="Opcional" />
        </div>
        <div>
          <Label>Tiempo estimado (texto)</Label>
          <Input value={tiempo} onChange={(e) => setTiempo(e.target.value)} className="mt-1" placeholder="30–45 min" />
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            onSaveConfig({
              delivery_modelo: modelo,
              delivery_costo_base: Number(base) || 0,
              delivery_recargo: Number(recargo) || 0,
              delivery_pedido_min: pedidoMin === "" ? null : Number(pedidoMin),
              delivery_gratis_desde: gratis === "" ? null : Number(gratis),
              delivery_tiempo_texto: tiempo || null,
            })
          }
        >
          Guardar reglas
        </Button>
      </div>

      {modelo === "zona" && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-medium">Zonas</h4>
          <ul className="space-y-2">
            {zonas
              .filter((z) => z.activo !== false)
              .map((z) => (
                <li
                  key={String(z.id_zona)}
                  className="flex items-center justify-between gap-2 text-sm border rounded-lg px-3 py-2"
                >
                  <span>
                    {String(z.nombre)} · {formatPen(Number(z.costo))}
                    {z.sucursal_nombre ? ` · ${String(z.sucursal_nombre)}` : ""}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => delZona.mutate(Number(z.id_zona))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
          </ul>

          <div className="space-y-2 pt-2">
            <Label>Nueva zona</Label>
            <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <Input placeholder="Costo" value={costo} onChange={(e) => setCosto(e.target.value)} />
            <select
              className="w-full h-10 rounded-md border border-stone-200 px-2 text-sm"
              value={idSuc}
              onChange={(e) => setIdSuc(Number(e.target.value))}
            >
              {sucursales.map((s) => (
                <option key={s.id_sucursal} value={s.id_sucursal}>
                  {s.nombre}
                </option>
              ))}
            </select>
            <ZonaPolygonEditor value={geo} onChange={setGeo} />
            <Button
              className="w-full"
              disabled={!nombre || !geo || !idSuc || createZona.isPending}
              onClick={() => createZona.mutate()}
            >
              <Plus className="size-4 mr-1" /> Crear zona
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProvinciaPanel({
  config,
  onSaveConfig,
  pending,
  destinos,
  agencias,
  tid,
}: {
  config: Record<string, unknown>;
  onSaveConfig: (b: Record<string, unknown>) => void;
  pending: boolean;
  destinos: Record<string, unknown>[];
  agencias: Record<string, unknown>[];
  tid?: number;
}) {
  const qc = useQueryClient();
  const [pedidoMin, setPedidoMin] = useState(
    config.provincia_pedido_min != null ? String(config.provincia_pedido_min) : ""
  );
  const [cond, setCond] = useState(String(config.provincia_condiciones || ""));
  const [reqAg, setReqAg] = useState(Boolean(config.provincia_requiere_agencia));

  const [dep, setDep] = useState("");
  const [prov, setProv] = useState("");
  const [costo, setCosto] = useState("25");
  const [agNombre, setAgNombre] = useState("");

  const createDest = useMutation({
    mutationFn: () =>
      adminCreateDestino({
        departamento: dep,
        provincia: prov || null,
        costo: Number(costo),
      }),
    onSuccess: () => {
      toast.success("Destino creado");
      setDep("");
      setProv("");
      qc.invalidateQueries({ queryKey: ["ecom-destinos", tid] });
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || e.message),
  });

  const delDest = useMutation({
    mutationFn: (id: number) => adminDeleteDestino(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ecom-destinos", tid] }),
  });

  const createAg = useMutation({
    mutationFn: () => adminCreateAgencia({ nombre: agNombre }),
    onSuccess: () => {
      toast.success("Agencia creada");
      setAgNombre("");
      qc.invalidateQueries({ queryKey: ["ecom-agencias", tid] });
    },
  });

  const delAg = useMutation({
    mutationFn: (id: number) => adminDeleteAgencia(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ecom-agencias", tid] }),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <Label>Pedido mínimo</Label>
          <Input value={pedidoMin} onChange={(e) => setPedidoMin(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Condiciones</Label>
          <textarea
            className="mt-1 w-full min-h-20 rounded-md border border-stone-200 p-2 text-sm"
            value={cond}
            onChange={(e) => setCond(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={reqAg}
            onChange={(e) => setReqAg(e.target.checked)}
            className="accent-teal-700"
          />
          Requiere elegir agencia
        </label>
        <Button
          disabled={pending}
          onClick={() =>
            onSaveConfig({
              provincia_pedido_min: pedidoMin === "" ? null : Number(pedidoMin),
              provincia_condiciones: cond || null,
              provincia_requiere_agencia: reqAg,
            })
          }
        >
          Guardar reglas
        </Button>
      </div>

      <div className="border-t pt-4 space-y-3">
        <h4 className="font-medium">Destinos</h4>
        <ul className="space-y-2">
          {destinos
            .filter((d) => d.activo !== false)
            .map((d) => (
              <li key={String(d.id_destino)} className="flex justify-between text-sm border rounded-lg px-3 py-2">
                <span>
                  {String(d.departamento)}
                  {d.provincia ? ` / ${String(d.provincia)}` : ""} · {formatPen(Number(d.costo))}
                </span>
                <Button size="icon" variant="ghost" onClick={() => delDest.mutate(Number(d.id_destino))}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
        </ul>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Departamento" value={dep} onChange={(e) => setDep(e.target.value)} />
          <Input placeholder="Provincia (opc.)" value={prov} onChange={(e) => setProv(e.target.value)} />
        </div>
        <Input placeholder="Costo" value={costo} onChange={(e) => setCosto(e.target.value)} />
        <Button disabled={!dep || createDest.isPending} onClick={() => createDest.mutate()}>
          <Plus className="size-4 mr-1" /> Destino
        </Button>
      </div>

      <div className="border-t pt-4 space-y-3">
        <h4 className="font-medium">Agencias</h4>
        <ul className="space-y-2">
          {agencias
            .filter((a) => a.activo !== false)
            .map((a) => (
              <li key={String(a.id_agencia)} className="flex justify-between text-sm border rounded-lg px-3 py-2">
                <span>{String(a.nombre)}</span>
                <Button size="icon" variant="ghost" onClick={() => delAg.mutate(Number(a.id_agencia))}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
        </ul>
        <Input placeholder="Nombre agencia" value={agNombre} onChange={(e) => setAgNombre(e.target.value)} />
        <Button disabled={!agNombre || createAg.isPending} onClick={() => createAg.mutate()}>
          <Plus className="size-4 mr-1" /> Agencia
        </Button>
      </div>
    </div>
  );
}
