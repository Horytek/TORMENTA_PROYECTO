import React, { useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { loginRequest } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setToken } from "@/utils/authStorage";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { SwatchStrip } from "@/components/brand/Swatch";
import { SizeCurve } from "@/components/brand/SizeCurve";

// Tonalidades de muestra (colores reales de prenda) — en clave Prime, sobrias.
const TAG_COLORS = ["#243645", "#3E6B89", "#0E7C7B", "#C9A227", "#B23A48", "#D6D3CD"];

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setUserRaw = useUserStore((state) => state.setUserRaw);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !password) {
      setError("Completa usuario y contraseña para continuar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await loginRequest({ usuario, password });
      const { success, token, data, message } = response.data;

      if (success && token) {
        await setToken(token);
        setUserRaw(data);
        const roleId = Number(data.rol || data.id_rol || data.roleId);
        if (roleId) {
          await useUserStore.getState().loadPermissionsAndCapabilities(roleId);
        }
        if (data.rol === 3) {
          navigate("/express/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(message || "Usuario o contraseña incorrectos.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "No pudimos conectar con el servidor. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ── Panel de marca con carácter de taller ─────────────── */}
      <aside className="relative hidden overflow-hidden bg-[#243645] text-slate-100 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:p-12">
        {/* costura tenue */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #ffffff 0 1px, transparent 1px 24px)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[hsl(205_55%_46%)]" />

        {/* Marca */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-lg font-bold ring-1 ring-white/15">
            H
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight">Horytek ERP</p>
            <p className="text-xs text-slate-400">por Prime Institute</p>
          </div>
        </div>

        {/* Etiqueta de prenda: el objeto característico del negocio */}
        <div className="relative flex flex-1 items-center">
          <div className="relative w-[19rem] -rotate-2 rounded-xl border border-black/10 bg-[#F4F4F2] p-5 text-[#20303C] shadow-2xl">
            {/* ojal + hilo */}
            <div className="absolute -top-3 left-8 h-6 w-6 rounded-full border-4 border-[#243645] bg-[#F4F4F2]" />
            <div className="absolute -top-9 left-[2.6rem] h-6 w-px rotate-12 bg-white/25" />

            <p className="num text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
              TAG · POL-0432
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-tight">Polo Oversize</h2>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Tonalidades</p>
                <SwatchStrip colors={TAG_COLORS} size="md" className="mt-1.5" />
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Precio</p>
                <p className="num mt-1 text-xl font-semibold">S/ 49.90</p>
              </div>
            </div>

            <div className="mt-4 border-t border-dashed border-slate-300 pt-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Curva de tallas</p>
              <SizeCurve
                className="mt-1.5"
                sizes={[
                  { label: "S", available: true },
                  { label: "M", available: true },
                  { label: "L", available: true },
                  { label: "XL", available: false },
                ]}
              />
              <p className="num mt-3 text-xs text-slate-500">
                stock <span className="font-semibold text-[#0E7C7B]">128</span> · almacén central
              </p>
            </div>
          </div>
        </div>

        {/* Línea de cierre (sobria) */}
        <div className="relative max-w-sm">
          <p className="text-base font-medium leading-snug text-slate-100">
            Inventario, ventas y facturación — cada prenda bajo control.
          </p>
          <p className="num mt-3 text-[11px] uppercase tracking-[0.16em] text-slate-400">
            © {new Date().getFullYear()} Prime Institute
          </p>
        </div>
      </aside>

      {/* ── Panel formulario ───────────────────────────────── */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Marca compacta (móvil) */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              H
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold text-foreground">Horytek ERP</p>
              <p className="text-[11px] text-muted-foreground">por Prime Institute</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Iniciar sesión
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="animate-shake rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="nombre.apellido"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={loading}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <a
                  href="#"
                  className="text-xs font-medium text-brand underline-offset-4 hover:underline"
                >
                  ¿La olvidaste?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Ingresar
                </>
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            ¿Problemas para acceder? Contacta a tu administrador.
          </p>
        </div>
      </main>
    </div>
  );
}
