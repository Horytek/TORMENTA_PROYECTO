import type { LandingProductModule } from "../modules/landingModule.types";
import { PricingAndFaqCta } from "./layoutShared";
import {
  CaseMetrics,
  FeatureTaxonomy,
  JourneyBoard,
  LimitsCards,
  LimitsDense,
  SignatureBand,
  StoryEditorial,
} from "./sectionVariants";

/**
 * Cuerpo post-hero con composición distinta por familia (rompe el spine
 * Story→Scenario→AntiConfusion idéntico).
 */
export function ExperienceBody({ module }: { module: LandingProductModule }) {
  const kit = module.layoutKitId;

  switch (kit) {
    case "commerce":
      // catalogo-wa / sync / mayorista / preventa — banda oscura + editorial + caso
      return (
        <>
          <SignatureBand module={module} />
          <StoryEditorial module={module} />
          <FeatureTaxonomy module={module} />
          <CaseMetrics module={module} />
          <LimitsDense module={module} />
          <PricingAndFaqCta module={module} />
        </>
      );

    case "map-mobility":
    case "map-fleet":
    case "ship":
      // Mapa ya está en hero — journey + límites cards + caso corto
      return (
        <>
          <SignatureBand module={module} />
          <JourneyBoard module={module} />
          <FeatureTaxonomy module={module} />
          <LimitsCards module={module} />
          <PricingAndFaqCta module={module} />
        </>
      );

    case "rail-ops":
      return (
        <>
          <CaseMetrics module={module} />
          <FeatureTaxonomy module={module} />
          <JourneyBoard module={module} />
          <StoryEditorial module={module} />
          <LimitsDense module={module} />
          <PricingAndFaqCta module={module} />
        </>
      );

    case "plant":
      return (
        <>
          <SignatureBand module={module} />
          <JourneyBoard module={module} />
          <CaseMetrics module={module} />
          <LimitsDense module={module} />
          <PricingAndFaqCta module={module} />
        </>
      );

    case "pipeline":
      return (
        <>
          <JourneyBoard module={module} />
          <SignatureBand module={module} />
          <FeatureTaxonomy module={module} />
          <LimitsCards module={module} />
          <PricingAndFaqCta module={module} />
        </>
      );

    case "learn-book":
      return (
        <>
          <StoryEditorial module={module} />
          <FeatureTaxonomy module={module} />
          <CaseMetrics module={module} />
          <LimitsCards module={module} />
          <PricingAndFaqCta module={module} />
        </>
      );

    default:
      return (
        <>
          <SignatureBand module={module} />
          <FeatureTaxonomy module={module} />
          <CaseMetrics module={module} />
          <LimitsCards module={module} />
          <PricingAndFaqCta module={module} />
        </>
      );
  }
}
