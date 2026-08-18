import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginTaxiAdmin,
  loginTaxiConductor,
  loginTaxiPasajero,
  registerTaxiPasajero,
} from "@/features/platform/api/taxi";
import { getLoginAccent } from "@/features/auth/loginAccents";
import { DEMO_SLUG, getDemoPortalCreds } from "@/features/platform/demo/demoPortalCreds";
import { bundleFromPortalCreds } from "@/features/platform/demo/loginDemoBundles";
import { DemoAccessCard } from "@/features/auth/components/DemoAccessCard";
import { LoginRoleTabs } from "@/features/auth/components/LoginRoleTabs";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";

type TaxiRole = "operador" | "pasajero" | "conductor";

const ROLES: { id: TaxiRole; label: string; hint: string }[] = [
  { id: "operador", label: "Operador", hint: "Sala de control: viajes, conductores y asignación." },
  { id: "pasajero", label: "Pasajero", hint: "Pide un taxi con tu teléfono." },
  { id: "conductor", label: "Conductor", hint: "Acepta y cierra viajes asignados." },
];

function demoRoleKey(role: TaxiRole): "admin" | "pasajero" | "conductor" {
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

export function TaxiLoginPanel() {
  const accent = getLoginAccent("taxi");
  const navigate = useNavigate();
  const [role, setRole] = useState<TaxiRole>("operador");
  const [codigo, setCodigo] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [pasajeroMode, setPasajeroMode] = useState<"login" | "registro">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleMeta = ROLES.find((r) => r.id === role)!;
  const demoBundle = useMemo(() => {
    const creds = getDemoPortalCreds("taxi", demoRoleKey(role));
    if (!creds) return null;
    return bundleFromPortalCreds(creds, "taxi", "Entrar con demo");
  }, [role]);

  const applyDemoForRole = (nextRole: TaxiRole = role) => {
    const creds = getDemoPortalCreds("taxi", demoRoleKey(nextRole));
    if (!creds) return;
    setCodigo(creds.slug || DEMO_SLUG);
    setEmail(creds.email || "");
    setTelefono(creds.telefono || "");
    setPassword(creds.password || "");
    setNombre(creds.nombre || "");
  };

  const doLogin = async () => {
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
    if (role === "pasajero" && pasajeroMode === "registro" && !nombre.trim()) {
      setError("Indica tu nombre para crear la cuenta.");
      return;
    }

    setLoading(true);
    try {
      if (role === "operador") {
        const res = await loginTaxiAdmin({ slug, email: email.trim(), password });
        if (!res.success) throw new Error(res.message || "No se pudo iniciar sesión.");
        navigate("/taxi-admin");
        return;
      }
      if (role === "pasajero") {
        if (pasajeroMode === "registro") {
          const res = await registerTaxiPasajero({
            slug,
            nombre: nombre.trim(),
            telefono: telefono.trim(),
            password,
          });
          if (!res.success) throw new Error(res.message || "No se pudo crear la cuenta.");
        } else {
          const res = await loginTaxiPasajero({ slug, telefono: telefono.trim(), password });
          if (!res.success) throw new Error(res.message || "No se pudo iniciar sesión.");
        }
        navigate(`/taxi/${slug}`);
        return;
      }
      const res = await loginTaxiConductor({ slug, telefono: telefono.trim(), password });
      if (!res.success) throw new Error(res.message || "No se pudo iniciar sesión.");
      navigate(`/taxi/${slug}/conductor`);
    } catch (err: unknown) {
      setError(errMsg(err, "Error al iniciar sesión."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await doLogin();
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
        }}
      />

      <p className="text-sm text-muted-foreground">{roleMeta.hint}</p>

      {error ? (
        <div
          role="alert"
          className="animate-shake rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="taxi_codigo">Código del operador</Label>
        <Input
          id="taxi_codigo"
          className={portalInputClass}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="mi-operador"
          autoComplete="organization"
          required
        />
      </div>

      {role === "operador" ? (
        <div className="space-y-1.5">
          <Label htmlFor="taxi_email">Email del administrador</Label>
          <Input
            id="taxi_email"
            type="email"
            className={portalInputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@empresa.com"
            autoComplete="username"
            required
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="taxi_tel">Teléfono</Label>
          <Input
            id="taxi_tel"
            type="tel"
            className={portalInputClass}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="900 000 000"
            autoComplete="tel"
            required
          />
        </div>
      )}

      {role === "pasajero" && pasajeroMode === "registro" ? (
        <div className="space-y-1.5">
          <Label htmlFor="taxi_nombre">Nombre</Label>
          <Input
            id="taxi_nombre"
            className={portalInputClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            required
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="taxi_password">Contraseña</Label>
        <Input
          id="taxi_password"
          type="password"
          className={portalInputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {role === "pasajero" ? (
        <LoginRoleTabs
          tabs={[
            { id: "login" as const, label: "Ya tengo cuenta" },
            { id: "registro" as const, label: "Crear cuenta" },
          ]}
          value={pasajeroMode}
          accent={accent}
          onChange={setPasajeroMode}
        />
      ) : null}

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
            {role === "pasajero" && pasajeroMode === "registro"
              ? "Crear cuenta y entrar"
              : role === "operador"
                ? "Entrar a sala de control"
                : "Entrar"}
          </>
        )}
      </Button>

      {role !== "pasajero" || pasajeroMode !== "registro" ? (
        demoBundle ? (
          <DemoAccessCard
            bundle={demoBundle}
            accent={accent}
            onApply={() => applyDemoForRole(role)}
            onEnter={async () => {
              const creds = getDemoPortalCreds("taxi", demoRoleKey(role));
              if (!creds) return;
              applyDemoForRole(role);
              setLoading(true);
              setError("");
              try {
                const slug = (creds.slug || DEMO_SLUG).toLowerCase();
                if (role === "operador") {
                  const res = await loginTaxiAdmin({
                    slug,
                    email: creds.email || "",
                    password: creds.password || "",
                  });
                  if (!res.success) throw new Error(res.message);
                  navigate("/taxi-admin");
                  return;
                }
                if (role === "pasajero") {
                  const res = await loginTaxiPasajero({
                    slug,
                    telefono: creds.telefono || "",
                    password: creds.password || "",
                  });
                  if (!res.success) throw new Error(res.message);
                  navigate(`/taxi/${slug}`);
                  return;
                }
                const res = await loginTaxiConductor({
                  slug,
                  telefono: creds.telefono || "",
                  password: creds.password || "",
                });
                if (!res.success) throw new Error(res.message);
                navigate(`/taxi/${slug}/conductor`);
              } catch (err: unknown) {
                setError(errMsg(err, "Error al iniciar sesión."));
              } finally {
                setLoading(false);
              }
            }}
          />
        ) : null
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        {role === "operador" ? (
          <>
            ¿Primera vez?{" "}
            <Link to="/?product=taxi#planes" className="underline-offset-4 hover:underline">
              Elige un plan
            </Link>{" "}
            para crear el operador.
          </>
        ) : role === "conductor" ? (
          <>El operador te crea el acceso desde la sala de control.</>
        ) : (
          <>
            También puedes abrir directo{" "}
            <Link to={`/taxi/${codigo.trim().toLowerCase() || "demo"}`} className="underline-offset-4 hover:underline">
              el portal del pasajero
            </Link>
            .
          </>
        )}
      </p>
    </form>
  );
}
