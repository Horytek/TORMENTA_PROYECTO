import { useState } from "react";
import {
  HorytekMap,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  MapRoute,
} from "./HorytekMap";
import { LIMA_POINTS } from "./lima";

const EVENTS = [
  "Recolectado en almacén",
  "En tránsito Callao → Surco",
  "En reparto local",
  "Entregado",
];

export function ShipMapHero({ accent }: { accent: string }) {
  const [step, setStep] = useState(0);
  const origen = LIMA_POINTS.callao;
  const destino = LIMA_POINTS.surco;

  return (
    <div className="grid h-[360px] gap-3 overflow-hidden rounded-2xl border border-black/5 bg-white/40 p-3 md:grid-cols-[1.2fr_0.8fr]">
      <div className="min-h-[200px] overflow-hidden rounded-xl">
        <HorytekMap center={origen} zoom={11} theme="light" className="rounded-xl">
          {step > 0 ? (
            <MapRoute coordinates={[origen, destino]} color={accent} width={3} />
          ) : null}
          <MapMarker longitude={origen[0]} latitude={origen[1]}>
            <MarkerContent />
            <MarkerLabel>Origen</MarkerLabel>
            <MarkerPopup>Guía · Callao</MarkerPopup>
          </MapMarker>
          <MapMarker longitude={destino[0]} latitude={destino[1]}>
            <MarkerContent />
            <MarkerLabel>Destino</MarkerLabel>
            <MarkerPopup>Destinatario · Surco</MarkerPopup>
          </MapMarker>
        </HorytekMap>
      </div>
      <div className="flex flex-col justify-between rounded-xl border border-black/5 bg-white/80 p-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Timeline guía · demo
          </p>
          <ol className="mt-3 space-y-2">
            {EVENTS.map((e, i) => (
              <li
                key={e}
                className="flex gap-2 text-[12px]"
                style={{ color: i <= step ? accent : undefined, opacity: i <= step ? 1 : 0.45 }}
              >
                <span className="font-mono tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {e}
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, EVENTS.length - 1))}
            className="rounded-xl px-3 py-2 text-[12px] font-semibold text-white"
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
