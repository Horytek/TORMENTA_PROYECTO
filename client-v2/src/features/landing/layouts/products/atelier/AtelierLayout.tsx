import { useEffect, useState } from "react";
import { AtelierRoot } from "@/features/atelier";
import { listAtelierCreators } from "@/features/platform/api/atelier";
import type { AtelierCreator } from "@/features/atelier/types";
import type { LandingProductModule } from "../../../modules/landingModule.types";
import {
  AtelierArtistsStrip,
  AtelierConcept,
  AtelierCtaBand,
  AtelierEditorialHero,
  AtelierHowItWorks,
  AtelierPricingTwo,
  AtelierVideoBlock,
} from "./atelierSections";

export function AtelierLayout({ module }: { module: LandingProductModule }) {
  const [creators, setCreators] = useState<AtelierCreator[]>([]);

  useEffect(() => {
    void listAtelierCreators()
      .then((res) => setCreators(res.data || []))
      .catch(() => setCreators([]));
  }, []);

  return (
    <AtelierRoot>
      <AtelierEditorialHero />
      <AtelierConcept />
      <AtelierVideoBlock />
      <AtelierHowItWorks />
      <AtelierArtistsStrip creators={creators} />
      <AtelierPricingTwo module={module} />
      <AtelierCtaBand />
    </AtelierRoot>
  );
}
