import { useEffect, useMemo, useState } from "react";
import {
  HorytekMap,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  MapRoute,
  useMap,
} from "./HorytekMap";
import { LIMA_POINTS } from "./lima";

/** Formato de datos de prueba — espejo ligero de una guía con hitos. */
export type DemoShipEvent = {
  id: string;
  label: string;
  at: string;
  /** Posición del paquete en este hito [lng, lat] */
  position: [number, number];
};

export type DemoGuia = {
  codigo: string;
  origen: { name: string; coords: [number, number] };
  destino: { name: string; coords: [number, number] };
  /** Waypoints de la ruta demo (incluye origen y destino) */
  route: [number, number][];
  events: DemoShipEvent[];
};

export const DEMO_GUIA_ENVIO: DemoGuia = {
  codigo: "HT-90421",
  origen: { name: "Callao", coords: LIMA_POINTS.callao },
  destino: { name: "Surco", coords: LIMA_POINTS.surco },
  route: [
    LIMA_POINTS.callao,
    LIMA_POINTS.jesusMaria,
    LIMA_POINTS.sanIsidro,
    LIMA_POINTS.miraflores,
    LIMA_POINTS.surco,
  ],
  events: [
    {
      id: "recolectado",
      label: "Recolectado en almacén",
      at: "08:12",
      position: LIMA_POINTS.callao,
    },
    {
      id: "transito",
      label: "En tránsito Callao → Surco",
      at: "10:40",
      position: LIMA_POINTS.jesusMaria,
    },
    {
      id: "reparto",
      label: "En reparto local",
      at: "14:05",
      position: LIMA_POINTS.miraflores,
    },
    {
      id: "entregado",
      label: "Entregado",
      at: "16:22",
      position: LIMA_POINTS.surco,
    },
  ],
};

function lerpLngLat(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Sub-ruta hasta el hito actual (para trazo sólido progresivo). */
function routeUntilStep(guia: DemoGuia, step: number): [number, number][] {
  const total = Math.max(guia.events.length - 1, 1);
  const progress = Math.min(Math.max(step, 0), total) / total;
  const route = guia.route;
  if (route.length < 2) return route;

  const segCount = route.length - 1;
  const exact = progress * segCount;
  const segIdx = Math.min(Math.floor(exact), segCount - 1);
  const segT = exact - segIdx;
  const head = route.slice(0, segIdx + 1);
  const tip = lerpLngLat(route[segIdx], route[segIdx + 1], segT);
  return [...head, tip];
}

function FitGuiaBounds({
  coords,
  step,
}: {
  coords: [number, number][];
  step: number;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map || coords.length < 2) return;

    let minLng = coords[0][0];
    let maxLng = coords[0][0];
    let minLat = coords[0][1];
    let maxLat = coords[0][1];
    for (const [lng, lat] of coords) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    map.resize();
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: { top: 48, bottom: 48, left: 40, right: 40 },
        maxZoom: 12,
        duration: step === 0 ? 0 : 700,
      },
    );
  }, [isLoaded, map, coords, step]);

  return null;
}

export function ShipMapHero({
  accent,
  guia = DEMO_GUIA_ENVIO,
}: {
  accent: string;
  guia?: DemoGuia;
}) {
  const [step, setStep] = useState(0);
  const events = guia.events;
  const current = events[step] ?? events[0];
  const packagePos = current.position;

  const traveled = useMemo(() => routeUntilStep(guia, step), [guia, step]);
  const fullRoute = guia.route;

  return (
    <div className="grid h-[380px] gap-3 overflow-hidden rounded-2xl border border-black/5 bg-white/40 p-3 md:grid-cols-[1.25fr_0.75fr]">
      <div className="relative h-full min-h-[220px] overflow-hidden rounded-xl bg-[#e8eef2]">
        <HorytekMap
          center={guia.origen.coords}
          zoom={11}
          theme="light"
          className="h-full min-h-full rounded-xl"
        >
          <FitGuiaBounds coords={fullRoute} step={step} />

          {/* Ruta planeada (tenue) */}
          <MapRoute
            id="guia-plan"
            coordinates={fullRoute}
            color={accent}
            width={2}
            opacity={0.25}
            dashArray={[2, 2]}
            interactive={false}
          />

          {/* Tramo recorrido según hito */}
          {traveled.length >= 2 ? (
            <MapRoute
              id="guia-traveled"
              coordinates={traveled}
              color={accent}
              width={4}
              opacity={0.9}
              interactive={false}
            />
          ) : null}

          <MapMarker
            longitude={guia.origen.coords[0]}
            latitude={guia.origen.coords[1]}
          >
            <MarkerContent>
              <span
                className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: accent }}
              />
            </MarkerContent>
            <MarkerLabel>Origen</MarkerLabel>
            <MarkerPopup>
              {guia.origen.name} · {guia.codigo}
            </MarkerPopup>
          </MapMarker>

          <MapMarker
            longitude={guia.destino.coords[0]}
            latitude={guia.destino.coords[1]}
          >
            <MarkerContent>
              <span className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-700 shadow-md" />
            </MarkerContent>
            <MarkerLabel>Destino</MarkerLabel>
            <MarkerPopup>Destinatario · {guia.destino.name}</MarkerPopup>
          </MapMarker>

          <MapMarker longitude={packagePos[0]} latitude={packagePos[1]}>
            <MarkerContent>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-lg"
                style={{ backgroundColor: accent }}
              >
                ▶
              </span>
            </MarkerContent>
            <MarkerLabel>Paquete</MarkerLabel>
            <MarkerPopup>
              {current.at} · {current.label}
            </MarkerPopup>
          </MapMarker>
        </HorytekMap>
      </div>

      <div className="flex h-full flex-col justify-between rounded-xl border border-black/5 bg-white/80 p-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Timeline guía · demo
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {guia.codigo}
          </p>
          <ol className="mt-3 space-y-2">
            {events.map((e, i) => {
              const active = i === step;
              const done = i <= step;
              return (
                <li
                  key={e.id}
                  className="flex gap-2 text-[12px] transition-opacity duration-300"
                  style={{
                    color: done ? accent : undefined,
                    opacity: done ? 1 : 0.4,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span className="font-mono tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block">{e.label}</span>
                    <span className="font-mono text-[10px] opacity-70">{e.at}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, events.length - 1))}
            disabled={step >= events.length - 1}
            className="rounded-xl px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: accent }}
          >
            Siguiente evento
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="rounded-xl border border-black/10 px-3 py-2 text-[12px] font-semibold"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
