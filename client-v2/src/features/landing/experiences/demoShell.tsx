import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DemoTheme } from "../modules/landingModule.types";

export interface DemoProps {
  accent: string;
  theme?: DemoTheme;
}

const THEME_STYLE: Record<
  DemoTheme,
  { bg: string; fg: string; muted: string; border: string; panel: string; grid: string }
> = {
  ink: {
    bg: "#12151a",
    fg: "#f4f1ec",
    muted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.12)",
    panel: "rgba(0,0,0,0.28)",
    grid: "rgba(255,255,255,0.45)",
  },
  paper: {
    bg: "#faf8f5",
    fg: "#1c1917",
    muted: "rgba(28,25,23,0.45)",
    border: "rgba(28,25,23,0.08)",
    panel: "rgba(255,255,255,0.72)",
    grid: "rgba(28,25,23,0.08)",
  },
  warm: {
    bg: "#fff7ed",
    fg: "#1c1917",
    muted: "rgba(28,25,23,0.42)",
    border: "rgba(154,52,18,0.12)",
    panel: "rgba(255,255,255,0.65)",
    grid: "rgba(154,52,18,0.1)",
  },
  cool: {
    bg: "#f0f9ff",
    fg: "#0f172a",
    muted: "rgba(15,23,42,0.42)",
    border: "rgba(3,105,161,0.12)",
    panel: "rgba(255,255,255,0.7)",
    grid: "rgba(3,105,161,0.1)",
  },
};

export function DemoShell({
  accent,
  children,
  className,
  label,
  theme = "paper",
}: {
  accent: string;
  children: ReactNode;
  className?: string;
  label?: string;
  theme?: DemoTheme;
}) {
  const t = THEME_STYLE[theme];
  const isDark = theme === "ink";

  return (
    <div
      className={cn(
        "relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl border text-[color:var(--demo-fg)]",
        className,
      )}
      style={
        {
          ["--demo-accent" as string]: accent,
          ["--demo-fg" as string]: t.fg,
          ["--demo-muted" as string]: t.muted,
          ["--demo-border" as string]: t.border,
          ["--demo-panel" as string]: t.panel,
          backgroundColor: t.bg,
          borderColor: t.border,
          boxShadow: `0 20px 50px -28px ${accent}`,
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background: isDark
            ? `radial-gradient(ellipse 80% 55% at 70% 20%, ${accent}44, transparent 55%),
               linear-gradient(165deg, #161b22 0%, #12151a 60%, #141816 100%)`
            : `radial-gradient(ellipse 75% 50% at 80% 10%, ${accent}22, transparent 55%),
               linear-gradient(160deg, ${t.bg} 0%, color-mix(in srgb, ${accent} 6%, white) 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: `linear-gradient(${t.grid} 1px, transparent 1px), linear-gradient(90deg, ${t.grid} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      {label ? (
        <p
          className="relative z-[1] px-4 pt-3 text-[10px] font-medium uppercase tracking-[0.2em]"
          style={{ color: t.muted }}
        >
          {label}
        </p>
      ) : null}
      <div className="relative z-[1] h-full p-4 md:p-5">{children}</div>
    </div>
  );
}

export function AccentBtn({
  children,
  onClick,
  className,
  accent,
  variant = "solid",
  theme = "paper",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  accent: string;
  variant?: "solid" | "ghost";
  theme?: DemoTheme;
}) {
  const isDark = theme === "ink";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold tracking-wide transition-all duration-300",
        variant === "solid"
          ? "hover:brightness-110 active:scale-[0.98]"
          : "hover:opacity-90 active:scale-[0.98]",
        className,
      )}
      style={
        variant === "solid"
          ? { backgroundColor: accent, color: isDark ? "#0c0f12" : "#fff" }
          : {
              border: `1px solid ${accent}44`,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)",
              color: "var(--demo-fg)",
            }
      }
    >
      {children}
    </button>
  );
}
