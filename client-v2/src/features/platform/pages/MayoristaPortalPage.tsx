import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

type Portal = { slug: string; nombre: string; whatsapp?: string };
type Item = { sku: string; nombre: string; precio: number; min_cantidad: number };
type CartLine = { sku: string; cantidad: number };

export default function MayoristaPortalPage() {
  const { slug = "" } = useParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loadError, setLoadError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(Boolean(getMayoristaToken()));
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pedidos, setPedidos] = useState<{ id_pedido: number; total: number; estado: string }[]>([]);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getMayoristaPortal(slug);
        if (!res.success) throw new Error(res.message);
        setPortal(res.data);
      } catch (e: unknown) {
        setLoadError(
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (e as Error).message ||
            "Portal no encontrado"
        );
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

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">Portal B2B</h1>
        <p className="mt-3 text-sm text-destructive">{loadError}</p>
        <Link to="/soluciones/mayorista" className="mt-6 inline-block text-sm underline">
          Ver producto Mayorista
        </Link>
      </div>
    );
  }

  if (!portal) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Cargando portal…</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[linear-gradient(160deg,#f7f5f1_0%,#eef2f4_45%,#f4f7f5_100%)]">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">Mayorista</p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight text-stone-900">{portal.nombre}</h1>
          <p className="mt-2 text-sm text-stone-600">Acceso compradores autorizados · /b2b/{portal.slug}</p>

          <form
            className="mt-10 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setAuthError("");
              try {
                const res = await loginMayorista({ slug, email, password });
                if (!res.success) throw new Error(res.message);
                setMayoristaToken(res.data.token);
                setSession(true);
                toast.success(`Hola, ${res.data.comprador.razon_social}`);
              } catch (err: unknown) {
                setAuthError(
                  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    (err as Error).message ||
                    "No se pudo ingresar"
                );
              }
            }}
          >
            {authError && (
              <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {authError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar al portal
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f4f0]">
      <header className="border-b border-stone-200/80 bg-[#f6f4f0]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">Portal B2B</p>
            <h1 className="font-serif text-xl text-stone-900">{portal.nombre}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMayoristaToken(null);
              setSession(false);
              setCart({});
            }}
          >
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-10 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-700">Lista de precios</h2>
          {items.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">Tu lista aún no tiene productos.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-200">
              {items.map((item) => (
                <li key={item.sku} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-stone-900">{item.nombre}</p>
                    <p className="text-xs text-stone-500">
                      {item.sku} · mín. {item.min_cantidad} · S/ {Number(item.precio).toFixed(2)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    className="w-24"
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
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-700">Mis pedidos</h2>
            {pedidos.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Sin pedidos enviados.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {pedidos.map((p) => (
                  <li key={p.id_pedido} className="flex justify-between border-b border-stone-200 py-2">
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

        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Pedido</h2>
          <p className="mt-1 text-xs text-stone-500">{cartLines.length} líneas</p>
          <p className="mt-4 text-lg font-semibold">S/ {total.toFixed(2)}</p>
          <Button
            className="mt-4 w-full"
            disabled={cartLines.length === 0}
            onClick={async () => {
              try {
                const res = await createMayoristaPedido({ items: cartLines });
                if (!res.success) throw new Error(res.message);
                toast.success(`Pedido #${res.data.id_pedido} enviado`);
                setCart({});
                await refreshCatalog();
              } catch (err: unknown) {
                toast.error(
                  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                    (err as Error).message
                );
              }
            }}
          >
            Enviar pedido
          </Button>
        </aside>
      </main>
    </div>
  );
}
