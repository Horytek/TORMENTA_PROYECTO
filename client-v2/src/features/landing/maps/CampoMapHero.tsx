import { useState } from "react";
import {
  HorytekMap,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
} from "./HorytekMap";
import { LIMA_POINTS } from "./lima";

const VISITAS = [
  { id: "v1", name: "Cliente Norte", point: LIMA_POINTS.jesusMaria },
  { id: "v2", name: "Cliente Sur", point: LIMA_POINTS.surco },
  { id: "v3", name: "Cliente Este", point: LIMA_POINTS.laMolina },
];

export function CampoMapHero({ accent }: { accent: string }) {
  const [checked, setChecked] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-black/5 shadow-[0_20px_50px_-28px_var(--lp-accent)]">
      <HorytekMap center={LIMA_POINTS.jesusMaria} zoom={11.2} theme="light">
        {VISITAS.map((v) => (
          <MapMarker
            key={v.id}
            longitude={v.point[0]}
            latitude={v.point[1]}
            onClick={() => {
              setChecked(v.id);
              setCount((c) => c + 1);
            }}
          >
            <MarkerContent />
            <MarkerLabel>{v.name}</MarkerLabel>
            <MarkerPopup>
              {checked === v.id ? "Check-in OK · demo GPS" : "Toca para check-in"}
            </MarkerPopup>
          </MapMarker>
        ))}
      </HorytekMap>
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/5 bg-white/90 p-3 backdrop-blur">
        <p className="text-[12px] text-muted-foreground">
          {checked
            ? `Check-in en ${VISITAS.find((v) => v.id === checked)?.name}`
            : "Toca un pin para check-in GPS"}
        </p>
        <span
          className="rounded-full px-2.5 py-1 font-mono text-[12px] font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          {count} visitas
        </span>
      </div>
    </div>
  );
}
