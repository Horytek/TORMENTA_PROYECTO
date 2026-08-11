import { useState } from "react";
import { Bike, Check, Clock3, MapPin, PackageCheck, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import { useLayoutChrome } from "../../layoutShared";

const PEDIDOS = [
  { id: "P-204", cliente: "Valeria Soto", zona: "Surco", ventana: "14:00–14:30", carga: "2 bolsas" },
  { id: "P-205", cliente: "Luis Rojas", zona: "San Borja", ventana: "14:15–14:45", carga: "1 caja" },
  { id: "P-206", cliente: "Ana León", zona: "Miraflores", ventana: "14:30–15:00", carga: "3 bolsas" },
] as const;

const COURIERS = [
  { id: "c1", nombre: "Nora", vehiculo: "Moto", eta: 6, capacidad: "3 pedidos" },
  { id: "c2", nombre: "Iván", vehiculo: "Bici", eta: 9, capacidad: "2 pedidos" },
  { id: "c3", nombre: "Sergio", vehiculo: "Auto", eta: 12, capacidad: "6 pedidos" },
] as const;

export function DeliveryAssignmentInteractive({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [pedidoId, setPedidoId] = useState<(typeof PEDIDOS)[number]["id"]>(PEDIDOS[0].id);
  const [courierId, setCourierId] = useState<string | null>(null);
  const [despachado, setDespachado] = useState(false);
  const pedido = PEDIDOS.find((item) => item.id === pedidoId) ?? PEDIDOS[0];
  const courier = COURIERS.find((item) => item.id === courierId);

  const elegirPedido = (id: (typeof PEDIDOS)[number]["id"]) => {
    setPedidoId(id);
    setCourierId(null);
    setDespachado(false);
  };

  return (
    <section id="flujo" className="border-b border-black/5 bg-background py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: accent.accent }}>
          Mesa de asignación
        </p>
        <h2 className={cn(displayClass, "mt-3 max-w-2xl text-[clamp(1.8rem,3.2vw,2.5rem)] text-balance")}>
          Un pedido entra. Un courier sale.
        </h2>
        <p className="mt-3 max-w-xl text-[14px] text-muted-foreground">
          Prioriza por ventana, revisa capacidad y confirma el despacho sin coordinar por llamadas.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[1.5rem] border border-black/8 bg-white p-5">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" style={{ color: accent.accent }} />
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pedidos listos</p>
            </div>
            <div className="mt-4 space-y-2">
              {PEDIDOS.map((item) => {
                const activo = item.id === pedidoId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => elegirPedido(item.id)}
                    className={cn("w-full rounded-2xl border p-4 text-left transition-all", activo ? "shadow-md" : "border-black/7 hover:border-black/15")}
                    style={activo ? { borderColor: accent.accent, backgroundColor: `${accent.accent}0d` } : undefined}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[12px] font-semibold" style={{ color: accent.accent }}>{item.id}</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 className="h-3 w-3" /> {item.ventana}
                      </span>
                    </span>
                    <span className="mt-2 block text-[14px] font-semibold">{item.cliente}</span>
                    <span className="mt-1 block text-[12px] text-muted-foreground">{item.zona} · {item.carga}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-[#111827] p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Asignar {pedido.id}</p>
                <p className="mt-1 text-[14px] font-semibold">Couriers disponibles para {pedido.zona}</p>
              </div>
              <Bike className="h-5 w-5" style={{ color: accent.accent }} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {COURIERS.map((item) => {
                const activo = item.id === courierId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={despachado}
                    onClick={() => setCourierId(item.id)}
                    className={cn("rounded-2xl border p-4 text-left transition-all disabled:opacity-50", activo ? "border-transparent" : "border-white/10 bg-white/5 hover:bg-white/10")}
                    style={activo ? { backgroundColor: accent.accent } : undefined}
                  >
                    <span className="block text-[14px] font-semibold">{item.nombre}</span>
                    <span className="mt-1 block text-[11px] text-white/60">{item.vehiculo} · ETA {item.eta} min</span>
                    <span className="mt-4 block text-[10px] uppercase tracking-[0.12em] text-white/45">{item.capacidad}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <PackageCheck className="h-5 w-5" style={{ color: accent.accent }} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">
                  {despachado && courier ? `${courier.nombre} va en camino al recojo` : courier ? `${courier.nombre} seleccionado` : "Selecciona un courier"}
                </p>
                <p className="mt-0.5 text-[11px] text-white/50">
                  {despachado ? `${pedido.cliente} recibirá el enlace de seguimiento.` : "La notificación sale al confirmar."}
                </p>
              </div>
              <button
                type="button"
                disabled={!courier}
                onClick={() => setDespachado((value) => !value)}
                className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white disabled:opacity-35"
                style={{ backgroundColor: accent.accent }}
              >
                {despachado ? <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Despachado</span> : "Confirmar salida"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function DeliveryCapacityPlanner({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [pedidos, setPedidos] = useState(4);
  const capacidad = 8;
  return (
    <section id="capacidad-reparto" className="border-b border-black/5 py-16 md:py-20" style={{ background: accent.sectionTint }}>
      <div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Capacidad de salida</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Llena la ruta sin sobrecargarla.</h2>
        <div className="mt-8 rounded-2xl border border-black/8 bg-white p-6"><div className="flex items-end justify-between"><div><p className="text-sm font-semibold">Moto · turno tarde</p><p className="text-xs text-muted-foreground">{pedidos} de {capacidad} pedidos</p></div><span className="font-mono text-3xl font-bold" style={{ color: accent.accent }}>{Math.round(pedidos / capacidad * 100)}%</span></div><div className="mt-5 h-3 rounded-full bg-black/8"><div className="h-full rounded-full transition-[width]" style={{ width: `${pedidos / capacidad * 100}%`, backgroundColor: accent.accent }} /></div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setPedidos((value) => Math.max(0, value - 1))} className="rounded-xl border border-black/10 px-4 py-2">− Pedido</button><button type="button" onClick={() => setPedidos((value) => Math.min(capacidad, value + 1))} className="rounded-xl px-4 py-2 text-white" style={{ backgroundColor: accent.accent }}>+ Pedido</button></div></div>
      </div>
    </section>
  );
}

const ZONAS_DELIVERY = [{ nombre: "Miraflores", eta: 18 }, { nombre: "Surco", eta: 26 }, { nombre: "San Borja", eta: 22 }];

export function DeliveryEtaSimulator({ module }: { module: LandingProductModule }) {
  const { accent, displayClass } = useLayoutChrome(module);
  const [zona, setZona] = useState(ZONAS_DELIVERY[0]);
  const [trafico, setTrafico] = useState(false);
  return (
    <section id="eta-entrega" className="border-b border-black/5 bg-background py-16 md:py-20"><div className="mx-auto max-w-6xl px-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Promesa de entrega</p><h2 className={cn(displayClass, "mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)]")}>Calcula una hora que sí cumplirás.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_.7fr]"><div className="grid gap-2">{ZONAS_DELIVERY.map((item) => <button key={item.nombre} type="button" onClick={() => setZona(item)} className={cn("flex items-center justify-between rounded-xl border p-4 text-left", zona.nombre === item.nombre ? "text-white" : "border-black/8 bg-white")} style={zona.nombre === item.nombre ? { backgroundColor: accent.accent, borderColor: accent.accent } : undefined}><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{item.nombre}</span><span>{item.eta} min</span></button>)}</div><div className="rounded-2xl bg-[#111827] p-6 text-white"><button type="button" onClick={() => setTrafico((value) => !value)} className="text-xs text-white/60">Tráfico: {trafico ? "alto" : "normal"}</button><p className="mt-8 font-mono text-5xl font-bold" style={{ color: accent.accent }}>{zona.eta + (trafico ? 12 : 0)} min</p><p className="mt-2 text-sm text-white/55">ETA hacia {zona.nombre}</p></div></div>
    </div></section>
  );
}
