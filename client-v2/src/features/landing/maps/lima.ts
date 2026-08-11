import type { StyleSpecification } from "maplibre-gl";

/** Coordenadas demo Lima (lng, lat) — placeholders geo, no BD. */
export const LIMA_CENTER: [number, number] = [-77.0428, -12.0464];

export const LIMA_POINTS = {
  miraflores: [-77.0305, -12.1191] as [number, number],
  sanIsidro: [-77.0365, -12.0969] as [number, number],
  surco: [-76.9978, -12.1359] as [number, number],
  laMolina: [-76.9445, -12.0776] as [number, number],
  callao: [-77.125, -12.0508] as [number, number],
  jesusMaria: [-77.0456, -12.0763] as [number, number],
};

/**
 * Estilo raster inline (sin fetch de style.json remoto).
 * Evita el loader eterno si Carto GL Style no responde; los tiles llegan después.
 */
export const HORYTEK_MAP_STYLE_LIGHT: StyleSpecification = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© CARTO © OpenStreetMap",
      maxzoom: 20,
    },
  },
  layers: [{ id: "carto-light", type: "raster", source: "carto-light" }],
};

export const HORYTEK_MAP_STYLE_DARK: StyleSpecification = {
  version: 8,
  sources: {
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© CARTO © OpenStreetMap",
      maxzoom: 20,
    },
  },
  layers: [{ id: "carto-dark", type: "raster", source: "carto-dark" }],
};
