import { useEffect, useState } from "react";
import { listAtelierCreators } from "@/features/platform/api/atelier";
import type { AtelierCreator } from "@/features/atelier/types";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import {
  AtelierArtistsStrip,
  AtelierCtaBand,
  AtelierEditorialHero,
  AtelierFaq,
  AtelierHowItWorks,
  AtelierPillars,
  AtelierPricingTwo,
  AtelierProof,
  AtelierTrust,
} from "./atelierSections";

export function AtelierLayout({ module }: { module: LandingProductModule }) {
  const [creators, setCreators] = useState<AtelierCreator[]>([]);

  useEffect(() => {
    void listAtelierCreators()
      .then((res) => setCreators(res.data || []))
      .catch(() => setCreators([]));
  }, []);

  return (
    <>
      <AtelierEditorialHero />
      <AtelierTrust />
      <AtelierPillars />
      <AtelierArtistsStrip creators={creators} />
      <AtelierHowItWorks />
      <AtelierProof />
      <AtelierPricingTwo module={module} />
      <AtelierFaq module={module} />
      <AtelierCtaBand />
    </>
  );
}
