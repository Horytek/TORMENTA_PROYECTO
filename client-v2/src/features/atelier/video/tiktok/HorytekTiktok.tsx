import { useEffect, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender } from "remotion";
import { FilmGrain } from "../components/FilmGrain";
import { loadAtelierFonts } from "../loadAtelierFonts";
import { PaperVignette } from "./components/PaperVignette";
import { Brief } from "./scenes/Brief";
import { Endcard } from "./scenes/Endcard";
import { Hook } from "./scenes/Hook";
import { Ink } from "./scenes/Ink";
import { Reveal } from "./scenes/Reveal";
import { TIKTOK, tiktokSceneSpans } from "./tiktokConfig";

export function HorytekTiktok() {
  const [handle] = useState(() => delayRender("atelier-fonts-tiktok"));
  const spans = tiktokSceneSpans();

  useEffect(() => {
    void loadAtelierFonts().then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: TIKTOK.colors.paper }}>
      <Sequence from={spans.hook.from} durationInFrames={spans.hook.duration}>
        <Hook />
      </Sequence>
      <Sequence from={spans.brief.from} durationInFrames={spans.brief.duration}>
        <Brief />
      </Sequence>
      <Sequence from={spans.ink.from} durationInFrames={spans.ink.duration}>
        <Ink />
      </Sequence>
      <Sequence from={spans.reveal.from} durationInFrames={spans.reveal.duration}>
        <Reveal />
      </Sequence>
      <Sequence from={spans.endcard.from} durationInFrames={spans.endcard.duration}>
        <Endcard />
      </Sequence>
      <PaperVignette />
      <FilmGrain opacity={0.07} />
    </AbsoluteFill>
  );
}
