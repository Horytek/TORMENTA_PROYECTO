import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "@/store/useUserStore";
import { loginRequest, sendAuthCodeRequest } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setToken } from "@/utils/authStorage";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check, Store } from "lucide-react";
import { expressLogin, expressRegister } from "@/features/express/api/express";
import { loginEcommerce } from "@/features/ecommerce/api/ecommerce";
import { useEcommerceAuthStore } from "@/features/ecommerce/store/useEcommerceAuthStore";
import { createPreference } from "@/features/account/api/billing";
import { setPendingPaymentFlow } from "@/features/landing/utils/paymentFlow";
import { POCKET_PLANS } from "@/features/landing/data/landing.data";
import { ProductPicker, type ProductPickerMode } from "@/features/auth/components/ProductPicker";
import { DemoAccessCard } from "@/features/auth/components/DemoAccessCard";
import { LoginRoleTabs } from "@/features/auth/components/LoginRoleTabs";
import { LoginBrandPanel } from "@/features/auth/components/LoginBrandPanel";
import { portalInputClass } from "@/features/platform/ui/portalTouch";
import { buildLoginProductOptions, HORYTEK_PRODUCTS } from "@/features/platform/catalog/horytekProducts";
import {
  getLoginAccent,
  PORTAL_SLUG_LOGIN_MODES,
  PRODUCT_AUTH_LOGIN_MODES,
} from "@/features/auth/loginAccents";
import {
  adminPathForLoginMode,
  clientPathTemplateForLoginMode,
  loginProductAdmin,
} from "@/features/auth/productAdminAuth";
import { TaxiLoginPanel } from "@/features/auth/components/TaxiLoginPanel";
import { DeliveryLoginPanel } from "@/features/auth/components/DeliveryLoginPanel";
import {
  ERP_SESSION_LOGIN_MODES,
  getLoginDemoBundle,
} from "@/features/platform/demo/loginDemoBundles";

const KNOWN_LOGIN_MODES = new Set([
  ...buildLoginProductOptions().map((o) => o.mode),
  "validar",
]);

type LoginMode = ProductPickerMode;

function AccentSubmitButton({
  accent,
  loading,
  children,
  disabled,
}: {
  accent: string;
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className="w-full border-0 text-white hover:opacity-90"
      style={{ backgroundColor: accent }}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Ingresando…
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [params] = useSearchParams();
  const modeParam = params.get("mode") || "erp";
  const initialMode: LoginMode = KNOWN_LOGIN_MODES.has(modeParam) ? modeParam : "erp";
  const [mode, setMode] = useState<LoginMode>(initialMode);
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

  // Ecommerce admin
  const [ecomUser, setEcomUser] = useState("");
  const [ecomPassword, setEcomPassword] = useState("");
  const [ecomShowPassword, setEcomShowPassword] = useState(false);
  const [ecomLoading, setEcomLoading] = useState(false);
  const [ecomError, setEcomError] = useState("");
  const setEcomSession = useEcommerceAuthStore((s) => s.setSession);

  // Mayorista B2B — redirige al portal por slug
  const [mayoristaSlug, setMayoristaSlug] = useState("");
  const [portalSlug, setPortalSlug] = useState("");
  /** Admin (creds) vs portal público (slug) en productos con ambas superficies */
  const [surfaceTab, setSurfaceTab] = useState<"admin" | "portal">("admin");
  const [productEmail, setProductEmail] = useState("");
  const [productPassword, setProductPassword] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");

  const loginAccent = getLoginAccent(mode);
  const loginProductLabel = useMemo(() => {
    if (mode === "validar") return "Cuenta";
    if (mode === "express") return "Pocket";
    if (mode === "ecommerce") return "Ecommerce";
    return buildLoginProductOptions().find((o) => o.mode === mode)?.label || "ERP";
  }, [mode]);
  const loginSubtitle = useMemo(() => {
    if (mode === "validar") return "Ingrese el código de seguridad.";
    if (mode === "ecommerce") return "Accede al panel de tu tienda online.";
    if (mode === "express") {
      return expressIsRegistering
        ? "Crea tu cuenta de punto de venta ligero."
        : "Modo ligero de punto de venta (beta).";
    }
    if (mode === "taxi") return "Elige tu rol: operador, pasajero o conductor.";
    if (mode === "delivery") return "Elige tu rol: operador, cliente o repartidor.";
    if (PRODUCT_AUTH_LOGIN_MODES.has(mode)) {
      return surfaceTab === "portal"
        ? "Indica el slug u operador para abrir el portal del producto."
        : "Accede al panel administrativo del producto.";
    }
    if (ERP_SESSION_LOGIN_MODES.has(mode)) {
      return surfaceTab === "portal" && PORTAL_SLUG_LOGIN_MODES.has(mode)
        ? "Abre el portal u ops demo del producto."
        : "Entra con tu cuenta ERP al panel del producto.";
    }
    return "Elige un producto e ingresa.";
  }, [mode, surfaceTab, expressIsRegistering]);
  const demoBundle = useMemo(
    () => getLoginDemoBundle(mode, surfaceTab),
    [mode, surfaceTab]
  );

  const applyLoginDemo = () => {
    const b = getLoginDemoBundle(mode, surfaceTab);
    if (!b) return;
    const { fill } = b;
    if (fill.slug != null) {
      setPortalSlug(fill.slug);
      setMayoristaSlug(fill.slug);
    }
    if (fill.email != null) {
      setProductEmail(fill.email);
      setExpressEmail(fill.email);
    }
    if (fill.password != null) {
      setPassword(fill.password);
      setProductPassword(fill.password);
      setEcomPassword(fill.password);
      setExpressPassword(fill.password);
    }
    if (fill.usuario != null) {
      setUsuario(fill.usuario);
      setEcomUser(fill.usuario);
    }
    if (fill.codigo != null) setPortalSlug(fill.codigo);
  };

  const enterLoginDemo = async () => {
    const b = getLoginDemoBundle(mode, surfaceTab);
    if (!b) return;
    applyLoginDemo();
    if (b.openHref && surfaceTab === "portal") {
      navigate(b.openHref);
      return;
    }
    if (mode === "express" && b.fill.email && b.fill.password) {
      setExpressEmail(b.fill.email);
      setExpressPassword(b.fill.password);
      setExpressLoading(true);
      setExpressError("");
      try {
        await expressLogin({ email: b.fill.email, password: b.fill.password });
        navigate("/express-pos");
      } catch (err: unknown) {
        setExpressError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "No se pudo entrar a la demo de Pocket. ¿Corriste npm run seed:express?"
        );
      } finally {
        setExpressLoading(false);
      }
      return;
    }
    if (mode === "ecommerce" && b.fill.usuario && b.fill.password) {
      setEcomUser(b.fill.usuario);
      setEcomPassword(b.fill.password);
      setEcomLoading(true);
      setEcomError("");
      try {
        const res = await loginEcommerce(b.fill.usuario, b.fill.password);
        if (!res.success || !res.data?.token) {
          setEcomError(res.message || "Credenciales inválidas.");
          return;
        }
        setEcomSession(res.data.token, {
          usuario: res.data.usuario,
          email: res.data.email,
          id_tienda: res.data.id_tienda,
          slug: res.data.slug,
          tienda: res.data.tienda,
        });
        navigate("/ecommerce-admin");
      } catch (err: unknown) {
        setEcomError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Error al iniciar sesión en Ecommerce."
        );
      } finally {
        setEcomLoading(false);
      }
      return;
    }
    if (PRODUCT_AUTH_LOGIN_MODES.has(mode) && surfaceTab === "admin") {
      const slug = b.fill.slug || "demo";
      const email = b.fill.email || "";
      const pass = b.fill.password || "";
      setProductLoading(true);
      setProductError("");
      try {
        const res = await loginProductAdmin(mode, { slug, email, password: pass });
        if (!res.success) throw new Error(res.message || "No se pudo iniciar sesión.");
        const dest = adminPathForLoginMode(mode);
        if (!dest) throw new Error("Sin ruta admin para este producto.");
        navigate(dest);
      } catch (err: unknown) {
        setProductError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (err as Error).message ||
            "Error al iniciar sesión."
        );
      } finally {
        setProductLoading(false);
      }
      return;
    }
    if (ERP_SESSION_LOGIN_MODES.has(mode) && b.fill.usuario && b.fill.password) {
      setUsuario(b.fill.usuario);
      setPassword(b.fill.password);
      setLoading(true);
      setError("");
      try {
        const response = await loginRequest({
          usuario: b.fill.usuario,
          password: b.fill.password,
        });
        const { success, token, data, message } = response.data;
        if (success && token) {
          await setToken(token);
          setUserRaw(data);
          const roleId = Number(data.rol || data.id_rol || data.roleId);
          if (roleId) {
            await useUserStore.getState().loadPermissionsAndCapabilities(roleId);
          }
          const dest =
            adminPathForLoginMode(mode) ||
            (mode === "erp" ? "/dashboard" : null) ||
            "/dashboard";
          navigate(dest);
        } else {
          setError(message || "Usuario o contraseña incorrectos.");
        }
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "No pudimos conectar con el servidor. Intenta de nuevo."
        );
      } finally {
        setLoading(false);
      }
    }
  };

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

  const handleEcommerceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEcomError("");
    if (!ecomUser || !ecomPassword) {
      setEcomError("Ingresa usuario y contraseña.");
      return;
    }
    setEcomLoading(true);
    try {
      const res = await loginEcommerce(ecomUser, ecomPassword);
      if (!res.success || !res.data?.token) {
        setEcomError(res.message || "Credenciales inválidas.");
        return;
      }
      setEcomSession(res.data.token, {
        usuario: res.data.usuario,
        email: res.data.email,
        id_tienda: res.data.id_tienda,
        slug: res.data.slug,
        tienda: res.data.tienda,
      });
      navigate("/ecommerce-admin");
    } catch (err: any) {
      setEcomError(err.response?.data?.message || "Error al iniciar sesión en Ecommerce.");
    } finally {
      setEcomLoading(false);
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
        const dest =
          adminPathForLoginMode(mode) ||
          (mode === "erp" ? "/dashboard" : null) ||
          "/dashboard";
        navigate(dest);
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

  const handleProductAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError("");
    if (!portalSlug.trim() || !productEmail.trim() || !productPassword) {
      setProductError("Completa slug, email y contraseña.");
      return;
    }
    setProductLoading(true);
    try {
      const res = await loginProductAdmin(mode, {
        slug: portalSlug.trim().toLowerCase(),
        email: productEmail.trim(),
        password: productPassword,
      });
      if (!res.success) throw new Error(res.message || "No se pudo iniciar sesión.");
      const dest = adminPathForLoginMode(mode);
      if (!dest) throw new Error("Sin ruta admin para este producto.");
      navigate(dest);
    } catch (err: unknown) {
      setProductError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err as Error).message ||
          "Error al iniciar sesión."
      );
    } finally {
      setProductLoading(false);
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
      <LoginBrandPanel mode={mode} />

      {/* ── Panel formulario ───────────────────────────────── */}
      <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <Link
          to="/"
          className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Volver al inicio
        </Link>
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: loginAccent }}
            >
              Iniciar sesión
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
              <img
                src="/horycore.svg"
                alt=""
                className="h-8 w-8 shrink-0 object-contain lg:hidden"
                aria-hidden
              />
              <span>
                Horytek{" "}
                <span style={{ color: loginAccent }}>{loginProductLabel}</span>
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{loginSubtitle}</p>
          </div>

          <ProductPicker
            value={mode}
            onChange={(m) => {
              setMode(m);
              setSurfaceTab("admin");
              setProductError("");
              setError("");
            }}
          />

          {mode === "taxi" ? <TaxiLoginPanel /> : null}
          {mode === "delivery" ? <DeliveryLoginPanel /> : null}

          {PORTAL_SLUG_LOGIN_MODES.has(mode) && mode !== "mayorista" ? (
            <div className="mb-5">
              <LoginRoleTabs
                tabs={[
                  { id: "admin" as const, label: "Administrador" },
                  { id: "portal" as const, label: "Portal / Ops" },
                ]}
                value={surfaceTab}
                accent={loginAccent}
                onChange={setSurfaceTab}
              />
            </div>
          ) : null}

          {ERP_SESSION_LOGIN_MODES.has(mode) &&
          (!PORTAL_SLUG_LOGIN_MODES.has(mode) || surfaceTab === "admin") ? (
            <form onSubmit={handleLogin} className="space-y-5">
              {demoBundle ? (
                <DemoAccessCard
                  bundle={demoBundle}
                  accent={loginAccent}
                  onApply={applyLoginDemo}
                  onEnter={() => void enterLoginDemo()}
                />
              ) : null}
              {mode === "mayorista" ? (
                <LoginRoleTabs
                  tabs={[
                    { id: "admin" as const, label: "Administrador" },
                    { id: "portal" as const, label: "Portal" },
                  ]}
                  value={surfaceTab}
                  accent={loginAccent}
                  onChange={setSurfaceTab}
                />
              ) : null}
              {error && (
                <div
                  role="alert"
                  className="animate-shake rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">{mode === "erp" ? "Usuario" : "Usuario ERP"}</Label>
                <Input
                  id="username"
                  type="text"
                  className={portalInputClass}
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
                    className={`${portalInputClass} pr-10`}
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

              <AccentSubmitButton accent={loginAccent} loading={loading}>
                <Check className="h-4 w-4" />
                Ingresar
              </AccentSubmitButton>
            </form>
          ) : mode === "express" ? (
            <form onSubmit={handleExpressSubmit} className="space-y-5">
              {demoBundle ? (
                <DemoAccessCard
                  bundle={demoBundle}
                  accent={loginAccent}
                  onApply={applyLoginDemo}
                  onEnter={enterLoginDemo}
                />
              ) : null}
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
                className="w-full border-0 text-white hover:opacity-90"
                style={{ backgroundColor: loginAccent }}
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
          ) : mode === "ecommerce" ? (
            <form onSubmit={handleEcommerceSubmit} className="space-y-5">
              {demoBundle ? (
                <DemoAccessCard
                  bundle={demoBundle}
                  accent={loginAccent}
                  onApply={applyLoginDemo}
                  onEnter={() => void enterLoginDemo()}
                />
              ) : null}
              {ecomError && (
                <div
                  role="alert"
                  className="animate-shake rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
                >
                  {ecomError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="ecom_user">Usuario o email</Label>
                <Input
                  id="ecom_user"
                  value={ecomUser}
                  onChange={(e) => setEcomUser(e.target.value)}
                  disabled={ecomLoading}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ecom_password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="ecom_password"
                    type={ecomShowPassword ? "text" : "password"}
                    value={ecomPassword}
                    onChange={(e) => setEcomPassword(e.target.value)}
                    disabled={ecomLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setEcomShowPassword((v) => !v)}
                    aria-label={ecomShowPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {ecomShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full border-0 text-white hover:opacity-90"
                style={{ backgroundColor: loginAccent }}
                disabled={ecomLoading}
              >
                {ecomLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar al admin"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                ¿Nuevo?{" "}
                <Link
                  to="/registro-ecommerce"
                  className="underline-offset-4 hover:underline"
                  style={{ color: loginAccent }}
                >
                  Activar tienda
                </Link>
              </p>
            </form>
          ) : mode === "mayorista" && surfaceTab === "portal" ? (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const s = mayoristaSlug.trim().toLowerCase();
                if (!s) return;
                navigate(`/b2b/${s}`);
              }}
            >
              <LoginRoleTabs
                tabs={[
                  { id: "admin" as const, label: "Administrador" },
                  { id: "portal" as const, label: "Portal" },
                ]}
                value={surfaceTab}
                accent={loginAccent}
                onChange={setSurfaceTab}
              />
              {demoBundle ? (
                <DemoAccessCard
                  bundle={demoBundle}
                  accent={loginAccent}
                  onApply={applyLoginDemo}
                  onEnter={() => void enterLoginDemo()}
                />
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="mayorista_slug">Slug del portal</Label>
                <Input
                  id="mayorista_slug"
                  className={portalInputClass}
                  value={mayoristaSlug}
                  onChange={(e) => setMayoristaSlug(e.target.value)}
                  placeholder="distribuidora-norte"
                  required
                />
              </div>
              <AccentSubmitButton accent={loginAccent}>Ir al portal B2B</AccentSubmitButton>
              <p className="text-center text-xs text-muted-foreground">
                El administrador del ERP te crea usuario y te da el slug.{" "}
                <Link to="/?product=mayorista" className="underline-offset-4 hover:underline">
                  Ver producto
                </Link>
              </p>
            </form>
          ) : mode === "taxi" || mode === "delivery" ? null : PRODUCT_AUTH_LOGIN_MODES.has(mode) && surfaceTab === "admin" ? (
            <form onSubmit={handleProductAdminLogin} className="space-y-5">
              {demoBundle ? (
                <DemoAccessCard
                  bundle={demoBundle}
                  accent={loginAccent}
                  onApply={applyLoginDemo}
                  onEnter={() => void enterLoginDemo()}
                />
              ) : null}
              {productError && (
                <div
                  role="alert"
                  className="animate-shake rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive"
                >
                  {productError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="prod_slug">Código del operador</Label>
                <Input
                  id="prod_slug"
                  className={portalInputClass}
                  value={portalSlug}
                  onChange={(e) => setPortalSlug(e.target.value)}
                  placeholder="mi-operador"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod_email">Email</Label>
                <Input
                  id="prod_email"
                  type="email"
                  className={portalInputClass}
                  value={productEmail}
                  onChange={(e) => setProductEmail(e.target.value)}
                  placeholder="admin@operador.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod_password">Contraseña</Label>
                <Input
                  id="prod_password"
                  type="password"
                  className={portalInputClass}
                  value={productPassword}
                  onChange={(e) => setProductPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <AccentSubmitButton accent={loginAccent} loading={productLoading}>
                <Check className="h-4 w-4" />
                Ingresar
              </AccentSubmitButton>
              <p className="text-center text-xs text-muted-foreground">
                ¿Primera vez?{" "}
                <Link
                  to={`/?product=${HORYTEK_PRODUCTS.find((p) => p.loginMode === mode)?.id || mode}#planes`}
                  className="underline-offset-4 hover:underline"
                >
                  Elige un plan
                </Link>{" "}
                para crear el operador.
              </p>
            </form>
          ) : PORTAL_SLUG_LOGIN_MODES.has(mode) && surfaceTab === "portal" ? (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const demo = getLoginDemoBundle(mode, "portal");
                if (demo?.openHref && (!portalSlug.trim() || portalSlug === demo.fill.slug || portalSlug === demo.fill.codigo)) {
                  navigate(demo.openHref);
                  return;
                }
                const s = portalSlug.trim().toLowerCase();
                if (!s) return;
                const tpl = clientPathTemplateForLoginMode(mode);
                if (!tpl && demo?.openHref) {
                  navigate(demo.openHref);
                  return;
                }
                const path = (tpl || `/?product=${mode}`)
                  .replace(":slug", s)
                  .replace(":codigo", s)
                  .replace(":idTenant", s);
                navigate(path.startsWith("/") ? path : `/${path}`);
              }}
            >
              {demoBundle ? (
                <DemoAccessCard
                  bundle={demoBundle}
                  accent={loginAccent}
                  onApply={applyLoginDemo}
                  onEnter={() => void enterLoginDemo()}
                />
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="portal_slug">Slug / código</Label>
                <Input
                  id="portal_slug"
                  className={portalInputClass}
                  value={portalSlug}
                  onChange={(e) => setPortalSlug(e.target.value)}
                  placeholder="demo"
                  required
                />
              </div>
              <AccentSubmitButton accent={loginAccent}>Ir al portal / ops</AccentSubmitButton>
              <p className="text-center text-xs text-muted-foreground">
                También puedes{" "}
                <Link
                  to={`/?product=${HORYTEK_PRODUCTS.find((p) => p.loginMode === mode)?.id || mode}`}
                  className="underline-offset-4 hover:underline"
                >
                  ver la landing del producto
                </Link>
                .
              </p>
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
