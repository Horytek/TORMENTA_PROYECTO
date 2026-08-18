import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginRoleTabs } from "./LoginRoleTabs";
import { DemoAccessCard } from "@/features/auth/components/DemoAccessCard";
import { getLoginAccent } from "@/features/auth/loginAccents";
import { loginAtelier, registerAtelier } from "@/features/platform/api/atelier";
import { getDemoPortalCreds } from "@/features/platform/demo/demoPortalCreds";
import { bundleFromPortalCreds } from "@/features/platform/demo/loginDemoBundles";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";
import { ATELIER_COPY } from "@/features/atelier/copy";
import { atelierApiError, slugFromName } from "@/features/atelier/helpers";
import { destForAtelierRole } from "@/features/atelier/session";

type Role = "cliente" | "creador" | "admin";
type Mode = "login" | "register";
type RegisterIntent = "cliente" | "creador";

const LOGIN_ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "cliente", label: "Cliente", hint: "Encarga ilustraciones, sigue propuestas y aprueba la obra." },
  { id: "creador", label: "Artista", hint: "Publica portafolio, cotiza encargos y cobra al completar." },
  { id: "admin", label: "Admin", hint: "Supervisa encargos, usuarios y la comisión del marketplace." },
];

export function AtelierLoginPanel() {
  const accent = getLoginAccent("atelier");
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("cliente");
  const [intent, setIntent] = useState<RegisterIntent>("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [nombreArtistico, setNombreArtistico] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const roleMeta = LOGIN_ROLES.find((r) => r.id === role)!;
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
    if (intent === "creador" && !slugTouched) {
      setSlug(slugFromName(nombreArtistico || nombre));
    }
  }, [intent, nombre, nombreArtistico, slugTouched]);

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
      navigate(destForAtelierRole(String(returnedRole)));
    } catch (e: unknown) {
      setError(atelierApiError(e, "Error al iniciar sesión."));
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    setError("");
    if (!nombre.trim() || !email.trim() || password.length < 8) {
      setError("Nombre, correo y una clave de al menos 8 caracteres.");
      return;
    }
    if (intent === "creador" && slug.trim().length < 2) {
      setError("El artista necesita un slug (minúsculas, números y guiones).");
      return;
    }
    setLoading(true);
    try {
      const result = await registerAtelier({
        email: email.trim(),
        password,
        nombre: nombre.trim(),
        role: intent,
        slug: intent === "creador" ? slug.trim() : undefined,
        nombre_artistico: intent === "creador" ? (nombreArtistico.trim() || nombre.trim()) : undefined,
      });
      if (!result?.success) throw new Error(result?.message || "No se pudo crear la cuenta.");
      const returnedRole = result?.data?.role || intent;
      navigate(destForAtelierRole(String(returnedRole)));
    } catch (e: unknown) {
      setError(atelierApiError(e, "No se pudo crear la cuenta."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (mode === "register") void register();
        else void enterWith(email, password);
      }}
    >
      <LoginRoleTabs
        tabs={[
          { id: "login" as const, label: "Ingresar" },
          { id: "register" as const, label: "Crear cuenta" },
        ]}
        value={mode}
        accent={accent}
        onChange={(next) => {
          setMode(next);
          setError("");
        }}
      />

      {mode === "login" ? (
        <>
          <LoginRoleTabs
            tabs={LOGIN_ROLES.map((r) => ({ id: r.id, label: r.label }))}
            value={role}
            accent={accent}
            onChange={(next) => {
              setRole(next);
              setError("");
            }}
          />
          <p className="text-sm text-muted-foreground">{roleMeta.hint}</p>
        </>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIntent("cliente")}
            className="rounded-lg border px-3 py-3 text-left text-[13px] transition-colors"
            style={
              intent === "cliente"
                ? { borderColor: accent, boxShadow: `inset 3px 0 0 ${accent}` }
                : undefined
            }
          >
            <span className="block font-semibold">{ATELIER_COPY.registerClient}</span>
            <span className="mt-1 block text-[12px] text-muted-foreground">Cuenta de cliente</span>
          </button>
          <button
            type="button"
            onClick={() => setIntent("creador")}
            className="rounded-lg border px-3 py-3 text-left text-[13px] transition-colors"
            style={
              intent === "creador"
                ? { borderColor: accent, boxShadow: `inset 3px 0 0 ${accent}` }
                : undefined
            }
          >
            <span className="block font-semibold">{ATELIER_COPY.registerCreator}</span>
            <span className="mt-1 block text-[12px] text-muted-foreground">Cuenta de artista</span>
          </button>
        </div>
      )}

      {error ? (
        <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {mode === "register" ? (
        <div className="space-y-1.5">
          <Label htmlFor="atelier_nombre">Nombre</Label>
          <Input
            id="atelier_nombre"
            className={portalInputClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
      ) : null}

      {mode === "register" && intent === "creador" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="atelier_artistico">Nombre artístico</Label>
            <Input
              id="atelier_artistico"
              className={portalInputClass}
              value={nombreArtistico}
              onChange={(e) => setNombreArtistico(e.target.value)}
              placeholder="Luna Ink"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="atelier_slug">Slug público</Label>
            <Input
              id="atelier_slug"
              className={portalInputClass}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              placeholder="luna.ink"
              required
            />
          </div>
        </>
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
          autoComplete={mode === "register" ? "new-password" : "current-password"}
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
            {mode === "register" ? "Creando cuenta…" : "Ingresando…"}
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            {mode === "register"
              ? intent === "creador"
                ? ATELIER_COPY.registerCreator
                : ATELIER_COPY.registerClient
              : `Entrar como ${roleMeta.label}`}
          </>
        )}
      </Button>
      {mode === "login" && demoBundle ? (
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
    </form>
  );
}
