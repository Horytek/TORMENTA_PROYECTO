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

import { FilmGrain } from "../../../../atelier/video/components/FilmGrain";

import { loadEcommerceFonts } from "../loadEcommerceFonts";
import { delayRenderUntilAssetsLoaded } from "./preloadCreandoModaAssets";

import { Scene01_Hook } from "./scenes/Scene01_Hook";

import { Scene02_Collection } from "./scenes/Scene02_Collection";

import { Scene03_ProductHero } from "./scenes/Scene03_ProductHero";

import { Scene04_CatalogFlow } from "./scenes/Scene04_CatalogFlow";

import { Scene05_Experience } from "./scenes/Scene05_Experience";

import { Scene06_EcomOverlay } from "./scenes/Scene06_EcomOverlay";

import { Scene07_CTA } from "./scenes/Scene07_CTA";

import {

  AUDIO_CUE_FRAMES_V2,

  CREANDO_MODA_V2,

  creandoModaSceneSpansV2,

} from "./tiktokConfig.v2";



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



/** Composición v2 — fashion reel pantalla llena, paralela a v1. */

export function CreandoModaTiktokV2() {

  const [handle] = useState(() => delayRender("ecommerce-fonts-creando-moda-v2"));

  const spans = creandoModaSceneSpansV2();



  useEffect(() => {

    void Promise.all([loadEcommerceFonts(), delayRenderUntilAssetsLoaded()]).then(() =>

      continueRender(handle),

    );

  }, [handle]);



  return (

    <AbsoluteFill style={{ background: CREANDO_MODA_V2.colors.ink }}>

      <Sequence from={spans.hook.from} durationInFrames={spans.hook.duration}>

        <Scene01_Hook />

      </Sequence>

      <Sequence from={spans.collection.from} durationInFrames={spans.collection.duration}>

        <Scene02_Collection />

      </Sequence>

      <Sequence from={spans.productHero.from} durationInFrames={spans.productHero.duration}>

        <Scene03_ProductHero />

      </Sequence>

      <Sequence from={spans.catalogFlow.from} durationInFrames={spans.catalogFlow.duration}>

        <Scene04_CatalogFlow />

      </Sequence>

      <Sequence from={spans.experience.from} durationInFrames={spans.experience.duration}>

        <Scene05_Experience />

      </Sequence>

      <Sequence from={spans.ecomOverlay.from} durationInFrames={spans.ecomOverlay.duration}>

        <Scene06_EcomOverlay />

      </Sequence>

      <Sequence from={spans.cta.from} durationInFrames={spans.cta.duration}>

        <Scene07_CTA />

      </Sequence>



      {ENABLE_AUDIO ? (

        <Audio

          src={staticFile(FASHION_BED)}

          volume={(f) => musicEnvelope(f, CREANDO_MODA_V2.durationInFrames)}

        />

      ) : null}



      {ENABLE_AUDIO

        ? AUDIO_CUE_FRAMES_V2.map((cue) => (

            <Sequence key={cue} from={cue} durationInFrames={8}>

              <Audio src={staticFile("sfx-whoosh.mp3")} volume={0.12} />

            </Sequence>

          ))

        : null}



      <FilmGrain opacity={0.04} />

    </AbsoluteFill>

  );

}


