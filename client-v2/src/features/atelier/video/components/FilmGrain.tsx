import { AbsoluteFill, useCurrentFrame } from "remotion";

/** Grano de papel. Se desplaza un poco; no es overlay de marca. */
export function FilmGrain({ opacity = 0.055 }: { opacity?: number }) {
  const frame = useCurrentFrame();
  const x = (frame * 2) % 180;
  const y = (frame * 3) % 180;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        mixBlendMode: "multiply",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.17  0 0 0 0 0.16  0 0 0 0 0.14  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        backgroundSize: "180px 180px",
        backgroundPosition: `${x}px ${y}px`,
      }}
    />
  );
}
