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

export function DeliveryMapHero({ accent }: { accent: string }) {
  const [enRuta, setEnRuta] = useState(false);
  const [eta, setEta] = useState(18);
  const tienda = LIMA_POINTS.jesusMaria;
  const cliente = LIMA_POINTS.surco;

  function despachar() {
    setEnRuta(true);
    setEta(18);
    const t = window.setInterval(() => {
      setEta((e) => {
        if (e <= 4) {
          window.clearInterval(t);
          return 3;
        }
        return e - 3;
      });
    }, 600);
  }

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-black/5 shadow-[0_20px_50px_-28px_var(--lp-accent)]">
      <HorytekMap center={tienda} zoom={11.5} theme="light">
        {enRuta ? <MapRoute coordinates={[tienda, cliente]} color={accent} width={4} /> : null}
        <MapMarker longitude={tienda[0]} latitude={tienda[1]}>
          <MarkerContent />
          <MarkerLabel>Recojo</MarkerLabel>
          <MarkerPopup>Tienda · Jesús María</MarkerPopup>
        </MapMarker>
        <MapMarker longitude={cliente[0]} latitude={cliente[1]}>
          <MarkerContent />
          <MarkerLabel>Entrega</MarkerLabel>
          <MarkerPopup>Cliente · Surco</MarkerPopup>
        </MapMarker>
      </HorytekMap>

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2 rounded-xl border border-black/5 bg-white/90 p-3 backdrop-blur">
        <button
          type="button"
          onClick={despachar}
          className="rounded-xl px-3 py-2 text-[12px] font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Despachar encargo
        </button>
        {enRuta ? (
          <>
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[12px] font-semibold tabular-nums text-white"
              style={{ backgroundColor: accent }}
            >
              ETA {eta} min
            </span>
            <button
              type="button"
              onClick={() => {
                setEnRuta(false);
                setEta(18);
              }}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] font-semibold"
            >
              Reset
            </button>
          </>
        ) : (
          <span className="text-[11px] text-muted-foreground">Encargo on-demand · demo geo</span>
        )}
      </div>
    </div>
  );
}
