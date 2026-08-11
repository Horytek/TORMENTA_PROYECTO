import { useEffect, useRef, type ReactNode } from "react";
import { Map, MapControls, useMap } from "@/components/ui/map";
import { cn } from "@/lib/utils";
import {
  HORYTEK_MAP_STYLE_DARK,
  HORYTEK_MAP_STYLE_LIGHT,
  LIMA_CENTER,
} from "./lima";

export type HorytekMapProps = {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
  theme?: "light" | "dark";
  showControls?: boolean;
};

const MAP_STYLES = {
  light: HORYTEK_MAP_STYLE_LIGHT,
  dark: HORYTEK_MAP_STYLE_DARK,
} as const;

/** Fuerza resize cuando el contenedor (grid/flex) ya tiene tamaño real. */
function MapResizeSync() {
  const { map } = useMap();
  const observed = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!map) return;
    const container = map.getContainer();
    observed.current = container;

    const resize = () => {
      try {
        map.resize();
      } catch {
        /* ignore */
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    const t = window.setTimeout(resize, 120);

    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [map]);

  return null;
}

/**
 * Wrapper mapcn/MapLibre centrado en Lima por defecto.
 * Estilo raster inline (sin style.json remoto) + tiles CARTO.
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
      styles={MAP_STYLES}
      className={cn("h-full min-h-[280px] w-full rounded-2xl", className)}
    >
      <MapResizeSync />
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
  useMap,
} from "@/components/ui/map";
