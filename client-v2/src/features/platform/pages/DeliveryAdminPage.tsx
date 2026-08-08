import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bootstrapDelivery,
  createDeliveryRepartidor,
  getDeliveryToken,
  listDeliveryPedidos,
  listDeliveryRepartidores,
  loginDeliveryAdmin,
  patchDeliveryPedido,
  setDeliveryToken,
} from "@/features/platform/api/delivery";

type Pedido = {
  id_pedido: number;
  recojo: string;
  entrega: string;
  estado: string;
};
type Repartidor = { id_repartidor: number; nombre: string; telefono?: string };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function DeliveryAdminPage() {
  const [session, setSession] = useState(Boolean(getDeliveryToken()));
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repNombre, setRepNombre] = useState("");
  const [repTel, setRepTel] = useState("");
  const [repPass, setRepPass] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, r] = await Promise.all([listDeliveryPedidos(), listDeliveryRepartidores()]);
      if (!p.success) throw new Error(p.message || "Sin acceso");
      setPedidos(p.data || []);
      setRepartidores(r.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Delivery"));
      setDeliveryToken(null);
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  if (!session) {
    return (
      <div className="mx-auto max-w-md space-y-6 p-6 md:p-8">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Delivery · Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {mode === "login" ? "Iniciar sesión" : "Crear operador"}
          </h1>
        </header>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res =
                mode === "bootstrap"
                  ? await bootstrapDelivery({ slug, nombre, email, password })
                  : await loginDeliveryAdmin({ slug, email, password });
              if (!res.success) throw new Error(res.message);
              if (res.data?.token) setDeliveryToken(res.data.token);
              setSession(true);
            } catch (err: unknown) {
              toast.error(errMsg(err, "Error"));
            }
          }}
        >
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} required />
          {mode === "bootstrap" && (
            <>
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </>
          )}
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Label>Contraseña</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            {mode === "bootstrap" ? "Crear" : "Entrar"}
          </Button>
        </form>
        <button
          type="button"
          className="text-sm text-muted-foreground underline"
          onClick={() => setMode(mode === "login" ? "bootstrap" : "login")}
        >
          {mode === "login" ? "¿Primera vez? Crear operador" : "Ya tengo cuenta"}
        </button>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Delivery…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Delivery</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 md:p-8">
      <header className="flex justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Plataforma · Oleada D
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Delivery · Control</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setDeliveryToken(null);
            setSession(false);
          }}
        >
          Salir
        </Button>
      </header>

      <form
        className="max-w-md space-y-3 border-b border-border/60 pb-6"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createDeliveryRepartidor({
              nombre: repNombre,
              telefono: repTel || undefined,
              password: repPass,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Repartidor creado");
            setRepNombre("");
            setRepTel("");
            setRepPass("");
            await load();
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <h2 className="text-sm font-semibold">Nuevo repartidor</h2>
        <Input placeholder="Nombre" value={repNombre} onChange={(e) => setRepNombre(e.target.value)} required />
        <Input placeholder="Teléfono" value={repTel} onChange={(e) => setRepTel(e.target.value)} />
        <Input
          type="password"
          placeholder="Contraseña"
          value={repPass}
          onChange={(e) => setRepPass(e.target.value)}
          required
        />
        <Button type="submit" size="sm">
          Crear
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Repartidores</h2>
        {repartidores.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin repartidores.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {repartidores.map((r) => (
              <li key={r.id_repartidor} className="py-2">
                {r.nombre}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Pedidos</h2>
        {pedidos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin pedidos.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {pedidos.map((p) => (
              <li
                key={p.id_pedido}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2"
              >
                <span>
                  #{p.id_pedido} · {p.recojo} → {p.entrega}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase text-muted-foreground">{p.estado}</span>
                  {p.estado === "solicitado" && repartidores[0] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await patchDeliveryPedido(p.id_pedido, {
                            estado: "asignado",
                            id_repartidor: repartidores[0].id_repartidor,
                          });
                          if (!res.success) throw new Error(res.message);
                          await load();
                        } catch (err: unknown) {
                          toast.error(errMsg(err, "Error"));
                        }
                      }}
                    >
                      Asignar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
