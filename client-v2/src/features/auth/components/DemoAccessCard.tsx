import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LoginDemoBundle } from "@/features/platform/demo/loginDemoBundles";

type DemoAccessCardProps = {
  bundle: LoginDemoBundle;
  accent: string;
  onApply: () => void;
  onEnter?: () => void;
};

/** Tarjeta unificada de acceso demo (todos los productos / roles). */
export function DemoAccessCard({ bundle, accent, onApply, onEnter }: DemoAccessCardProps) {
  if (bundle.lines.length === 0 && !bundle.openHref) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-3 text-[12px] text-muted-foreground">
        {bundle.hint}
      </div>
    );
  }

  const enterLabel = bundle.enterLabel || "Entrar con demo";

  return (
    <div
      className="space-y-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-3"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground">Acceso demostración</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{bundle.hint}</p>
        </div>
      </div>
      {bundle.lines.length > 0 ? (
        <ul className="space-y-1 text-[12px]">
          {bundle.lines.map((l) => (
            <li key={l.label} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{l.label}</span>
              <span className="truncate font-medium tabular-nums text-foreground">{l.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 flex-1 text-[13px] font-semibold"
          onClick={onApply}
        >
          Usar datos demo
        </Button>
        {onEnter ? (
          <Button
            type="button"
            className="min-h-11 flex-1 border-0 text-[13px] font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: accent }}
            onClick={onEnter}
          >
            {enterLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
