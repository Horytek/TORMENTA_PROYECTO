import { ATELIER_COLORS, ATELIER_FONTS } from "../tokens";
import { ATELIER_COPY } from "../copy";
import { WashPortrait } from "./assets/frames";

/** Poster estático 16:9 — primer cuadro editorial, sin Remotion. */
export function AdPoster({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        aspectRatio: "16 / 9",
        overflow: "hidden",
        background: ATELIER_COLORS.paper,
        color: ATELIER_COLORS.ink,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.045,
          mixBlendMode: "multiply",
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "grid",
          height: "100%",
          gridTemplateColumns: "1.1fr 0.9fr",
          alignItems: "center",
          gap: "6%",
          padding: "6% 7%",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: ATELIER_FONTS.sans,
              fontSize: "0.7rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: ATELIER_COLORS.stone,
              margin: 0,
            }}
          >
            Horytek Atelier
          </p>
          <p
            className="at-display"
            style={{
              margin: "0.4em 0 0",
              fontSize: "clamp(1.6rem, 4.2vw, 3.4rem)",
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
            }}
          >
            {ATELIER_COPY.taglineFull}
          </p>
        </div>
        <div
          style={{
            justifySelf: "end",
            width: "min(42%, 280px)",
            background: ATELIER_COLORS.offwhite,
            padding: 12,
            boxShadow: "0 18px 40px rgba(44,40,36,0.12)",
          }}
        >
          <WashPortrait />
        </div>
      </div>
    </div>
  );
}
