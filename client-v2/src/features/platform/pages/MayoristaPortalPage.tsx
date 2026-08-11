import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMayoristaPedido,
  getMayoristaCatalogo,
  getMayoristaPortal,
  getMayoristaToken,
  listMisPedidosMayorista,
  loginMayorista,
  setMayoristaToken,
} from "@/features/platform/api/mayorista";
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
  const navigate = useNavigate();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hadToken] = useState(() => Boolean(getMayoristaToken()));
  const [session, setSession] = useState(hadToken);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pedidos, setPedidos] = useState<{ id_pedido: number; total: number; estado: string }[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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

  const doLogin = async (em: string, pass: string) => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await loginMayorista({
        slug,
        email: em.trim(),
        password: pass,
      });
      if (!res.success || !res.data?.token) {
        throw new Error(res.message || "Credenciales inválidas");
      }
      setMayoristaToken(res.data.token);
      setSession(true);
    } catch (e: unknown) {
      setLoginError(errMsg(e, "No se pudo iniciar sesión"));
    } finally {
      setLoginLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Link
          to="/login?mode=mayorista"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Ir al login Mayorista
        </Link>
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-12 text-center text-sm text-muted-foreground">
        Cargando portal…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FFFBEB] px-4 py-10">
        <form
          className="w-full max-w-md space-y-4 rounded-2xl border border-black/8 bg-white p-6 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void doLogin(email, password);
          }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B45309]">
              Portal B2B
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">{portal.nombre}</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Slug <span className="font-mono">{slug}</span>
            </p>
          </div>
          {loginError ? (
            <p className="text-[13px] text-destructive" role="alert">
              {loginError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="b2b_email">Email</Label>
            <Input
              id="b2b_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="comprador@empresa.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b2b_pass">Contraseña</Label>
            <Input
              id="b2b_pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="min-h-11 w-full bg-[#B45309] hover:bg-[#B45309]/90"
            disabled={loginLoading}
          >
            {loginLoading ? "Entrando…" : "Entrar"}
          </Button>
          <p className="text-center text-[12px] text-muted-foreground">
            ¿Demo? Usa el{" "}
            <Link
              to="/login?mode=mayorista"
              className="font-medium text-[#B45309] underline-offset-4 hover:underline"
            >
              login Mayorista
            </Link>
            .
          </p>
        </form>
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
        navigate("/login?mode=mayorista", { replace: true });
      }}
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-black/60">
            Lista de precios
          </h2>
          {items.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Sin productos" body="Tu lista aún no tiene productos." />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-black/8">
              {items.map((item) => (
                <li
                  key={item.sku}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-black/60">
              Mis pedidos
            </h2>
            {pedidos.length === 0 ? (
              <div className="mt-3">
                <EmptyState title="Sin pedidos" body="Aún no has enviado pedidos." />
              </div>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {pedidos.map((p) => (
                  <li
                    key={p.id_pedido}
                    className="flex justify-between border-b border-black/8 py-2"
                  >
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
