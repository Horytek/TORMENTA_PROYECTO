import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExpressMe, expressLogout } from "../api/express";
import type { ExpressMe } from "../types";

/**
 * Landing mínima de Pocket POS tras el login — el dashboard/POS completo de Express
 * no está migrado aún, solo el acceso. Esta página confirma que el token es válido.
 */
export default function ExpressHomePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<ExpressMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getExpressMe()
      .then((data) => { if (mounted) setMe(data); })
      .catch(() => { if (mounted) navigate("/", { replace: true }); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [navigate]);

  const handleLogout = async () => {
    await expressLogout();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">Verificando sesión de Pocket POS…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
        <Store className="h-7 w-7" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Bienvenido a Pocket POS{me?.business_name ? `, ${me.business_name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {me?.email || me?.username || "Sesión activa"} · rol {me?.role || "—"}
        </p>
        <p className="mt-4 max-w-sm text-xs text-muted-foreground">
          El dashboard y punto de venta de Pocket POS todavía no están migrados a esta versión — por ahora esto confirma que el acceso funciona.
        </p>
      </div>
      <Button variant="outline" className="gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </Button>
    </div>
  );
}
