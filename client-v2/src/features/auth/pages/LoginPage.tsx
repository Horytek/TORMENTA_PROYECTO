import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "@/store/useUserStore";
import { loginRequest, sendAuthCodeRequest } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setToken } from "@/utils/authStorage";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check, Store } from "lucide-react";
import { SwatchStrip } from "@/components/brand/Swatch";
import { SizeCurve } from "@/components/brand/SizeCurve";
import { expressLogin, expressRegister } from "@/features/express/api/express";
import { createPreference } from "@/features/account/api/billing";
import { setPendingPaymentFlow } from "@/features/landing/utils/paymentFlow";
import { POCKET_PLANS } from "@/features/landing/data/landing.data";

// Tonalidades de muestra (colores reales de prenda), sobrias.
const TAG_COLORS = ["#243645", "#3E6B89", "#0E7C7B", "#C9A227", "#B23A48", "#D6D3CD"];

export default function LoginPage() {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "express" ? "express" : "erp";
  const [mode, setMode] = useState<"erp" | "express" | "validar">(initialMode);
  const pocketPlan =
    POCKET_PLANS.find((p) => p.id === params.get("plan")) ||
    POCKET_PLANS.find((p) => p.highlight) ||
    POCKET_PLANS[0];
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pocket POS (Express) — sistema de auth separado del ERP
  const [expressIsRegistering, setExpressIsRegistering] = useState(params.get("register") === "1");
  const [expressBusiness, setExpressBusiness] = useState("");
  const [expressEmail, setExpressEmail] = useState("");
  const [expressPassword, setExpressPassword] = useState("");
  const [expressShowPassword, setExpressShowPassword] = useState(false);
  const [expressLoading, setExpressLoading] = useState(false);
  const [expressError, setExpressError] = useState("");
  const [expressPendingMessage, setExpressPendingMessage] = useState("");

  // Autenticación / Verificación de cuenta (OTP)
  const [authUser, setAuthUser] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  const setUserRaw = useUserStore((state) => state.setUserRaw);
  const navigate = useNavigate();

  // Tras crear la cuenta Pocket (queda "pending"), genera la preferencia de pago
  // del plan elegido y redirige a MercadoPago — mismo patrón que BillingDrawer.tsx.
  const pocketPaymentMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await createPreference({
        items: [
          {
            id: `POCKET_${pocketPlan.id.toUpperCase()}_${Date.now()}`,
            title: `Plan ${pocketPlan.name} — Pocket POS`,
            quantity: 1,
            unit_price: pocketPlan.price,
            description: `${pocketPlan.name} — ${pocketPlan.unit}`,
          },
        ],
        payer: { name: expressBusiness || "Pocket POS", email },
        external_reference: email,
        back_urls: {
          success: `${window.location.origin}/success`,
          failure: `${window.location.origin}/failure`,
          pending: `${window.location.origin}/pending`,
        },
        auto_return: "approved",
      });
      if (!result.success || !result.id) throw new Error(result.message || "No se pudo generar el enlace de pago.");
      return result.id;
    },
    onSuccess: (preferenceId) => {
      setPendingPaymentFlow("pocket");
      window.location.href = `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${preferenceId}`;
    },
    onError: (err: Error) => setExpressError(err.message),
  });

  const handleExpressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpressError("");
    setExpressPendingMessage("");

    if (expressIsRegistering) {
      if (!expressBusiness || !expressEmail || !expressPassword) {
        setExpressError("Todos los campos son obligatorios.");
        return;
      }
    } else if (!expressEmail || !expressPassword) {
      setExpressError("Ingresa correo y contraseña.");
      return;
    }

    setExpressLoading(true);
    try {
      if (expressIsRegistering) {
        const result = await expressRegister({ business_name: expressBusiness, email: expressEmail, password: expressPassword });
        // El registro nunca devuelve token: la cuenta queda pendiente hasta pagar.
        setExpressPendingMessage(result.message || "Cuenta creada. Generando enlace de pago…");
        pocketPaymentMutation.mutate(expressEmail);
      } else {
        await expressLogin({ email: expressEmail, password: expressPassword });
        navigate("/express-pos");
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      setExpressError(errorData?.message || "Error de conexión con Pocket POS.");
    } finally {
      setExpressLoading(false);
    }
  };

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!authUser || !authPassword || !otpValue) {
      setAuthError("Debe ingresar usuario, contraseña y código.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await sendAuthCodeRequest({
        usuario: authUser,
        password: authPassword,
        clave_acceso: otpValue,
      });
      if (res.data?.success) {
        setAuthSuccess(res.data.message || "¡Cuenta activada con éxito!");
        setTimeout(() => {
          setMode("erp");
          setUsuario(authUser);
          setPassword(authPassword);
          setAuthUser("");
          setAuthPassword("");
          setOtpValue("");
          setAuthSuccess("");
        }, 2000);
      } else {
        setAuthError(res.data?.message || "Código incorrecto o expirado.");
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || "Código incorrecto o expirado.");
    } finally {
      setAuthLoading(false);
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
            <p className="text-xs text-slate-400">Sistema de gestión</p>
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
            © {new Date().getFullYear()} Horytek ERP
          </p>
        </div>
      </aside>

      {/* ── Panel formulario ───────────────────────────────── */}
      <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <Link
          to="/"
          className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver al inicio
        </Link>
        <div className="w-full max-w-sm">
          {/* Marca compacta (móvil) */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              H
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold text-foreground">Horytek ERP</p>
              <p className="text-[11px] text-muted-foreground">Sistema de gestión</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {mode === "erp"
                ? "Iniciar sesión"
                : mode === "validar"
                ? "Autenticar cuenta"
                : expressIsRegistering
                ? "Crear cuenta Pocket POS"
                : "Pocket POS"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "erp"
                ? "Ingresa tus credenciales para acceder al sistema."
                : mode === "validar"
                ? "Ingrese el código de seguridad"
                : "Modo ligero de punto de venta (beta)."}
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "erp" | "express" | "validar")} className="mb-6">
            <TabsList className="w-full">
              <TabsTrigger value="erp" className="flex-1">Sistema ERP</TabsTrigger>
              <TabsTrigger value="express" className="flex-1 gap-1.5"><Store className="h-3.5 w-3.5" /> Pocket POS</TabsTrigger>
              <TabsTrigger value="validar" className="flex-1">Validar</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "erp" ? (
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
          ) : mode === "express" ? (
            <form onSubmit={handleExpressSubmit} className="space-y-5">
              {expressError && (
                <div role="alert" className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                  {expressError}
                </div>
              )}
              {expressPendingMessage && (
                <div role="status" className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                  {expressPendingMessage}
                </div>
              )}

              {expressIsRegistering && (
                <>
                  <div className="flex items-center justify-between rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-xs">
                    <span className="font-medium text-foreground">Plan {pocketPlan.name}</span>
                    <span className="num font-semibold text-amber-700 dark:text-amber-400">
                      S/ {pocketPlan.price} / {pocketPlan.unit}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="express_business">Nombre del negocio</Label>
                    <Input
                      id="express_business"
                      value={expressBusiness}
                      onChange={(e) => setExpressBusiness(e.target.value)}
                      disabled={expressLoading}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="express_email">Correo electrónico</Label>
                <Input
                  id="express_email"
                  type="text"
                  placeholder="correo@negocio.com"
                  value={expressEmail}
                  onChange={(e) => setExpressEmail(e.target.value)}
                  disabled={expressLoading}
                  autoComplete="username"
                  required
                />
                {!expressIsRegistering && (
                  <p className="text-xs text-muted-foreground">
                    ¿Eres empleado? Usa: <span className="font-mono">NombreCompleto@usuario</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="express_password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="express_password"
                    type={expressShowPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={expressPassword}
                    onChange={(e) => setExpressPassword(e.target.value)}
                    disabled={expressLoading}
                    autoComplete={expressIsRegistering ? "new-password" : "current-password"}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setExpressShowPassword((v) => !v)}
                    aria-label={expressShowPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {expressShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={expressLoading || pocketPaymentMutation.isPending}
                className="w-full bg-amber-500 text-white hover:bg-amber-600"
              >
                {expressLoading || pocketPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {pocketPaymentMutation.isPending
                      ? "Redirigiendo al pago…"
                      : expressIsRegistering
                      ? "Creando cuenta…"
                      : "Ingresando…"}
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4" />
                    {expressIsRegistering ? "Crear cuenta y pagar" : "Acceder a Pocket POS"}
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setExpressIsRegistering((v) => !v); setExpressError(""); setExpressPendingMessage(""); }}
                className="w-full text-center text-xs font-medium text-brand underline-offset-4 hover:underline"
              >
                {expressIsRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {authError && (
                <div role="alert" className="animate-shake rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div role="status" className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {authSuccess}
                </div>
              )}

              <div className="flex justify-center mb-4">
                {/* Custom Simulated OTP Input */}
                <div className="relative w-full max-w-[280px] h-14 mx-auto">
                  {/* Hidden actual input for logic */}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={otpValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                      setOtpValue(val);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    autoFocus
                    autoComplete="one-time-code"
                  />

                  {/* Visual Boxes */}
                  <div className="flex justify-center gap-4 w-full h-full pointer-events-none">
                    {[0, 1, 2, 3].map((index) => {
                      const isActive = otpValue.length === index;
                      const isFilled = otpValue.length > index;
                      return (
                        <div
                          key={index}
                          className={`
                            w-14 h-14 rounded-xl border flex items-center justify-center text-2xl font-bold bg-muted/40 text-foreground transition-all duration-200
                            ${isActive ? 'border-emerald-500 ring-4 ring-emerald-500/20 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-input'}
                            ${isFilled ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : ''}
                          `}
                        >
                          {otpValue[index] || ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground px-2 leading-relaxed">
                Ingrese el código de acceso de 4 dígitos enviado a su correo.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="auth_username">Usuario</Label>
                  <Input
                    id="auth_username"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={authUser}
                    onChange={(e) => setAuthUser(e.target.value)}
                    disabled={authLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth_password">Contraseña</Label>
                  <Input
                    id="auth_password"
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    disabled={authLoading}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={authLoading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                {authLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Verificar y activar cuenta
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground">
            ¿Problemas para acceder? Contacta a tu administrador.
          </p>
        </div>
      </main>
    </div>
  );
}
