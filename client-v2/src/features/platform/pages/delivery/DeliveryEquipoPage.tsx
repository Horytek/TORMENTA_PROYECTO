import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createDeliveryAdminUser,
  getDeliveryAdminToken,
  listDeliveryAdmins,
  setDeliveryAdminPassword,
} from "@/features/platform/api/delivery";
import { EmptyState } from "@/features/platform/ui/EmptyState";
import { DeliveryAdminShell, deliveryErr } from "./DeliveryAdminShell";

type Admin = { id_admin: number; email: string };

export default function DeliveryEquipoPage() {
  const [session, setSession] = useState(Boolean(getDeliveryAdminToken()));
  const [rows, setRows] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwdId, setPwdId] = useState<number | null>(null);
  const [pwd, setPwd] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await listDeliveryAdmins();
      if (!res.success) throw new Error(res.message || "Error");
      setRows(res.data || []);
    } catch (e: unknown) {
      toast.error(deliveryErr(e, "Error al cargar equipo"));
      setSession(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void load();
  }, [session]);

  if (!session) return <Navigate to="/login?mode=delivery" replace />;

  return (
    <DeliveryAdminShell
      title="Equipo"
      subtitle="Usuarios admin del operador"
      onLogout={() => setSession(false)}
    >
      <form
        className="grid gap-2 rounded-lg border border-black/10 bg-white/70 p-3 sm:grid-cols-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const res = await createDeliveryAdminUser({
              email: email.trim(),
              password,
            });
            if (!res.success) throw new Error(res.message);
            toast.success("Admin añadido");
            setEmail("");
            setPassword("");
            await load();
          } catch (err: unknown) {
            toast.error(deliveryErr(err, "No se pudo crear"));
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
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Button
          type="submit"
          className="border-0 bg-[var(--platform-accent)] text-white hover:opacity-90"
        >
          Añadir
        </Button>
      </form>

      {loading && rows.length === 0 ? (
        <p className="text-sm text-black/50">Cargando…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="Sin equipo" body="Invita al primer admin." />
      ) : (
        <ul className="divide-y divide-black/8 border-y border-black/8">
          {rows.map((a) => (
            <li key={a.id_admin} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{a.email}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => {
                    setPwdId(a.id_admin);
                    setPwd("");
                  }}
                >
                  Cambiar password
                </Button>
              </div>
              {pwdId === a.id_admin ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await setDeliveryAdminPassword(a.id_admin, pwd);
                      toast.success("Contraseña actualizada");
                      setPwdId(null);
                      setPwd("");
                    } catch (err: unknown) {
                      toast.error(deliveryErr(err, "Error"));
                    }
                  }}
                >
                  <Input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button size="sm" type="submit">
                    Guardar
                  </Button>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setPwdId(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DeliveryAdminShell>
  );
}
