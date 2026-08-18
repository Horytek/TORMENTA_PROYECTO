import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getAtelierSession, navForAtelierRole } from "../session";
import { ATELIER_FONTS } from "../tokens";
import { AtelierBottomNav } from "./AtelierBottomNav";
import { AtelierHeader } from "./AtelierHeader";
import "../styles/atelier.css";

const FONT_ID = "atelier-fonts";

function ensureAtelierFonts() {
  let link = document.getElementById(FONT_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = FONT_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = ATELIER_FONTS.href;
}

type AtelierRootProps = {
  children: ReactNode;
  className?: string;
  /** Si true, deja hueco inferior para AtelierBottomNav en móvil. */
  padNav?: boolean;
};

/** Superficie Atelier. No es PlatformShell. El sidebar solo existe en la mesa (admin). */
export function AtelierRoot({ children, className, padNav = false }: AtelierRootProps) {
  useEffect(() => {
    ensureAtelierFonts();
  }, []);

  return <div className={cn("atelier", padNav && "at-pad-nav", className)}>{children}</div>;
}

type AtelierChromeProps = AtelierRootProps & {
  trailing?: ReactNode;
  leading?: ReactNode;
  showBottomNav?: boolean;
  bottomNavItems?: Parameters<typeof AtelierBottomNav>[0]["items"];
};

/** Marco de página Atelier: Root + header sticky + bottom nav móvil (no admin). */
export function AtelierChrome({
  children,
  className,
  padNav = true,
  trailing,
  leading,
  showBottomNav = true,
  bottomNavItems,
}: AtelierChromeProps) {
  const session = getAtelierSession();
  const isAdmin = session?.role === "admin";
  const role = isAdmin ? undefined : session?.role;
  const items = bottomNavItems ?? navForAtelierRole(role);
  const useBottom = showBottomNav && !isAdmin;

  return (
    <AtelierRoot className={className} padNav={padNav && useBottom}>
      <AtelierHeader trailing={trailing} leading={leading} />
      {children}
      {useBottom ? <AtelierBottomNav items={items} /> : null}
    </AtelierRoot>
  );
}
