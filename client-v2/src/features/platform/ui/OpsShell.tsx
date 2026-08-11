import type { ReactNode } from "react";
import { getProductTheme } from "./productThemes";
import { ProductAppBar } from "./ProductAppBar";

type OpsWidth = "narrow" | "default" | "wide";

const WIDTH: Record<OpsWidth, string> = {
  narrow: "max-w-md",
  default: "max-w-lg",
  wide: "max-w-5xl",
};

type OpsShellProps = {
  productId: string;
  title: string;
  subtitle?: string;
  /** @deprecated Prefer roleLabel + companyName */
  eyebrow?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  roleLabel?: string;
  onLogout?: () => void;
  showHome?: boolean;
  homeHref?: string;
  /** @deprecated No Login en barra si hay sesión — se ignora */
  loginMode?: string;
  actions?: ReactNode;
  width?: OpsWidth;
  children: ReactNode;
};

export function OpsShell({
  productId,
  title,
  subtitle,
  eyebrow,
  companyName,
  companyLogoUrl,
  roleLabel,
  onLogout,
  showHome = true,
  homeHref,
  actions,
  width = "default",
  children,
}: OpsShellProps) {
  const theme = getProductTheme(productId);

  // Compat: "Pasajero · Operador Demo" → role + company
  let resolvedRole = roleLabel;
  let resolvedCompany = companyName;
  if ((!resolvedRole || !resolvedCompany) && eyebrow) {
    const parts = eyebrow.split("·").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      resolvedRole = resolvedRole || parts[0];
      resolvedCompany = resolvedCompany || parts.slice(1).join(" · ");
    } else if (parts.length === 1) {
      resolvedCompany = resolvedCompany || parts[0];
    }
  }

  return (
    <div
      className="min-h-dvh"
      style={
        {
          backgroundColor: theme.surface,
          color: theme.ink,
          ["--platform-accent" as string]: theme.accent,
          ["--platform-accent-soft" as string]: theme.accentSoft,
          paddingBottom: "env(safe-area-inset-bottom)",
        } as React.CSSProperties
      }
    >
      <ProductAppBar
        productId={productId}
        companyName={resolvedCompany}
        companyLogoUrl={companyLogoUrl}
        roleLabel={resolvedRole}
        showHome={showHome}
        homeHref={homeHref}
        onLogout={onLogout}
        actions={actions}
      />
      <main className={`mx-auto ${WIDTH[width]} space-y-6 px-4 py-6 sm:px-5 sm:py-8`}>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{title}</h1>
          {subtitle ? <p className="mt-1 text-[13px] text-black/50">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
