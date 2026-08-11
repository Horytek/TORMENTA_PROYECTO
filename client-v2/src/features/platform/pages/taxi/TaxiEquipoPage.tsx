import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createTaxiAdminUser,
  getTaxiAdminToken,
  listTaxiAdmins,
  setTaxiAdminPassword,
} from "@/features/platform/api/taxi";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { TaxiAdminShell, taxiErr } from "./TaxiAdminShell";

type Admin = { id_admin: number; email: string };

export default function TaxiEquipoPage() {
  const [session, setSession] = useState(Boolean(getTaxiAdminToken()));
  const [rows, setRows] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwdId, setPwdId] = useState<number | null>(null);
  const [pwd, setPwd] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTaxiAdmins();
      if (!res.success) throw new Error(res.message || "Error");
      setRows(res.data || []);
    } catch (e: unknown) {
      toast.error(taxiErr(e, "Error al cargar equipo"));
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  if (!session) return <Navigate to="/login?mode=taxi" replace />;

  return (
    <TaxiAdminShell
      title="Equipo"
      subtitle="Usuarios admin del operador"
      onLogout={() => setSession(false)}
    >
      <form
        className="grid gap-2 rounded-lg border border-black/10 bg-white/70 p-3 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createTaxiAdminUser({
              email: email.trim(),
              password,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Admin añadido");
            setEmail("");
            setPassword("");
            await load();
          } catch (err: unknown) {
            toast.error(taxiErr(err, "No se pudo crear"));
          }
        }}
      >
        <p className="sm:col-span-3 text-[13px] font-medium">Invitar admin</p>
        <Input
          type="email"
          placeholder="email@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Contraseña inicial"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Button type="submit" className="w-fit">
          Añadir
        </Button>
      </form>

      {loading && rows.length === 0 ? (
        <p className="text-sm text-black/50">Cargando…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="Sin equipo" body="Añade al menos un admin." />
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li
              key={a.id_admin}
              className="rounded-lg border border-black/10 bg-white/70 px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{a.email}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPwdId(a.id_admin);
                    setPwd("");
                  }}
                >
                  Cambiar password
                </Button>
              </div>
              {pwdId === a.id_admin ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-black/5 pt-2">
                  <Input
                    type="password"
                    className="max-w-[200px]"
                    placeholder="Nueva contraseña"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    minLength={6}
                  />
                  <Button
                    size="sm"
                    disabled={pwd.length < 6}
                    onClick={async () => {
                      try {
                        const res = await setTaxiAdminPassword(a.id_admin, pwd);
                        if (!res.success) throw new Error(res.message);
                        toast.success("Contraseña actualizada");
                        setPwdId(null);
                      } catch (err: unknown) {
                        toast.error(taxiErr(err, "Error"));
                      }
                    }}
                  >
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPwdId(null)}>
                    Cerrar
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </TaxiAdminShell>
  );
}
