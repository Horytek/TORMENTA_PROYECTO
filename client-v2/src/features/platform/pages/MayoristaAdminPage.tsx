import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addMayoristaItem,
  createMayoristaComprador,
  createMayoristaLista,
  createMayoristaTienda,
  listMayoristaListas,
  listMayoristaPedidos,
  listMayoristaTiendas,
  updateMayoristaPedidoEstado,
} from "@/features/platform/api/mayorista";

type Tienda = { id_tienda: number; slug: string; nombre: string; activo: number };
type Lista = { id_lista: number; id_tienda: number; nombre: string; tienda_slug: string };
type Pedido = {
  id_pedido: number;
  estado: string;
  total: number;
  razon_social: string;
  email: string;
  tienda_slug: string;
  creado_en: string;
};

export default function MayoristaAdminPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [listas, setListas] = useState<Lista[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [slug, setSlug] = useState("");
  const [nombreTienda, setNombreTienda] = useState("");
  const [idTiendaLista, setIdTiendaLista] = useState("");
  const [nombreLista, setNombreLista] = useState("");
  const [idListaItem, setIdListaItem] = useState("");
  const [sku, setSku] = useState("");
  const [nombreItem, setNombreItem] = useState("");
  const [precio, setPrecio] = useState("");
  const [idTiendaComprador, setIdTiendaComprador] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [idListaComprador, setIdListaComprador] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [t, l, p] = await Promise.all([
        listMayoristaTiendas(),
        listMayoristaListas(),
        listMayoristaPedidos(),
      ]);
      if (!t.success) throw new Error(t.message || "Sin acceso");
      setTiendas(t.data || []);
      setListas(l.data || []);
      setPedidos(p.data || []);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error).message ||
        "Error al cargar Mayorista";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Cargando Mayorista…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Mayorista</h1>
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 md:p-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Plataforma · Oleada A
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Mayorista B2B</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Portales cerrados, listas por volumen y pedidos. BD propia <code>db_mayorista</code>.
          El comprador entra en <code>/b2b/&#123;slug&#125;</code>.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createMayoristaTienda({ slug, nombre: nombreTienda });
              if (!res.success) throw new Error(res.message);
              toast.success(`Portal listo: /b2b/${slug}`);
              setSlug("");
              setNombreTienda("");
              await load();
            } catch (err: unknown) {
              toast.error((err as Error).message);
            }
          }}
        >
          <h2 className="text-sm font-semibold">Nueva tienda / portal</h2>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="distribuidora-norte" required />
          </div>
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={nombreTienda} onChange={(e) => setNombreTienda(e.target.value)} required />
          </div>
          <Button type="submit" size="sm">
            Crear portal
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createMayoristaLista({
                id_tienda: Number(idTiendaLista),
                nombre: nombreLista,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Lista creada");
              setNombreLista("");
              await load();
            } catch (err: unknown) {
              toast.error((err as Error).message);
            }
          }}
        >
          <h2 className="text-sm font-semibold">Lista de precios</h2>
          <div className="space-y-1.5">
            <Label>Tienda</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={idTiendaLista}
              onChange={(e) => setIdTiendaLista(e.target.value)}
              required
            >
              <option value="">Seleccionar…</option>
              {tiendas.map((t) => (
                <option key={t.id_tienda} value={t.id_tienda}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Nombre lista</Label>
            <Input value={nombreLista} onChange={(e) => setNombreLista(e.target.value)} required />
          </div>
          <Button type="submit" size="sm">
            Crear lista
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await addMayoristaItem({
                id_lista: Number(idListaItem),
                sku,
                nombre: nombreItem,
                precio: Number(precio),
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Ítem agregado");
              setSku("");
              setNombreItem("");
              setPrecio("");
              await load();
            } catch (err: unknown) {
              toast.error((err as Error).message);
            }
          }}
        >
          <h2 className="text-sm font-semibold">Ítem de lista</h2>
          <div className="space-y-1.5">
            <Label>Lista</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={idListaItem}
              onChange={(e) => setIdListaItem(e.target.value)}
              required
            >
              <option value="">Seleccionar…</option>
              {listas.map((l) => (
                <option key={l.id_lista} value={l.id_lista}>
                  {l.nombre} ({l.tienda_slug})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
            <Input
              placeholder="Nombre"
              value={nombreItem}
              onChange={(e) => setNombreItem(e.target.value)}
              required
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Precio"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="sm">
            Agregar ítem
          </Button>
        </form>

        <form
          className="space-y-3 border-b border-border/60 pb-6"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await createMayoristaComprador({
                id_tienda: Number(idTiendaComprador),
                email,
                password,
                razon_social: razonSocial,
                id_lista: idListaComprador ? Number(idListaComprador) : undefined,
              });
              if (!res.success) throw new Error(res.message);
              toast.success("Comprador creado");
              setEmail("");
              setPassword("");
              setRazonSocial("");
              await load();
            } catch (err: unknown) {
              toast.error((err as Error).message);
            }
          }}
        >
          <h2 className="text-sm font-semibold">Comprador B2B</h2>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={idTiendaComprador}
            onChange={(e) => setIdTiendaComprador(e.target.value)}
            required
          >
            <option value="">Tienda…</option>
            {tiendas.map((t) => (
              <option key={t.id_tienda} value={t.id_tienda}>
                {t.nombre}
              </option>
            ))}
          </select>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={idListaComprador}
            onChange={(e) => setIdListaComprador(e.target.value)}
          >
            <option value="">Lista (opcional)…</option>
            {listas.map((l) => (
              <option key={l.id_lista} value={l.id_lista}>
                {l.nombre}
              </option>
            ))}
          </select>
          <Input placeholder="Razón social" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" size="sm">
            Crear comprador
          </Button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Portales</h2>
        {tiendas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Crea el primer portal arriba.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {tiendas.map((t) => (
              <li key={t.id_tienda} className="flex justify-between py-2">
                <span>
                  {t.nombre}{" "}
                  <a className="text-muted-foreground underline-offset-2 hover:underline" href={`/b2b/${t.slug}`}>
                    /b2b/{t.slug}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Pedidos</h2>
        {pedidos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin pedidos todavía.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {pedidos.map((p) => (
              <li key={p.id_pedido} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2">
                <div>
                  <p className="font-medium">
                    #{p.id_pedido} · {p.razon_social}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.email} · S/ {Number(p.total).toFixed(2)} · {p.estado}
                  </p>
                </div>
                <div className="flex gap-1">
                  {["confirmado", "rechazado", "despachado"].map((estado) => (
                    <Button
                      key={estado}
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={async () => {
                        try {
                          await updateMayoristaPedidoEstado(p.id_pedido, estado);
                          toast.success(`Pedido ${estado}`);
                          await load();
                        } catch (err: unknown) {
                          toast.error((err as Error).message);
                        }
                      }}
                    >
                      {estado}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
