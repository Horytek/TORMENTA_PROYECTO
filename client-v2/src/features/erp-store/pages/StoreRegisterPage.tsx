import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { buyerRegister, getStore } from "../api/erpStore";
import { useStorefrontAuthStore } from "../store/useStorefrontAuthStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StoreRegisterPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const setSession = useStorefrontAuthStore((s) => s.setSession);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  const storeQ = useQuery({
    queryKey: ["store-meta", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });
  const tienda = storeQ.data?.data?.tienda;

  const regMut = useMutation({
    mutationFn: () =>
      buyerRegister(slug, {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        telefono: telefono.trim() || undefined,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Error");
        return;
      }
      setSession(res.data.token, res.data.user, slug);
      toast.success("Cuenta creada");
      navigate(`/s/${slug}/cuenta`, { replace: true });
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || "No se pudo registrar");
    },
  });

  return (
    <StoreShell tienda={tienda || { slug, nombre: slug, color_primario: "#0E7C7B" }} slug={slug}>
      <div className="max-w-md mx-auto px-4 py-16">
        <Link to={`/s/${slug}`} className="text-sm store-muted hover:underline">
          ← Volver a la tienda
        </Link>
        <h1 className="text-2xl font-semibold mt-6">Crear cuenta</h1>
        <p className="text-sm store-muted mt-1">Compra y sigue tus pedidos en {tienda?.nombre || slug}</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            regMut.mutate();
          }}
        >
          <div>
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label>Teléfono (opcional)</Label>
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={regMut.isPending}>
            {regMut.isPending ? "Creando…" : "Registrarme"}
          </Button>
        </form>
        <p className="text-sm text-center mt-6 store-muted">
          ¿Ya tienes cuenta?{" "}
          <Link to={`/s/${slug}/login`} className="text-[var(--vitrina-accent)] font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </StoreShell>
  );
}
