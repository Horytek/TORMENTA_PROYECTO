import { Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CREANDO_MODA_V2 } from "../tiktokConfig.v2";

type CropRegion = { objectPosition: string; scale: number };

type DetailZoomProps = {
  src: string;
  region: CropRegion;
  duration?: number;
  from?: number;
};

/** Plano detalle full-bleed con scale + objectPosition animados. */
export function DetailZoom({ src, region, duration, from = 0 }: DetailZoomProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const localDuration = duration ?? durationInFrames;
  const t = interpolate(frame - from, [0, localDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...CREANDO_MODA_V2.ease),
  });
  const scale = interpolate(t, [0, 1], [region.scale * 0.96, region.scale]);

  return (
    <Img
      src={src}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: region.objectPosition,
        transform: `scale(${scale})`,
        transformOrigin: region.objectPosition,
      }}
    />
  );
}
