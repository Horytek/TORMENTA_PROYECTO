import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { LoginDemoBundle } from "@/features/platform/demo/loginDemoBundles";

type DemoAccessCardProps = {
  bundle: LoginDemoBundle;
  accent: string;
  onApply: () => void;
  onEnter?: () => void;
};

/** Acceso demo plegado: no compite con el login real. */
export function DemoAccessCard({ bundle, accent, onApply, onEnter }: DemoAccessCardProps) {
  if (bundle.lines.length === 0 && !bundle.openHref) {
    return (
      <Collapsible>
        <div className="rounded-lg border border-dashed border-border/70">
          <CollapsibleTrigger
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12px] text-muted-foreground transition-colors hover:text-foreground [&[data-state=open]>svg:last-child]:rotate-180"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
            <span className="flex-1 font-medium">Probar con una cuenta demo</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="border-t border-dashed border-border/70 px-3 py-2.5 text-[12px] text-muted-foreground">
              {bundle.hint}
            </p>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  const enterLabel = bundle.enterLabel || "Entrar con demo";

  return (
    <Collapsible>
      <div className="rounded-lg border border-border/60 bg-muted/15">
        <CollapsibleTrigger
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12px] text-muted-foreground transition-colors hover:text-foreground [&[data-state=open]>svg:last-child]:rotate-180"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
          <span className="flex-1 font-medium">Probar con una cuenta demo</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 border-t border-border/60 px-3 py-3">
            <p className="text-[11px] leading-snug text-muted-foreground">{bundle.hint}</p>
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
