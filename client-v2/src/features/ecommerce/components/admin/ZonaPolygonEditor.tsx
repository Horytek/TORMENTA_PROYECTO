import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useMap } from "@/components/ui/map";
import { MapGeoJSON } from "@/components/ui/map";
import { HorytekMap } from "@/features/landing/maps/HorytekMap";
import { LIMA_CENTER } from "@/features/landing/maps/lima";
import { Button } from "@/components/ui/button";

type Props = {
  value: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  onChange: (geo: GeoJSON.Polygon | null) => void;
  height?: string;
};

/** Dibujo simple: clicks añaden vértices; cerrar forma al confirmar. */
function DrawClickLayer({
  setPoints,
}: {
  setPoints: Dispatch<SetStateAction<[number, number][]>>;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const onClick = (e: { lngLat: { lng: number; lat: number } }) => {
      setPoints((prev) => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
    };
    map.getCanvas().style.cursor = "crosshair";
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, isLoaded, setPoints]);

  return null;
}

export function ZonaPolygonEditor({ value, onChange, height = "320px" }: Props) {
  const [points, setPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    if (value?.type === "Polygon" && value.coordinates?.[0]?.length) {
      const ring = value.coordinates[0] as [number, number][];
      // sin el punto de cierre duplicado
      const open =
        ring.length > 1 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
          ? ring.slice(0, -1)
          : ring;
      setPoints(open);
    }
  }, [value]);

  const preview: GeoJSON.Feature | null =
    points.length >= 3
      ? {
          type: "Feature",
          properties: { id: "draft" },
          geometry: {
            type: "Polygon",
            coordinates: [[...points, points[0]]],
          },
        }
      : points.length >= 1
        ? {
            type: "Feature",
            properties: { id: "draft-line" },
            geometry: {
              type: "LineString",
              coordinates: points,
            },
          }
        : null;

  const confirm = () => {
    if (points.length < 3) return;
    const polygon: GeoJSON.Polygon = {
      type: "Polygon",
      coordinates: [[...points, points[0]]],
    };
    onChange(polygon);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-stone-200" style={{ height }}>
        <HorytekMap center={LIMA_CENTER} zoom={11.5} theme="light" className="h-full w-full">
          <DrawClickLayer setPoints={setPoints} />
          {preview && (
            <MapGeoJSON
              data={preview}
              promoteId="id"
              fillPaint={{ "fill-color": "#0f766e", "fill-opacity": 0.3 }}
              linePaint={{ "line-color": "#0f766e", "line-width": 2 }}
            />
          )}
        </HorytekMap>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setPoints((p) => p.slice(0, -1))}>
          Deshacer punto
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setPoints([])}>
          Limpiar
        </Button>
        <Button type="button" size="sm" onClick={confirm} disabled={points.length < 3}>
          Guardar polígono ({points.length} pts)
        </Button>
      </div>
      <p className="text-xs text-stone-500">
        Haz clic en el mapa para marcar la zona. Mínimo 3 puntos.
      </p>
    </div>
  );
}
