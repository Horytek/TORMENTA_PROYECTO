import * as React from "react";
import { cn } from "@/lib/utils";
import type { ItemState, MediaSpec } from "./types";
import { getInitials } from "./types";
import { STATE_TINT, accentVariants, type AccentVariantProps } from "./variants";

/**
 * Sistema de acento — sustituye al "nodo cromático" (dot + línea) del
 * `AdaptiveCard` original. En lugar de un círculo con hue procedural,
 * ahora el acento es un componente con **kind** y **state** explícitos.
 *
 * Kind:
 *   - `solid`       → dot + línea de acento (comportamiento del card actual)
 *   - `gradient`    → dot con dos colores según state (futuro)
 *   - `progress`    → barra vertical de progreso (carga, %)
 *   - `rail-only`   → solo línea vertical (sin dot)
 *   - `image`       → thumb de imagen cuadrada
 *   - `avatar`      → avatar de iniciales con Avatar (Radix)
 *   - `logo`        → logo cuadrado
 *   - `icon`        → icono libre
 *   - `node`        → nodo arbitrario (escape hatch)
 */

export type AccentKind = AccentVariantProps["style"] | "image" | "avatar" | "logo" | "icon" | "node";

export interface AccentProps {
  kind: AccentKind;
  state?: ItemState;
  /** Tinte explícito (color name de la paleta o hex) — sobreescribe state. */
  tint?: string;
  /** Datos del MediaSpec — sólo usados en kinds `image` | `avatar` | `logo` | `icon` | `node`. */
  media?: MediaSpec;
  /** Posición del acento. */
  position?: "left" | "top" | "none";
  className?: string;
  /** Para `kind: progress` — 0-100. */
  progress?: number;
}

export function Accent({ kind, state = "neutral", media, position = "left", className, progress, tint }: AccentProps) {
  if (position === "top") {
    return <AccentTop kind={kind} state={state} media={media} className={className} progress={progress} tint={tint} />;
  }
  if (position === "none") {
    return null;
  }

  const tintClasses = STATE_TINT[state];
  const inlineHue = tint ? computeHue(tint) : null;
  const useProceduralHue = !!inlineHue || className?.includes("golden-node-tint");

  if (kind === "image" && media?.kind === "image") {
    return (
      <div className={cn("flex shrink-0 pl-3 pr-2 border-r border-border/40 rounded-l-2xl", className)}>
        <div className="my-2 h-12 w-12 overflow-hidden rounded-lg bg-muted">
          <img src={media.src} alt={media.alt ?? ""} className="h-full w-full object-cover" />
        </div>
      </div>
    );
  }

  if (kind === "avatar" && media?.kind === "avatar") {
    return (
      <div className={cn("flex shrink-0 items-center pl-3 pr-2 border-r border-border/40 rounded-l-2xl", className)}>
        <div className="my-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground/80 ring-1 ring-border/60">
          {getInitials(media.name)}
        </div>
      </div>
    );
  }

  if (kind === "logo" && media?.kind === "logo") {
    return (
      <div className={cn("flex shrink-0 pl-3 pr-2 border-r border-border/40 rounded-l-2xl", className)}>
        <div className="my-2 h-10 w-10 overflow-hidden rounded-md bg-muted/60 p-1">
          <img src={media.src} alt={media.alt ?? ""} className="h-full w-full object-contain" />
        </div>
      </div>
    );
  }

  if (kind === "icon" && media?.kind === "icon") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-start pl-4 pr-3 border-r rounded-l-2xl",
          tintClasses.bg, tintClasses.border,
          className
        )}
        style={inlineHue ? ({ "--node-hue": `${inlineHue}` } as React.CSSProperties) : undefined}
      >
        <div className="mt-3.5 flex h-5 w-5 items-center justify-center text-foreground/80">
          {media.node}
        </div>
      </div>
    );
  }

  if (kind === "node" && media?.kind === "node") {
    return (
      <div className={cn("flex shrink-0 items-start pl-4 pr-3 border-r border-border/40 rounded-l-2xl", className)}>
        <div className="mt-3.5 flex h-5 w-5 items-center justify-center">{media.node}</div>
      </div>
    );
  }

  if (kind === "rail-only") {
    return (
      <div className={cn("flex w-1.5 shrink-0 items-stretch justify-center border-r-0 rounded-l-2xl", className)}>
        <div
          className={cn("mt-2 mb-2 w-0.5 rounded-full", tintClasses.line, "opacity-60 group-hover/adaptive-card:opacity-100")}
          style={useProceduralHue ? { backgroundColor: `hsl(var(--node-hue), 70%, 70%)` } : undefined}
        />
      </div>
    );
  }

  if (kind === "progress") {
    return (
      <div className={cn("flex w-10 shrink-0 items-center pl-3 pr-2 border-r border-border/40 rounded-l-2xl", className)}>
        <div className="h-16 w-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("w-full rounded-full transition-all duration-500", tintClasses.dot)}
            style={{
              height: `${Math.min(100, Math.max(0, progress ?? 0))}%`,
              ...(useProceduralHue ? { backgroundColor: `hsl(var(--node-hue), 75%, 55%)` } : {}),
            }}
          />
        </div>
      </div>
    );
  }

  // default: solid — dot + línea (replica el render del card original)
  return (
    <div
      className={cn(
        accentVariants({ position, style: "solid" }),
        tintClasses.bg, tintClasses.border,
        "group-hover/adaptive-card:bg-zinc-100/80 dark:group-hover/adaptive-card:bg-zinc-800/60",
        className
      )}
      style={inlineHue ? ({ "--node-hue": `${inlineHue}` } as React.CSSProperties) : undefined}
    >
      <div className="flex items-center mt-3.5">
        {/* Círculo cromático */}
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover/adaptive-card:scale-110">
          <div
            className={cn("h-2 w-2 rounded-full", tintClasses.dot)}
            style={useProceduralHue ? { backgroundColor: `hsl(var(--node-hue), 75%, 55%)` } : undefined}
          />
          {/* Halo */}
          <div
            className={cn("absolute inset-0 rounded-full opacity-0 group-hover/adaptive-card:opacity-30", tintClasses.dot)}
            style={useProceduralHue ? { backgroundColor: `hsl(var(--node-hue), 75%, 55%)` } : undefined}
          />
        </div>

        {/* Línea de acento — se extiende en hover */}
        <div
          className={cn(
            "ml-3 h-px w-4 transition-all duration-300",
            "group-hover/adaptive-card:w-8",
            tintClasses.line, "opacity-50 group-hover/adaptive-card:opacity-80"
          )}
          style={useProceduralHue ? { backgroundColor: `hsl(var(--node-hue), 70%, 70%)` } : undefined}
        />
      </div>
    </div>
  );
}

/** Accent horizontal para variants `media-cover` o `accentPosition: "top"`. */
function AccentTop({ kind, state, media, className, progress, tint }: AccentProps) {
  const tintClasses = STATE_TINT[state ?? "neutral"];
  const inlineHue = tint ? computeHue(tint) : null;
  const useProceduralHue = !!inlineHue || className?.includes("golden-node-tint");

  if (kind === "progress") {
    return (
      <div className={cn("h-0.5 w-full overflow-hidden rounded-t-2xl bg-muted", className)}>
        <div
          className={cn("h-full transition-all duration-500", tintClasses.dot)}
          style={{
            width: `${Math.min(100, Math.max(0, progress ?? 0))}%`,
            ...(useProceduralHue ? { backgroundColor: `hsl(var(--node-hue), 75%, 55%)` } : {}),
          }}
        />
      </div>
    );
  }

  if (kind === "image" && media?.kind === "image") {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-t-2xl bg-muted aspect-[16/9]", className)}>
        <img src={media.src} alt={media.alt ?? ""} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (kind === "logo" && media?.kind === "logo") {
    return (
      <div className={cn("flex w-full items-center justify-center bg-muted/40 py-6 rounded-t-2xl", className)}>
        <img src={media.src} alt={media.alt ?? ""} className="h-12 w-12 object-contain" />
      </div>
    );
  }

  // default — barra fina
  return (
    <div
      className={cn("h-0.5 w-full rounded-t-2xl transition-all duration-300", tintClasses.line, className)}
      style={useProceduralHue ? { backgroundColor: `hsl(var(--node-hue), 70%, 70%)` } : undefined}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Deriva un hue (0-360) determinístico a partir de un string/color.
 * Usado cuando el consumer pasa `accentColor` con un nombre de la paleta
 * o cualquier string — para que el rail adopte un tinte coherente.
 */
function computeHue(input: string): number | null {
  if (!input) return null;
  // Si parece un nombre de la paleta (blue/cyan/etc.), mapeo directo.
  const named: Record<string, number> = {
    blue: 220, violet: 270, cyan: 190, emerald: 152,
    amber: 38, rose: 350, indigo: 240, teal: 175,
    zinc: 220, brand: 205,
  };
  for (const [name, h] of Object.entries(named)) {
    if (input.includes(name)) return h;
  }
  // Hash determinístico
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash * 137.508) % 360;
}
