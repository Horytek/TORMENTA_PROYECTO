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

export function TaxiMapHero({ accent }: { accent: string }) {
  const [requested, setRequested] = useState(false);
  const [driverReady, setDriverReady] = useState(false);
  const origen = LIMA_POINTS.sanIsidro;
  const destino = LIMA_POINTS.miraflores;

  function solicitar() {
    setRequested(true);
    setDriverReady(false);
    window.setTimeout(() => setDriverReady(true), 700);
  }

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-black/5 shadow-[0_20px_50px_-28px_var(--lp-accent)]">
      <HorytekMap center={origen} zoom={12} theme="light" className="rounded-2xl">
        {requested ? (
          <MapRoute coordinates={[origen, destino]} color={accent} width={4} />
        ) : null}
        <MapMarker longitude={origen[0]} latitude={origen[1]}>
          <MarkerContent />
          <MarkerLabel>Origen</MarkerLabel>
          <MarkerPopup>San Isidro · recojo</MarkerPopup>
        </MapMarker>
        <MapMarker longitude={destino[0]} latitude={destino[1]}>
          <MarkerContent />
          <MarkerLabel>Destino</MarkerLabel>
          <MarkerPopup>Miraflores · bajada</MarkerPopup>
        </MapMarker>
        {driverReady ? (
          <MapMarker
            longitude={(origen[0] + destino[0]) / 2}
            latitude={(origen[1] + destino[1]) / 2}
          >
            <MarkerContent />
            <MarkerLabel>Conductor</MarkerLabel>
            <MarkerPopup>Asignado · ~4 min</MarkerPopup>
          </MapMarker>
        ) : null}
      </HorytekMap>

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 rounded-xl border border-black/5 bg-white/90 p-3 backdrop-blur">
        <button
          type="button"
          onClick={solicitar}
          className="rounded-xl px-3 py-2 text-[12px] font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Solicitar viaje
        </button>
        {requested ? (
          <button
            type="button"
            onClick={() => {
              setRequested(false);
              setDriverReady(false);
            }}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] font-semibold"
          >
            Nuevo viaje
          </button>
        ) : null}
        <span className="self-center text-[11px] text-muted-foreground">
          {driverReady
            ? "Conductor asignado · demo geo Lima"
            : requested
              ? "Buscando conductor…"
              : "Mapa MapLibre · demo"}
        </span>
      </div>
    </div>
  );
}
