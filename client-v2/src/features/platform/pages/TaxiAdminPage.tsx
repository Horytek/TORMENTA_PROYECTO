import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  bootstrapTaxi,
  createTaxiConductor,
  getTaxiToken,
  listTaxiConductores,
  listTaxiViajes,
  loginTaxiAdmin,
  patchTaxiViaje,
  setTaxiToken,
} from "@/features/platform/api/taxi";

type Viaje = {
  id_viaje: number;
  origen: string;
  destino: string;
  estado: string;
};
type Conductor = { id_conductor: number; nombre: string; telefono?: string; activo: number };

function errMsg(e: unknown, fallback: string) {
  return (
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (e as Error).message ||
    fallback
  );
}

export default function TaxiAdminPage() {
  const [session, setSession] = useState(Boolean(getTaxiToken()));
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [condNombre, setCondNombre] = useState("");
  const [condTel, setCondTel] = useState("");
  const [condPass, setCondPass] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [v, c] = await Promise.all([listTaxiViajes(), listTaxiConductores()]);
      if (!v.success) throw new Error(v.message || "Sin acceso");
      setViajes(v.data || []);
      setConductores(c.data || []);
    } catch (e: unknown) {
      setError(errMsg(e, "Error al cargar Taxi"));
      setTaxiToken(null);
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
            Taxi · Admin
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
                  ? await bootstrapTaxi({ slug, nombre, email, password })
                  : await loginTaxiAdmin({ slug, email, password });
              if (!res.success) throw new Error(res.message);
              if (res.data?.token) setTaxiToken(res.data.token);
              toast.success(mode === "bootstrap" ? "Operador creado" : "Sesión iniciada");
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

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Cargando Taxi…</div>;
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Taxi</h1>
        <p className="mt-3 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 md:p-8">
      <header className="flex justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Plataforma · Oleada D
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Taxi · Sala de control</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setTaxiToken(null);
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
            const res = await createTaxiConductor({
              nombre: condNombre,
              telefono: condTel || undefined,
              password: condPass,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Conductor creado");
            setCondNombre("");
            setCondTel("");
            setCondPass("");
            await load();
          } catch (err: unknown) {
            toast.error(errMsg(err, "Error"));
          }
        }}
      >
        <h2 className="text-sm font-semibold">Nuevo conductor</h2>
        <Input placeholder="Nombre" value={condNombre} onChange={(e) => setCondNombre(e.target.value)} required />
        <Input placeholder="Teléfono" value={condTel} onChange={(e) => setCondTel(e.target.value)} />
        <Input
          type="password"
          placeholder="Contraseña"
          value={condPass}
          onChange={(e) => setCondPass(e.target.value)}
          required
        />
        <Button type="submit" size="sm">
          Crear
        </Button>
      </form>

      <section>
        <h2 className="text-sm font-semibold">Conductores</h2>
        {conductores.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin conductores.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60 text-sm">
            {conductores.map((c) => (
              <li key={c.id_conductor} className="py-2">
                {c.nombre} {c.telefono ? `· ${c.telefono}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold">Viajes</h2>
        {viajes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin viajes.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {viajes.map((v) => (
              <li
                key={v.id_viaje}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-3 py-2"
              >
                <span>
                  #{v.id_viaje} · {v.origen} → {v.destino}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase text-muted-foreground">{v.estado}</span>
                  {v.estado === "solicitado" && conductores[0] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await patchTaxiViaje(v.id_viaje, {
                            estado: "asignado",
                            id_conductor: conductores[0].id_conductor,
                          });
                          if (!res.success) throw new Error(res.message);
                          toast.success("Asignado");
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
