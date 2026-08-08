import { useState } from "react";
import {
  HorytekMap,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
} from "./HorytekMap";
import { LIMA_CENTER, LIMA_POINTS } from "./lima";

const UNITS = [
  {
    id: "abc123",
    placa: "ABC-123",
    lng: LIMA_POINTS.sanIsidro[0],
    lat: LIMA_POINTS.sanIsidro[1],
    soat: "2026-11-12",
    comb: "42 L",
  },
  {
    id: "def456",
    placa: "DEF-456",
    lng: LIMA_POINTS.callao[0],
    lat: LIMA_POINTS.callao[1],
    soat: "2026-08-30",
    comb: "18 L",
  },
  {
    id: "ghi789",
    placa: "GHI-789",
    lng: LIMA_POINTS.laMolina[0],
    lat: LIMA_POINTS.laMolina[1],
    soat: "2027-01-05",
    comb: "55 L",
  },
];

export function FleetMapHero({ accent }: { accent: string }) {
  const [selected, setSelected] = useState<(typeof UNITS)[0] | null>(UNITS[0]);

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-black/5 shadow-[0_20px_50px_-28px_var(--lp-accent)]">
      <HorytekMap center={LIMA_CENTER} zoom={11} theme="light">
        {UNITS.map((u) => (
          <MapMarker
            key={u.id}
            longitude={u.lng}
            latitude={u.lat}
            onClick={() => setSelected(u)}
          >
            <MarkerContent />
            <MarkerLabel>{u.placa}</MarkerLabel>
            <MarkerPopup>
              {u.placa} · SOAT {u.soat}
            </MarkerPopup>
          </MapMarker>
        ))}
      </HorytekMap>

      <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-black/5 bg-white/90 p-3 backdrop-blur">
        {selected ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Unidad seleccionada · demo geo
              </p>
              <p className="text-[15px] font-semibold" style={{ color: accent }}>
                {selected.placa}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                SOAT vence {selected.soat} · Combustible {selected.comb}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">Clic en un pin para cambiar</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
