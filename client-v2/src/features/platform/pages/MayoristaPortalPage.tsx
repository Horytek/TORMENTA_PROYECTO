import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createMayoristaPedido,
  getMayoristaCatalogo,
  getMayoristaPortal,
  getMayoristaToken,
  listMisPedidosMayorista,
  loginMayorista,
  setMayoristaToken,
} from "@/features/platform/api/mayorista";
import { getDemoPortalCreds, isDemoSlug } from "@/features/platform/demo/demoPortalCreds";
import { useDemoAutoEnter } from "@/features/platform/demo/useDemoAutoEnter";
import { OpsShell } from "@/features/platform/ui/OpsShell";
import { EmptyState } from "@/features/platform/ui/EmptyState";

type Portal = { slug: string; nombre: string; whatsapp?: string };
type Item = { sku: string; nombre: string; precio: number; min_cantidad: number };
type CartLine = { sku: string; cantidad: number };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function MayoristaPortalPage() {
  const { slug = "" } = useParams();
  const demo = isDemoSlug(slug) ? getDemoPortalCreds("mayorista", "comprador") : null;
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hadToken] = useState(() => Boolean(getMayoristaToken()));
  const [session, setSession] = useState(hadToken);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pedidos, setPedidos] = useState<{ id_pedido: number; total: number; estado: string }[]>([]);

  const autoPhase = useDemoAutoEnter(Boolean(demo) && !hadToken, async () => {
    if (!demo?.email || !demo.password) throw new Error("Sin credenciales demo");
    const res = await loginMayorista({
      slug,
      email: demo.email,
      password: demo.password,
    });
    if (!res.success || !res.data?.token) throw new Error(res.message || "Demo no disponible");
    setMayoristaToken(res.data.token);
    setSession(true);
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getMayoristaPortal(slug);
        if (!res.success) throw new Error(res.message);
        setPortal(res.data);
      } catch (e: unknown) {
        setLoadError(errMsg(e, "Portal no encontrado"));
      }
    })();
  }, [slug]);

  const refreshCatalog = async () => {
    const cat = await getMayoristaCatalogo();
    if (cat.success) setItems(cat.data.items || []);
    const ped = await listMisPedidosMayorista();
    if (ped.success) setPedidos(ped.data || []);
  };

  useEffect(() => {
    if (session) {
      refreshCatalog().catch(() => {
        setMayoristaToken(null);
        setSession(false);
      });
    }
  }, [session]);

  const cartLines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([sku, cantidad]) => ({ sku, cantidad })),
    [cart]
  );

  const total = useMemo(() => {
    return cartLines.reduce((acc, line) => {
      const item = items.find((i) => i.sku === line.sku);
      return acc + (item ? Number(item.precio) * line.cantidad : 0);
    }, 0);
  }, [cartLines, items]);

  if (loadError || (!session && autoPhase !== "entering") || (!session && autoPhase === "failed")) {
    return <Navigate to="/login?mode=mayorista" replace />;
  }

  if (!portal || autoPhase === "entering") {
    return (
      <div className="flex min-h-dvh items-center justify-center p-12 text-center text-sm text-muted-foreground">
        {autoPhase === "entering" ? "Entrando a la demo…" : "Cargando portal…"}
      </div>
    );
  }

  return (
    <OpsShell
      productId="mayorista"
      companyName={portal.nombre}
      roleLabel="Cliente B2B"
      title="Catálogo"
      width="wide"
      onLogout={() => {
        setMayoristaToken(null);
        setSession(false);
        setCart({});
      }}
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-black/60">Lista de precios</h2>
          {items.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Sin productos" body="Tu lista aún no tiene productos." />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-black/8">
              {items.map((item) => (
                <li key={item.sku} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-xs text-black/45">
                      {item.sku} · mín. {item.min_cantidad} · S/ {Number(item.precio).toFixed(2)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="h-11 w-24"
                    value={cart[item.sku] ?? ""}
                    onChange={(e) =>
                      setCart((prev) => ({
                        ...prev,
                        [item.sku]: Number(e.target.value) || 0,
                      }))
                    }
                    placeholder="Cant."
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black/60">Mis pedidos</h2>
            {pedidos.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="Sin pedidos" body="Aún no has enviado pedidos." />
              </div>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {pedidos.map((p) => (
                  <li key={p.id_pedido} className="flex justify-between border-b border-black/8 py-2">
                    <span>#{p.id_pedido}</span>
                    <span>
                      S/ {Number(p.total).toFixed(2)} · {p.estado}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-black/10 bg-white/90 p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Pedido</h2>
          <p className="mt-1 text-xs text-black/45">{cartLines.length} líneas</p>
          <p className="mt-4 text-lg font-semibold">S/ {total.toFixed(2)}</p>
          <Button
            className="mt-4 min-h-11 w-full"
            disabled={cartLines.length === 0}
            onClick={async () => {
              try {
                const res = await createMayoristaPedido({ items: cartLines });
                if (!res.success) throw new Error(res.message);
                toast.success(`Pedido #${res.data.id_pedido} enviado`);
                setCart({});
                await refreshCatalog();
              } catch (err: unknown) {
                toast.error(errMsg(err, "Error"));
              }
            }}
          >
            Enviar pedido
          </Button>
        </aside>
      </div>
    </OpsShell>
  );
}
