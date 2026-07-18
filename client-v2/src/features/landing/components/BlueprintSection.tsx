import { ScanLine, Wallet, BarChart3 } from "lucide-react";
import { LivePermissions } from "./LivePermissions";
import { cn } from "@/lib/utils";
import { POCKET_BLUEPRINT_CARDS, type Mode } from "../data/landing.data";

interface Props {
  mode: Mode;
}

const POCKET_ICONS = [ScanLine, Wallet, BarChart3];

export function BlueprintSection({ mode }: Props) {
  const isPocket = mode === "pocket";

  return (
    <section
      id="producto"
      className={cn(
        "relative border-b border-border/60 py-24 md:py-32",
        isPocket ? "bg-amber-500/[0.03]" : "bg-secondary/20",
      )}
    >
      {/* Blueprint grid sutil — solo en standard */}
      {!isPocket && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      )}

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] backdrop-blur-sm",
              isPocket
                ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
                : "border-brand/30 bg-brand/5 text-brand",
            )}
          >
            {isPocket ? "Simple & Rápido" : "Arquitectura & Seguridad"}
          </span>

          <h2 className="mt-4 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            {isPocket ? (
              <>
                Todo lo que necesitas.
                <br />
                <span className="text-amber-600">Nada que te sobre.</span>
              </>
            ) : (
              <>
                Diseñado para la confianza.
                <br />
                <span className="text-muted-foreground">Construido para escalar.</span>
              </>
            )}
          </h2>

          <p className="mt-4 text-balance text-[15px] leading-relaxed text-muted-foreground">
            {isPocket
              ? "Olvídate de manuales complejos. Pocket está diseñado para que empieces a vender en segundos, no en horas."
              : "Cada acción queda registrada. Cada usuario tiene solo el acceso que necesita. Una estructura de permisos granular que protege tu negocio desde el núcleo."}
          </p>
        </div>

        {isPocket ? <PocketCards /> : <LivePermissions />}
      </div>
    </section>
  );
}

function PocketCards() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
      {POCKET_BLUEPRINT_CARDS.map((card, i) => {
        const Icon = POCKET_ICONS[i] ?? ScanLine;
        return (
          <article
            key={card.title}
            className="group flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center transition-colors hover:border-amber-500/40"
          >
            <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-amber-500/10 text-amber-600 transition-transform group-hover:scale-110">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
              {card.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {card.body}
            </p>
          </article>
        );
      })}
    </div>
  );
}