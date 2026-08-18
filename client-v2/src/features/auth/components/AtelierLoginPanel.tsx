import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginRoleTabs } from "./LoginRoleTabs";
import { DemoAccessCard } from "@/features/auth/components/DemoAccessCard";
import { getLoginAccent } from "@/features/auth/loginAccents";
import { loginAtelier } from "@/features/platform/api/atelier";
import { getDemoPortalCreds } from "@/features/platform/demo/demoPortalCreds";
import { bundleFromPortalCreds } from "@/features/platform/demo/loginDemoBundles";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";

type Role = "cliente" | "creador" | "admin";

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "cliente", label: "Cliente", hint: "Encarga ilustraciones, sigue cotizaciones y aprueba entregas." },
  { id: "creador", label: "Creador", hint: "Publica portafolio, cotiza encargos y cobra al completar." },
  { id: "admin", label: "Admin", hint: "Supervisa pedidos, usuarios y la comisión del marketplace." },
];

function errMsg(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (err as Error).message ||
    fallback
  );
}

function destForRole(role: string) {
  if (role === "admin") return "/atelier-admin";
  if (role === "creador") return "/atelier/creador";
  return "/atelier/cliente";
}

export function AtelierLoginPanel() {
  const accent = getLoginAccent("atelier");
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleMeta = ROLES.find((r) => r.id === role)!;
  const demoBundle = useMemo(() => {
    const creds = getDemoPortalCreds("atelier", role);
    if (!creds) return null;
    return bundleFromPortalCreds(creds, "atelier", "Entrar con demo");
  }, [role]);

  const applyDemoForRole = (nextRole: Role = role) => {
    const creds = getDemoPortalCreds("atelier", nextRole);
    if (!creds) return;
    setEmail(creds.email || "");
    setPassword(creds.password || "");
  };

  useEffect(() => {
    applyDemoForRole("cliente");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  const enterWith = async (nextEmail: string, nextPassword: string) => {
    setError("");
    if (!nextEmail.trim() || !nextPassword) {
      setError("Completa correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const result = await loginAtelier({ email: nextEmail.trim(), password: nextPassword });
      if (!result?.success) throw new Error(result?.message || "No se pudo iniciar sesión.");
      const returnedRole = result?.data?.role || result?.role || role;
      navigate(destForRole(String(returnedRole)));
    } catch (e: unknown) {
      setError(errMsg(e, "Error al iniciar sesión."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void enterWith(email, password);
      }}
    >
      <LoginRoleTabs
        tabs={ROLES.map((r) => ({ id: r.id, label: r.label }))}
        value={role}
        accent={accent}
        onChange={(next) => {
          setRole(next);
          setError("");
          applyDemoForRole(next);
        }}
      />

      <p className="text-sm text-muted-foreground">{roleMeta.hint}</p>

      {demoBundle ? (
        <DemoAccessCard
          bundle={demoBundle}
          accent={accent}
          onApply={() => applyDemoForRole(role)}
          onEnter={async () => {
            const creds = getDemoPortalCreds("atelier", role);
            if (!creds?.email || !creds.password) return;
            setEmail(creds.email);
            setPassword(creds.password);
            await enterWith(creds.email, creds.password);
          }}
        />
      ) : null}

      {error ? (
        <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="atelier_email">Correo electrónico</Label>
        <Input
          id="atelier_email"
          type="email"
          className={portalInputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@estudio.com"
          autoComplete="username"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="atelier_password">Contraseña</Label>
        <Input
          id="atelier_password"
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
            {`Entrar como ${roleMeta.label}`}
          </>
        )}
      </Button>
    </form>
  );
}
