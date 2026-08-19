import { AbsoluteFill, Img } from "remotion";
import { ImageReveal } from "../../../../atelier/video/components/ImageReveal";
import { TextReveal } from "../../../../atelier/video/components/TextReveal";
import type { CreandoModaProduct } from "../creandoModa.data";
import { CREANDO_MODA } from "../tiktokConfig";

type ProductRevealProps = {
  product: CreandoModaProduct;
  delay?: number;
  size?: "hero" | "secondary";
};

/** Revela producto con wipe + nombre y precio. */
export function ProductReveal({ product, delay = 0, size = "hero" }: ProductRevealProps) {
  const isHero = size === "hero";
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: isHero ? "0 48px 48px" : "0 32px 32px",
      }}
    >
      <ImageReveal delay={delay} duration={28} direction="up">
        <div
          style={{
            width: isHero ? "100%" : "72%",
            height: isHero ? "68%" : "52%",
            marginLeft: isHero ? 0 : "auto",
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(28,25,23,0.18)",
          }}
        >
          <Img
            src={product.image}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: product.objectPosition ?? "50% 35%",
            }}
          />
        </div>
      </ImageReveal>
      <TextReveal delay={delay + 14} duration={18}>
        <div
          style={{
            marginTop: isHero ? 28 : 16,
            fontFamily: CREANDO_MODA.fonts.display,
            fontSize: isHero ? 52 : 34,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: CREANDO_MODA.colors.ink,
            lineHeight: 1.05,
          }}
        >
          {product.name}
        </div>
      </TextReveal>
      <TextReveal delay={delay + 22} duration={14} direction="up">
        <div
          style={{
            marginTop: 8,
            fontFamily: CREANDO_MODA.fonts.body,
            fontSize: isHero ? 32 : 24,
            fontWeight: 600,
            color: CREANDO_MODA.colors.accent,
          }}
        >
          {product.priceLabel}
        </div>
      </TextReveal>
    </AbsoluteFill>
  );
}
