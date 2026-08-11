import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginRoleTabs } from "./LoginRoleTabs";
import { loginAtelier } from "@/features/platform/api/atelier";
import { portalButtonClass, portalInputClass } from "@/features/platform/ui/portalTouch";

type Role = "cliente" | "creador" | "admin";
const DEMO: Record<Role, { email: string; password: string; label: string }> = {
  cliente: { email: "cliente.demo@demo.local", password: "Demo1234!", label: "Cliente" },
  creador: { email: "luna.ink@demo.local", password: "Demo1234!", label: "Creador" },
  admin: { email: "atelier.admin@demo.local", password: "Demo1234!", label: "Admin" },
};

export function AtelierLoginPanel() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("cliente");
  const [email, setEmail] = useState(DEMO.cliente.email);
  const [password, setPassword] = useState(DEMO.cliente.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const enter = async () => {
    setError(""); setLoading(true);
    try {
      const result = await loginAtelier({ email: email.trim(), password });
      if (!result?.success) throw new Error(result?.message || "No se pudo iniciar sesión.");
      const returnedRole = result?.data?.role || result?.role || role;
      navigate(returnedRole === "admin" ? "/atelier-admin" : returnedRole === "creador" ? "/atelier/creador" : "/atelier/cliente");
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || (e as Error).message || "Error al iniciar sesión.");
    } finally { setLoading(false); }
  };
  return <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void enter(); }}>
    <LoginRoleTabs tabs={Object.entries(DEMO).map(([id, v]) => ({ id: id as Role, label: v.label }))} value={role} accent="#DB2777"
      onChange={(next) => { const value = DEMO[next]; setRole(next); setEmail(value.email); setPassword(value.password); setError(""); }} />
    <p className="text-sm text-muted-foreground">Accede a tus encargos, portafolio o gestión del marketplace.</p>
    {error ? <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
    <div className="space-y-1.5"><Label htmlFor="atelier_email">Correo</Label><Input id="atelier_email" type="email" className={portalInputClass} value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
    <div className="space-y-1.5"><Label htmlFor="atelier_password">Contraseña</Label><Input id="atelier_password" type="password" className={portalInputClass} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
    <Button type="submit" disabled={loading} className={`${portalButtonClass} border-0 text-white hover:opacity-90`} style={{ backgroundColor: "#DB2777" }}>
      {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Ingresando…</> : <><Check className="h-4 w-4" />Entrar como {DEMO[role].label.toLowerCase()}</>}
    </Button>
  </form>;
}
