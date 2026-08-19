import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import { CATEGORIES } from "../creandoModa.data";
import { CREANDO_MODA } from "../tiktokConfig";

type CategoryShowcaseProps = {
  delay?: number;
};

/** Chips de categorías reales del catálogo exportado. */
export function CategoryShowcase({ delay = 0 }: CategoryShowcaseProps) {
  const chips = CATEGORIES.slice(0, 5);
  return (
    <TextReveal delay={delay} duration={20} direction="up">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 20,
        }}
      >
        {chips.map((cat) => (
          <span
            key={cat}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: `1px solid ${CREANDO_MODA.colors.accent}44`,
              background: "rgba(250, 247, 245, 0.92)",
              fontFamily: CREANDO_MODA.fonts.body,
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: CREANDO_MODA.colors.ink,
            }}
          >
            {cat}
          </span>
        ))}
      </div>
    </TextReveal>
  );
}
