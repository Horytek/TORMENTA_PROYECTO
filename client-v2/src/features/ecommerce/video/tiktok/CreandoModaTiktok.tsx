import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
} from "remotion";
import { FilmGrain } from "../../../atelier/video/components/FilmGrain";
import { loadEcommerceFonts } from "./loadEcommerceFonts";
import { Scene01_BrandIntro } from "./scenes/Scene01_BrandIntro";
import { Scene02_VisualImpact } from "./scenes/Scene02_VisualImpact";
import { Scene03_ProductEditorial } from "./scenes/Scene03_ProductEditorial";
import { Scene04_CinematicMoment } from "./scenes/Scene04_CinematicMoment";
import { Scene05_Storefront } from "./scenes/Scene05_Storefront";
import { Scene06_Closing } from "./scenes/Scene06_Closing";
import {
  AUDIO_CUE_FRAMES,
  CREANDO_MODA,
  creandoModaSceneSpans,
} from "./tiktokConfig";

const FASHION_BED = "fashion-bed.mp3";

/** Activa audio solo si existe el archivo en public/ (ver assets/audio/README.md). */
const ENABLE_AUDIO = false;

function musicEnvelope(frame: number, total: number): number {
  const intro = interpolate(frame, [0, 45], [0, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const body = interpolate(frame, [45, total - 60], [0.4, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outro = interpolate(frame, [total - 60, total], [0.85, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(intro > 0 && frame < 45 ? intro : frame > total - 60 ? outro : body, 0.85);
}

export function CreandoModaTiktok() {
  const [handle] = useState(() => delayRender("ecommerce-fonts-creando-moda"));
  const spans = creandoModaSceneSpans();

  useEffect(() => {
    void loadEcommerceFonts().then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: CREANDO_MODA.colors.bg }}>
      <Sequence from={spans.brandIntro.from} durationInFrames={spans.brandIntro.duration}>
        <Scene01_BrandIntro />
      </Sequence>
      <Sequence from={spans.visualImpact.from} durationInFrames={spans.visualImpact.duration}>
        <Scene02_VisualImpact />
      </Sequence>
      <Sequence from={spans.productEditorial.from} durationInFrames={spans.productEditorial.duration}>
        <Scene03_ProductEditorial />
      </Sequence>
      <Sequence from={spans.cinematicMoment.from} durationInFrames={spans.cinematicMoment.duration}>
        <Scene04_CinematicMoment />
      </Sequence>
      <Sequence from={spans.storefront.from} durationInFrames={spans.storefront.duration}>
        <Scene05_Storefront />
      </Sequence>
      <Sequence from={spans.closing.from} durationInFrames={spans.closing.duration}>
        <Scene06_Closing />
      </Sequence>

      {ENABLE_AUDIO ? (
        <Audio
          src={staticFile(FASHION_BED)}
          volume={(f) => musicEnvelope(f, CREANDO_MODA.durationInFrames)}
        />
      ) : null}

      {ENABLE_AUDIO
        ? AUDIO_CUE_FRAMES.map((cue) => (
            <Sequence key={cue} from={cue} durationInFrames={8}>
              <Audio src={staticFile("sfx-whoosh.mp3")} volume={0.15} />
            </Sequence>
          ))
        : null}

      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
}
