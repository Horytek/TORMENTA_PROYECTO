import { useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { buyerLogin, getStore } from "../api/erpStore";
import { useStorefrontAuthStore } from "../store/useStorefrontAuthStore";
import { StoreShell } from "../components/vitrina/StoreShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StoreLoginPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useStorefrontAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const storeQ = useQuery({
    queryKey: ["store-meta", slug],
    queryFn: () => getStore(slug),
    enabled: Boolean(slug),
  });
  const tienda = storeQ.data?.data?.tienda;

  const from = (location.state as { from?: string })?.from || `/s/${slug}/cuenta`;

  const loginMut = useMutation({
    mutationFn: () => buyerLogin(slug, { email: email.trim(), password }),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message || "Error");
        return;
      }
      setSession(res.data.token, res.data.user, slug);
      toast.success("Bienvenido");
      navigate(from, { replace: true });
    },
    onError: (e: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(e.response?.data?.message || "Credenciales incorrectas");
    },
  });

  return (
    <StoreShell tienda={tienda || { slug, nombre: slug, color_primario: "#0E7C7B" }} slug={slug}>
      <div className="max-w-md mx-auto px-4 py-16">
        <Link to={`/s/${slug}`} className="text-sm store-muted hover:underline">
          ← Volver a la tienda
        </Link>
        <h1 className="text-2xl font-semibold mt-6">Iniciar sesión</h1>
        <p className="text-sm store-muted mt-1">
          Accede a tu cuenta en {tienda?.nombre || slug}
        </p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            loginMut.mutate();
          }}
        >
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loginMut.isPending}>
            {loginMut.isPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        <p className="text-sm text-center mt-6 store-muted">
          ¿No tienes cuenta?{" "}
          <Link to={`/s/${slug}/registro`} className="text-[var(--vitrina-accent)] font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </StoreShell>
  );
}
