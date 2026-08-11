import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginDeliveryAdmin,
  loginDeliveryCliente,
  loginDeliveryRepartidor,
} from "@/features/platform/api/delivery";
import { getLoginAccent } from "@/features/auth/loginAccents";
import { DEMO_SLUG, getDemoPortalCreds } from "@/features/platform/demo/demoPortalCreds";
import { bundleFromPortalCreds } from "@/features/platform/demo/loginDemoBundles";
import { DemoAccessCard } from "@/features/auth/components/DemoAccessCard";
import { LoginRoleTabs } from "@/features/auth/components/LoginRoleTabs";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";

type DeliveryRole = "operador" | "cliente" | "repartidor";

const ROLES: { id: DeliveryRole; label: string; hint: string }[] = [
  { id: "operador", label: "Operador", hint: "Despacho: pedidos, repartidores y asignación." },
  { id: "cliente", label: "Cliente", hint: "Pide y sigue tus entregas con tu teléfono." },
  { id: "repartidor", label: "Repartidor", hint: "Toma y cierra pedidos asignados." },
];

function demoRoleKey(role: DeliveryRole): "admin" | "cliente" | "repartidor" {
  if (role === "operador") return "admin";
  return role;
}

function errMsg(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (err as Error).message ||
    fallback
  );
}

export function DeliveryLoginPanel() {
  const accent = getLoginAccent("delivery");
  const navigate = useNavigate();
  const [role, setRole] = useState<DeliveryRole>("operador");
  const [codigo, setCodigo] = useState(DEMO_SLUG);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleMeta = ROLES.find((r) => r.id === role)!;
  const demoBundle = useMemo(() => {
    const creds = getDemoPortalCreds("delivery", demoRoleKey(role));
    if (!creds) return null;
    return bundleFromPortalCreds(creds, "delivery", "Entrar con demo");
  }, [role]);

  const applyDemoForRole = (nextRole: DeliveryRole = role) => {
    const creds = getDemoPortalCreds("delivery", demoRoleKey(nextRole));
    if (!creds) return;
    setCodigo(creds.slug || DEMO_SLUG);
    setEmail(creds.email || "");
    setTelefono(creds.telefono || "");
    setPassword(creds.password || "");
    setNombre(creds.nombre || "");
  };

  useEffect(() => {
    applyDemoForRole("operador");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        const slug = codigo.trim().toLowerCase();
        if (!slug || !password) {
          setError("Completa los campos obligatorios.");
          return;
        }
        if (role === "operador" && !email.trim()) {
          setError("El email del operador es obligatorio.");
          return;
        }
        if (role !== "operador" && !telefono.trim()) {
          setError("El teléfono es obligatorio.");
          return;
        }
        setLoading(true);
        try {
          if (role === "operador") {
            const res = await loginDeliveryAdmin({ slug, email: email.trim(), password });
            if (!res.success) throw new Error(res.message || "No se pudo iniciar sesión.");
            navigate("/delivery-admin");
            return;
          }
          if (role === "cliente") {
            const res = await loginDeliveryCliente({
              slug,
              telefono: telefono.trim(),
              password,
              ...(nombre.trim() ? { nombre: nombre.trim() } : {}),
            });
            if (!res.success) throw new Error(res.message || "No se pudo iniciar sesión.");
            navigate(`/delivery/${slug}`);
            return;
          }
          const res = await loginDeliveryRepartidor({
            slug,
            telefono: telefono.trim(),
            password,
          });
          if (!res.success) throw new Error(res.message || "No se pudo iniciar sesión.");
          navigate(`/delivery/${slug}/repartidor`);
        } catch (err: unknown) {
          setError(errMsg(err, "Error al iniciar sesión."));
        } finally {
          setLoading(false);
        }
      }}
      className="space-y-5"
    >
      <LoginRoleTabs
        tabs={ROLES.map((r) => ({ id: r.id, label: r.label }))}
        value={role}
        accent={accent}
        onChange={(id) => {
          setRole(id);
          setError("");
          applyDemoForRole(id);
        }}
      />

      <p className="text-sm text-muted-foreground">{roleMeta.hint}</p>

      {demoBundle ? (
        <DemoAccessCard
          bundle={demoBundle}
          accent={accent}
          onApply={() => applyDemoForRole(role)}
          onEnter={async () => {
            const creds = getDemoPortalCreds("delivery", demoRoleKey(role));
            if (!creds) return;
            applyDemoForRole(role);
            setLoading(true);
            setError("");
            try {
              const slug = (creds.slug || DEMO_SLUG).toLowerCase();
              if (role === "operador") {
                const res = await loginDeliveryAdmin({
                  slug,
                  email: creds.email || "",
                  password: creds.password || "",
                });
                if (!res.success) throw new Error(res.message);
                navigate("/delivery-admin");
                return;
              }
              if (role === "cliente") {
                const res = await loginDeliveryCliente({
                  slug,
                  telefono: creds.telefono || "",
                  password: creds.password || "",
                  nombre: creds.nombre,
                });
                if (!res.success) throw new Error(res.message);
                navigate(`/delivery/${slug}`);
                return;
              }
              const res = await loginDeliveryRepartidor({
                slug,
                telefono: creds.telefono || "",
                password: creds.password || "",
              });
              if (!res.success) throw new Error(res.message);
              navigate(`/delivery/${slug}/repartidor`);
            } catch (err: unknown) {
              setError(errMsg(err, "Error al iniciar sesión."));
            } finally {
              setLoading(false);
            }
          }}
        />
      ) : null}

      {error ? (
        <div
          role="alert"
          className="animate-shake rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="delivery_codigo">Código del operador</Label>
        <Input
          id="delivery_codigo"
          className={portalInputClass}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="ej. demo"
          autoComplete="organization"
          required
        />
      </div>

      {role === "operador" ? (
        <div className="space-y-1.5">
          <Label htmlFor="delivery_email">Email del administrador</Label>
          <Input
            id="delivery_email"
            type="email"
            className={portalInputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@demo.local"
            autoComplete="username"
            required
          />
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="delivery_tel">Teléfono</Label>
            <Input
              id="delivery_tel"
              type="tel"
              className={portalInputClass}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder={role === "cliente" ? "999111222" : "999333444"}
              autoComplete="tel"
              required
            />
          </div>
          {role === "cliente" ? (
            <div className="space-y-1.5">
              <Label htmlFor="delivery_nombre">Nombre (opcional si ya tienes cuenta)</Label>
              <Input
                id="delivery_nombre"
                className={portalInputClass}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </div>
          ) : null}
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="delivery_password">Contraseña</Label>
        <Input
          id="delivery_password"
          type="password"
          className={portalInputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className={`${portalButtonClass} border-0 text-white hover:opacity-90`}
        style={{ backgroundColor: accent }}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Ingresando…
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            {role === "operador" ? "Entrar a despacho" : "Entrar"}
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {role === "operador" ? (
          <>
            ¿Primera vez?{" "}
            <Link to="/?product=delivery#planes" className="underline-offset-4 hover:underline">
              Elige un plan
            </Link>{" "}
            para crear el operador.
          </>
        ) : role === "repartidor" ? (
          <>
            Portal:{" "}
            <Link
              to={`/delivery/${codigo.trim().toLowerCase() || "demo"}/repartidor`}
              className="underline-offset-4 hover:underline"
            >
              /delivery/{codigo.trim().toLowerCase() || "demo"}/repartidor
            </Link>
          </>
        ) : (
          <>
            Portal:{" "}
            <Link
              to={`/delivery/${codigo.trim().toLowerCase() || "demo"}`}
              className="underline-offset-4 hover:underline"
            >
              /delivery/{codigo.trim().toLowerCase() || "demo"}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
