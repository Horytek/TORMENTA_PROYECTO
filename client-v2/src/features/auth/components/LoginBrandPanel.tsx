import { useEffect, useState } from "react";
import { HorytekIcon } from "@/components/brand/HorytekIcon";
import { getLoginBrandCopy } from "@/features/auth/data/loginBrandPanels";
import { getProductTheme, resolveProductThemeId } from "@/features/platform/ui/productThemes";
import { LoginProductScene } from "./login-scenes/LoginProductScene";

function darkenHex(hex: string, amount = 0.45): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return "#0f172a";
  const r = Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r},${g},${b})`;
}

type LoginBrandPanelProps = {
  mode: string;
};

/** Panel izquierdo del login: atmósfera + escena única por producto. */
export function LoginBrandPanel({ mode }: LoginBrandPanelProps) {
  const productId = resolveProductThemeId(mode);
  const [visible, setVisible] = useState(true);
  const [shownId, setShownId] = useState(productId);

  useEffect(() => {
    if (productId === shownId) return;
    setVisible(false);
    const t = window.setTimeout(() => {
      setShownId(productId);
      setVisible(true);
    }, 160);
    return () => window.clearTimeout(t);
  }, [productId, shownId]);

  const shownTheme = getProductTheme(shownId);
  const shownCopy = getLoginBrandCopy(shownId);
  const bg = darkenHex(shownTheme.accent, 0.72);

  return (
    <aside
      className="relative hidden overflow-hidden text-slate-100 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-12"
      style={{
        background: `linear-gradient(155deg, ${bg} 0%, ${darkenHex(shownTheme.accent, 0.55)} 55%, ${bg} 100%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #ffffff 0 1px, transparent 1px 22px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 transition-colors duration-300"
        style={{ backgroundColor: shownTheme.accent }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full opacity-20 blur-3xl transition-colors duration-500"
        style={{ backgroundColor: shownTheme.accent }}
      />

      <div
        className="relative flex items-center gap-3 transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0.35 }}
      >
        <HorytekIcon size={40} />
        <div className="leading-tight">
          <p className="text-lg font-semibold tracking-tight">
            Horytek{" "}
            <span style={{ color: shownTheme.accent }}>{shownTheme.name}</span>
          </p>
          <p className="text-xs text-white/50">Sistema de gestión</p>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center py-10 transition-all duration-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
        key={shownId}
      >
        <LoginProductScene productId={shownId} />
      </div>

      <div
        className="relative max-w-sm transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0.4 }}
      >
        <p className="text-base font-medium leading-snug text-slate-100">{shownCopy.pitch}</p>
        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {shownCopy.metrics.slice(0, 3).map((m) => (
            <div key={m.label}>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-white/40">{m.label}</dt>
              <dd className="mt-0.5 text-[13px] font-semibold text-white/90">{m.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-[11px] uppercase tracking-[0.16em] text-white/35">
          © {new Date().getFullYear()} Horytek {shownTheme.name}
        </p>
      </div>
    </aside>
  );
}
