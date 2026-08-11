import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { TaxiAdminNav } from "./TaxiAdminNav";
import { setTaxiAdminToken } from "@/features/platform/api/taxi";

export function taxiErr(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

type ShellProps = {
  title: string;
  subtitle?: string;
  companyName?: string;
  onLogout: () => void;
  children: ReactNode;
};

export function TaxiAdminShell({
  title,
  subtitle,
  companyName = "Operador Demo Taxi",
  onLogout,
  children,
}: ShellProps) {
  return (
    <PlatformShell
      productId="taxi"
      companyName={companyName}
      roleLabel="Admin"
      title={title}
      subtitle={subtitle}
      onLogout={() => {
        setTaxiAdminToken(null);
        onLogout();
      }}
      actions={
        <Link
          to="/taxi-admin"
          className="hidden text-[12px] font-medium text-black/45 hover:text-foreground sm:inline"
        >
          Consola
        </Link>
      }
    >
      <TaxiAdminNav />
      {children}
    </PlatformShell>
  );
}
