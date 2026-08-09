import type { ReactNode } from "react";
import { getProductTheme } from "./productThemes";
import { ProductAppBar } from "./ProductAppBar";

type PlatformShellProps = {
  productId: string;
  title: string;
  subtitle?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  roleLabel?: string;
  onLogout?: () => void;
  actions?: ReactNode;
  children: ReactNode;
};

export function PlatformShell({
  productId,
  title,
  subtitle,
  companyName,
  companyLogoUrl,
  roleLabel = "Admin",
  onLogout,
  actions,
  children,
}: PlatformShellProps) {
  const theme = getProductTheme(productId);
  const company = companyName?.trim() || `Operador Demo ${theme.name}`;

  return (
    <div
      className="min-h-dvh"
      style={
        {
          backgroundColor: theme.surface,
          color: theme.ink,
          ["--platform-accent" as string]: theme.accent,
          ["--platform-accent-soft" as string]: theme.accentSoft,
        } as React.CSSProperties
      }
    >
      <ProductAppBar
        productId={productId}
        companyName={company}
        companyLogoUrl={companyLogoUrl}
        roleLabel={roleLabel}
        onLogout={onLogout}
        actions={actions}
      />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 md:space-y-8 md:px-6 md:py-8">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold tracking-tight md:text-[22px]">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-[13px] text-black/50 md:text-[14px]">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
