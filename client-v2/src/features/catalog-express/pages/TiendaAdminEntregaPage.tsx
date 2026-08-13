import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, Package, Store, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminEntrega, adminSaveEntrega } from "../api/catalogoPublico";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Panel = "retiro" | "delivery" | "provincia" | null;

function formatPen(n: number) {
  return `S/ ${Number(n || 0).toFixed(2)}`;
}

export default function TiendaAdminEntregaPage() {
  const qc = useQueryClient();
  const [panel, setPanel] = useState<Panel>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tienda-admin-entrega"],
    queryFn: adminEntrega,
  });
  const config = data?.config as Record<string, unknown> | undefined;
  const zonas = (data?.zonas || []) as Record<string, unknown>[];
  const destinos = (data?.destinos || []) as Record<string, unknown>[];
  const agencias = (data?.agencias || []) as Record<string, unknown>[];
  const sucursales = (data?.sucursales || []) as {
    nombre: string;
    allow_pickup?: boolean;
  }[];

  const patchMut = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminSaveEntrega(body),
    onSuccess: () => {
      toast.success("Configuración guardada");
      qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] });
    },
    onError: () => toast.error("No se pudo guardar"),
  });

  const cards = useMemo(
    () => [
      {
        key: "retiro" as const,
        title: "Retiro en tienda",
        icon: Store,
        activo: Boolean(Number(config?.retiro_activo ?? 1)),
        resumen: "Gratis · QR en mostrador",
        toggle: (v: boolean) => patchMut.mutate({ config: { ...config, retiro_activo: v } }),
      },
      {
        key: "delivery" as const,
        title: "Delivery",
        icon: Bike,
        activo: Boolean(Number(config?.delivery_activo)),
        resumen:
          config?.delivery_gratis_desde != null
            ? `Gratis desde ${formatPen(Number(config.delivery_gratis_desde))}`
            : "Tarifa por zona o fija",
        toggle: (v: boolean) => patchMut.mutate({ config: { ...config, delivery_activo: v } }),
      },
      {
        key: "provincia" as const,
        title: "Envío a provincia",
        icon: Package,
        activo: Boolean(Number(config?.provincia_activo)),
        resumen: "Tarifas por destino + agencias",
        toggle: (v: boolean) => patchMut.mutate({ config: { ...config, provincia_activo: v } }),
      },
    ],
    [config, patchMut]
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">Entregas</h1>
        <p className="text-sm text-stone-500 mt-1">
          Activa métodos y configura costos. El checkout solo muestra lo activo.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-stone-400">Cargando…</p>
      ) : (
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
      )}

      {panel && config && (
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
            {panel === "retiro" && (
              <RetiroPanel
                config={config}
                sucursales={sucursales}
                onSave={(body) => patchMut.mutate({ config: { ...config, ...body } })}
                pending={patchMut.isPending}
              />
            )}
            {panel === "delivery" && (
              <DeliveryPanel
                config={config}
                zonas={zonas}
                onSaveConfig={(body) => patchMut.mutate({ config: { ...config, ...body } })}
                pending={patchMut.isPending}
              />
            )}
            {panel === "provincia" && (
              <ProvinciaPanel
                config={config}
                destinos={destinos}
                agencias={agencias}
                onSaveConfig={(body) => patchMut.mutate({ config: { ...config, ...body } })}
                pending={patchMut.isPending}
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
  sucursales,
  onSave,
  pending,
}: {
  config: Record<string, unknown>;
  sucursales: { nombre: string; allow_pickup?: boolean }[];
  onSave: (b: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const [prep, setPrep] = useState(String(config.retiro_prep_minutos ?? config.tiempo_preparacion_min ?? 60));
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
      <p className="text-sm text-stone-500">
        Sucursales con recojo:{" "}
        {sucursales.filter((s) => s.allow_pickup).map((s) => s.nombre).join(", ") || "ninguna"}
      </p>
      <Button
        disabled={pending}
        onClick={() =>
          onSave({
            retiro_prep_minutos: Number(prep) || null,
            tiempo_preparacion_min: Number(prep) || 60,
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
  zonas,
  onSaveConfig,
  pending,
}: {
  config: Record<string, unknown>;
  zonas: Record<string, unknown>[];
  onSaveConfig: (b: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const qc = useQueryClient();
  const [costoDefault, setCostoDefault] = useState(String(config.costo_default ?? 0));
  const [pedidoMin, setPedidoMin] = useState(
    config.delivery_pedido_min != null ? String(config.delivery_pedido_min) : ""
  );
  const [gratis, setGratis] = useState(
    config.delivery_gratis_desde != null ? String(config.delivery_gratis_desde) : ""
  );
  const [nombre, setNombre] = useState("");
  const [distritos, setDistritos] = useState("");
  const [costo, setCosto] = useState("10");

  const createZona = useMutation({
    mutationFn: () =>
      adminSaveEntrega({
        zona: {
          nombre,
          distritos: distritos
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
          costo: Number(costo) || 0,
        },
      }),
    onSuccess: () => {
      toast.success("Zona creada");
      setNombre("");
      setDistritos("");
      qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] });
    },
    onError: () => toast.error("No se pudo crear la zona"),
  });

  const delZona = useMutation({
    mutationFn: (id: number) => adminSaveEntrega({ delete_zona: id }),
    onSuccess: () => {
      toast.success("Zona desactivada");
      qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <Label>Costo por defecto</Label>
          <Input value={costoDefault} onChange={(e) => setCostoDefault(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Pedido mínimo</Label>
          <Input value={pedidoMin} onChange={(e) => setPedidoMin(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Gratis desde</Label>
          <Input value={gratis} onChange={(e) => setGratis(e.target.value)} className="mt-1" />
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            onSaveConfig({
              costo_default: Number(costoDefault) || 0,
              delivery_pedido_min: pedidoMin === "" ? null : Number(pedidoMin),
              delivery_gratis_desde: gratis === "" ? null : Number(gratis),
            })
          }
        >
          Guardar reglas
        </Button>
      </div>
      <div className="border-t pt-4 space-y-3">
        <h4 className="font-medium">Zonas (distritos)</h4>
        <ul className="space-y-2">
          {zonas
            .filter((z) => z.activo !== 0 && z.activo !== false)
            .map((z) => (
              <li key={String(z.id_zona)} className="flex justify-between text-sm border rounded-lg px-3 py-2">
                <span>
                  {String(z.nombre)} · {formatPen(Number(z.costo))}
                </span>
                <Button size="icon" variant="ghost" onClick={() => delZona.mutate(Number(z.id_zona))}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
        </ul>
        <div className="space-y-2">
          <Input placeholder="Nombre de zona" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input
            placeholder="Distritos (separados por coma)"
            value={distritos}
            onChange={(e) => setDistritos(e.target.value)}
          />
          <Input placeholder="Costo" value={costo} onChange={(e) => setCosto(e.target.value)} />
          <Button
            disabled={!nombre.trim() || createZona.isPending}
            onClick={() => createZona.mutate()}
            className="gap-1"
          >
            <Plus className="size-4" /> Agregar zona
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProvinciaPanel({
  config,
  destinos,
  agencias,
  onSaveConfig,
  pending,
}: {
  config: Record<string, unknown>;
  destinos: Record<string, unknown>[];
  agencias: Record<string, unknown>[];
  onSaveConfig: (b: Record<string, unknown>) => void;
  pending: boolean;
}) {
  const qc = useQueryClient();
  const [pedidoMin, setPedidoMin] = useState(
    config.provincia_pedido_min != null ? String(config.provincia_pedido_min) : ""
  );
  const [cond, setCond] = useState(String(config.provincia_condiciones || ""));
  const [reqAg, setReqAg] = useState(Boolean(Number(config.provincia_requiere_agencia)));
  const [dep, setDep] = useState("");
  const [prov, setProv] = useState("");
  const [costo, setCosto] = useState("15");
  const [agNombre, setAgNombre] = useState("");

  const createDest = useMutation({
    mutationFn: () =>
      adminSaveEntrega({
        destino: { departamento: dep, provincia: prov || null, costo: Number(costo) || 0 },
      }),
    onSuccess: () => {
      toast.success("Destino creado");
      setDep("");
      setProv("");
      qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] });
    },
  });
  const delDest = useMutation({
    mutationFn: (id: number) => adminSaveEntrega({ delete_destino: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] }),
  });
  const createAg = useMutation({
    mutationFn: () => adminSaveEntrega({ agencia: { nombre: agNombre } }),
    onSuccess: () => {
      toast.success("Agencia creada");
      setAgNombre("");
      qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] });
    },
  });
  const delAg = useMutation({
    mutationFn: (id: number) => adminSaveEntrega({ delete_agencia: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tienda-admin-entrega"] }),
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
            .filter((d) => d.activo !== 0 && d.activo !== false)
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
        <Input placeholder="Departamento" value={dep} onChange={(e) => setDep(e.target.value)} />
        <Input placeholder="Provincia (opcional)" value={prov} onChange={(e) => setProv(e.target.value)} />
        <Input placeholder="Costo" value={costo} onChange={(e) => setCosto(e.target.value)} />
        <Button disabled={!dep.trim() || createDest.isPending} onClick={() => createDest.mutate()}>
          <Plus className="size-4 mr-1" /> Agregar destino
        </Button>
      </div>
      <div className="border-t pt-4 space-y-3">
        <h4 className="font-medium">Agencias</h4>
        <ul className="space-y-2">
          {agencias
            .filter((a) => a.activo !== 0 && a.activo !== false)
            .map((a) => (
              <li key={String(a.id_agencia)} className="flex justify-between text-sm border rounded-lg px-3 py-2">
                <span>{String(a.nombre)}</span>
                <Button size="icon" variant="ghost" onClick={() => delAg.mutate(Number(a.id_agencia))}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
        </ul>
        <Input placeholder="Nombre de agencia" value={agNombre} onChange={(e) => setAgNombre(e.target.value)} />
        <Button disabled={!agNombre.trim() || createAg.isPending} onClick={() => createAg.mutate()}>
          <Plus className="size-4 mr-1" /> Agregar agencia
        </Button>
      </div>
    </div>
  );
}
