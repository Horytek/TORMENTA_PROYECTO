import { AbsoluteFill } from "remotion";

/** Viñeta de estudio: el papel se cierra en los bordes, no es overlay de marca. */
export function PaperVignette() {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background:
          "radial-gradient(ellipse at 50% 40%, transparent 38%, rgba(44, 40, 36, 0.18) 100%)",
      }}
    />
  );
}
