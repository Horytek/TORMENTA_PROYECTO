import {
  HorytekMap,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  MapRoute,
} from "@/features/landing/maps/HorytekMap";
import { LIMA_CENTER, LIMA_POINTS } from "@/features/landing/maps/lima";

type Marker = {
  id: string;
  label: string;
  lng: number;
  lat: number;
  popup?: string;
};

type PlatformMapPanelProps = {
  title?: string;
  footnote?: string;
  markers?: Marker[];
  route?: [number, number][];
  center?: [number, number];
  zoom?: number;
  theme?: "light" | "dark";
  className?: string;
};

/** Mapa mapcn reutilizable en apps (coords demo si no hay geo en API). */
export function PlatformMapPanel({
  title = "Mapa",
  footnote = "Demo geo Lima — sin coordenadas de BD aún",
  markers,
  route,
  center = LIMA_CENTER,
  zoom = 12,
  theme = "light",
  className = "h-[280px]",
}: PlatformMapPanelProps) {
  const pins =
    markers ??
    [
      {
        id: "a",
        label: "Punto A",
        lng: LIMA_POINTS.sanIsidro[0],
        lat: LIMA_POINTS.sanIsidro[1],
      },
      {
        id: "b",
        label: "Punto B",
        lng: LIMA_POINTS.miraflores[0],
        lat: LIMA_POINTS.miraflores[1],
      },
    ];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <p className="text-[12px] font-semibold">{title}</p>
        <p className="text-[10px] text-muted-foreground">{footnote}</p>
      </div>
      <div className={className}>
        <HorytekMap center={center} zoom={zoom} theme={theme} className="rounded-none">
          {route ? <MapRoute coordinates={route} color="#0f766e" width={4} /> : null}
          {pins.map((m) => (
            <MapMarker key={m.id} longitude={m.lng} latitude={m.lat}>
              <MarkerContent />
              <MarkerLabel>{m.label}</MarkerLabel>
              {m.popup ? <MarkerPopup>{m.popup}</MarkerPopup> : null}
            </MapMarker>
          ))}
        </HorytekMap>
      </div>
    </div>
  );
}

export { LIMA_CENTER, LIMA_POINTS };
