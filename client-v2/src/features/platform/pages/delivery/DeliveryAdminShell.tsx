import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { setDeliveryAdminToken } from "@/features/platform/api/delivery";
import { DeliveryAdminNav } from "./DeliveryAdminNav";

export function deliveryErr(e: unknown, fallback: string) {
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

export function DeliveryAdminShell({
  title,
  subtitle,
  companyName = "Operador Demo Delivery",
  onLogout,
  children,
}: ShellProps) {
  const navigate = useNavigate();

  return (
    <PlatformShell
      productId="delivery"
      companyName={companyName}
      roleLabel="Admin"
      title={title}
      subtitle={subtitle}
      onLogout={() => {
        setDeliveryAdminToken(null);
        onLogout();
        navigate("/login?mode=delivery", { replace: true });
      }}
      actions={
        <Link
          to="/delivery-admin"
          className="hidden text-[12px] font-medium text-black/45 hover:text-foreground sm:inline"
        >
          Consola
        </Link>
      }
    >
      <DeliveryAdminNav />
      {children}
    </PlatformShell>
  );
}
