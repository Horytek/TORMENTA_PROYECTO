import type { ReactNode } from "react";
import { Map, MapControls } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import { LIMA_CENTER } from "./lima";

export type HorytekMapProps = {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
  theme?: "light" | "dark";
  showControls?: boolean;
};

/**
 * Wrapper mapcn/MapLibre centrado en Lima por defecto.
 * Tiles CARTO (sin API key). Uso landing + apps movilidad.
 */
export function HorytekMap({
  children,
  className,
  center = LIMA_CENTER,
  zoom = 12,
  theme = "light",
  showControls = true,
}: HorytekMapProps) {
  return (
    <Map
      center={center}
      zoom={zoom}
      theme={theme}
      className={cn("h-full min-h-[280px] w-full rounded-2xl", className)}
    >
      {showControls ? <MapControls showZoom showCompass={false} /> : null}
      {children}
    </Map>
  );
}

export {
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerLabel,
  MapRoute,
} from "@/components/ui/map";
