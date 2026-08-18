import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { SALES_WHATSAPP_URL, type Mode } from "../data/landing.data";
import { useLandingProduct } from "../hooks/useLandingProduct";
import { getLandingModule } from "../modules/landingModules.registry";
import { InventoryRail } from "../components/InventoryRail";
import { TopBar } from "../components/TopBar";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { TrustStrip } from "../components/TrustStrip";
import { BenefitPillars } from "../components/BenefitPillars";
import { FeatureMatrix } from "../components/FeatureMatrix";
import { ProductFacts } from "../components/ProductFacts";
import { ModuleWall } from "../components/ModuleWall";
import { ProductShowcase } from "../components/ProductShowcase";
import { BlueprintSection } from "../components/BlueprintSection";
import { CaseStudy } from "../components/CaseStudy";
import { SolutionsBridge } from "../components/SolutionsBridge";
import { Pricing } from "../components/Pricing";
import { FAQ } from "../components/FAQ";
import { ExperienceLanding } from "../components/ExperienceLanding";
import { Footer } from "../components/Footer";
import { ScrollUpButton } from "../components/ScrollUpButton";
import { cn } from "@/lib/utils";
import "../styles/landing-system.css";

const LEGACY_SECTION_IDS = [
  "hero",
  "cifras",
  "confianza",
  "beneficios",
  "producto-real",
  "capacidades",
  "modulos",
  "producto",
  "rendimiento",
  "soluciones-puente",
  "planes",
  "preguntas",
] as const;

export default function LandingPage() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { productId, setProductId, legacyMode, isLegacy } = useLandingProduct();
  const landingModule = getLandingModule(productId);
  /** Checkpoints DOM de los layout kits (story/scenario/notFor…), no el sectionOrder legacy. */
  const experienceCheckpoints = [
    "hero",
    "story",
    "scenario",
    "notFor",
    "pricing",
    "faq",
    "cta",
  ] as const;

  useEffect(() => {
    // Home genérica → ERP. Landing de producto (?product= / ?mode=) no debe saltar al dashboard.
    const explicitProduct = search.get("product") || search.get("mode");
    if (isAuthenticated && !explicitProduct) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate, search]);

  return (
    <div className="lp min-h-screen w-full bg-background">
      <InventoryRail
        checkpoints={isLegacy ? LEGACY_SECTION_IDS : experienceCheckpoints}
      />

      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-foreground focus:px-3 focus:py-1.5 focus:text-[12px] focus:text-background"
      >
        Saltar al contenido
      </a>

      <TopBar />
      <Header productId={productId} onProductChange={setProductId} />

      <main key={productId} className="transition-opacity duration-300">
        {isLegacy || landingModule.renderer === "legacy" ? (
          <>
            <Hero mode={legacyMode} />
            {legacyMode === "standard" ? (
              <>
                <ProductFacts />
                <TrustStrip />
                <BenefitPillars />
                <ProductShowcase />
                <FeatureMatrix />
                <ModuleWall />
                <SolutionsBridge />
                <BlueprintSection mode={legacyMode} />
                <CaseStudy mode={legacyMode} />
              </>
            ) : (
              <>
                <BlueprintSection mode={legacyMode} />
                <CaseStudy mode={legacyMode} />
              </>
            )}
            <Pricing mode={legacyMode} />
            <FAQ mode={legacyMode} />
            <CTA mode={legacyMode} />
          </>
        ) : (
          <ExperienceLanding module={landingModule} />
        )}
      </main>

      <Footer />
      <ScrollUpButton />
    </div>
  );
}

function CTA({ mode }: { mode: Mode }) {
  const isPocket = mode === "pocket";
  const isEcommerce = mode === "ecommerce";

  return (
    <section
      className={cn(
        "py-20 text-primary-foreground md:py-24",
        isPocket ? "bg-amber-600" : isEcommerce ? "bg-teal-800" : "bg-primary",
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <h2 className="lp-h2">
              {isPocket
                ? "Lleva tu tienda en el bolsillo."
                : isEcommerce
                  ? "Tu tienda online puede empezar a vender hoy."
                  : "Tu negocio no puede esperar al inventario desordenado."}
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-primary-foreground/80">
              {isPocket
                ? "Empieza con el Plan Diario por S/ 5 y prueba Pocket sin compromiso. Actívalo cuando lo necesites."
                : isEcommerce
                  ? "Elige un plan, configura tu catálogo y recibe los pagos de tus clientes directamente en tu cuenta de Mercado Pago."
                  : "Agenda una demo: te mostramos caja, stock y facturación SUNAT con tu tipo de negocio en mente."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            {isEcommerce ? (
              <Button asChild size="lg" variant="secondary" className="gap-2 px-5">
                <Link to="/registro-ecommerce?plan=starter">
                  Crear mi tienda <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : isPocket ? (
              <Button asChild size="lg" variant="secondary" className="gap-2 px-5">
                <Link to="/login?mode=express">
                  Probar Pocket <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="secondary" className="gap-2 px-5">
                <a href={SALES_WHATSAPP_URL} target="_blank" rel="noreferrer">
                  Pedir una demo <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a href="#planes">Ver planes</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
