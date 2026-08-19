import { AbsoluteFill, Img } from "remotion";
import { ImageReveal } from "../../../../atelier/video/components/ImageReveal";
import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import { productsForScene } from "../creandoModa.data";
import { CategoryShowcase } from "../components/CategoryShowcase";
import { SafeStage } from "../components/SafeStage";
import { CREANDO_MODA } from "../tiktokConfig";

/** Escena 3 — Composición editorial con hero + secundarios. */
export function Scene03_ProductEditorial() {
  const [hero] = productsForScene("editorial-hero");
  const secondaries = productsForScene("editorial-secondary");

  if (!hero) return null;

  return (
    <AbsoluteFill style={{ background: CREANDO_MODA.colors.bg }}>
      <SafeStage style={{ display: "flex", flexDirection: "row", gap: 24, alignItems: "stretch" }}>
        <div style={{ flex: 1.15, display: "flex", flexDirection: "column" }}>
          <ImageReveal delay={0} duration={30} direction="up">
            <div
              style={{
                flex: 1,
                borderRadius: 6,
                overflow: "hidden",
                boxShadow: "0 24px 64px rgba(28,25,23,0.14)",
              }}
            >
              <Img
                src={hero.image}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: hero.objectPosition ?? "50% 35%",
                }}
              />
            </div>
          </ImageReveal>
          <TextReveal delay={18} duration={20}>
            <div
              style={{
                marginTop: 24,
                fontFamily: CREANDO_MODA.fonts.display,
                fontSize: 48,
                fontWeight: 600,
                color: CREANDO_MODA.colors.ink,
                lineHeight: 1.05,
              }}
            >
              {hero.name}
            </div>
          </TextReveal>
          <TextReveal delay={26} duration={16} direction="up">
            <div
              style={{
                marginTop: 8,
                fontFamily: CREANDO_MODA.fonts.body,
                fontSize: 32,
                fontWeight: 700,
                color: CREANDO_MODA.colors.accent,
              }}
            >
              {hero.priceLabel}
            </div>
          </TextReveal>
          <CategoryShowcase delay={34} />
        </div>

        <div
          style={{
            width: 280,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            justifyContent: "center",
          }}
        >
          {secondaries.map((p, i) => (
            <ImageReveal key={p.id_producto} delay={12 + i * 10} duration={22} direction="left">
              <div
                style={{
                  borderRadius: 6,
                  overflow: "hidden",
                  boxShadow: "0 12px 32px rgba(28,25,23,0.1)",
                }}
              >
                <Img
                  src={p.image}
                  style={{ width: "100%", height: 200, objectFit: "cover" }}
                />
                <div style={{ padding: "12px 14px", background: CREANDO_MODA.colors.white }}>
                  <div
                    style={{
                      fontFamily: CREANDO_MODA.fonts.body,
                      fontSize: 18,
                      fontWeight: 600,
                      color: CREANDO_MODA.colors.ink,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: CREANDO_MODA.colors.accent,
                      marginTop: 4,
                    }}
                  >
                    {p.priceLabel}
                  </div>
                </div>
              </div>
            </ImageReveal>
          ))}
        </div>
      </SafeStage>
    </AbsoluteFill>
  );
}
