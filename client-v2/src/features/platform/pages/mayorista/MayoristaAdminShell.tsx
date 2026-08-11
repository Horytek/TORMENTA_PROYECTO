import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { PlatformShell } from "@/features/platform/ui/PlatformShell";
import { useUserStore } from "@/store/useUserStore";
import { removeToken } from "@/utils/authStorage";
import { MayoristaAdminNav } from "./MayoristaAdminNav";

export function mayoristaErr(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

type ShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/** Consola Mayorista fuera del ERP (JWT ERP + shell de producto). */
export function MayoristaAdminShell({ title, subtitle, children }: ShellProps) {
  const navigate = useNavigate();
  const username = useUserStore((s) => s.usuario || s.user?.username || "");
  const clearUser = useUserStore((s) => s.clearUser);

  return (
    <PlatformShell
      productId="mayorista"
      companyName={username ? `Cuenta ${username}` : "Distribuidor B2B"}
      roleLabel="Admin"
      title={title}
      subtitle={subtitle}
      onLogout={() => {
        void (async () => {
          await removeToken();
          clearUser();
          navigate("/login?mode=mayorista", { replace: true });
        })();
      }}
      actions={
        <Link
          to="/b2b/demo"
          className="hidden text-[12px] font-medium text-black/45 hover:text-foreground sm:inline"
        >
          Ver portal demo
        </Link>
      }
    >
      <MayoristaAdminNav />
      {children}
    </PlatformShell>
  );
}
