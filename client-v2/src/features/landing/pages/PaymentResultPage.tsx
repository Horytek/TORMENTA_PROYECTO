import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Loader2, ArrowRight } from "lucide-react";
import { MarketingHeader } from "../components/MarketingHeader";
import { expressVerifyPayment } from "@/features/express/api/express";
import { getPendingPaymentFlow, clearPendingPaymentFlow } from "../utils/paymentFlow";

type Status = "verifying" | "approved" | "failure" | "pending" | "unknown";

const CONFIG: Record<Status, { icon: typeof CheckCircle2; tone: string; title: string; body: string }> = {
  verifying: {
    icon: Loader2,
    tone: "text-blue-600",
    title: "Verificando pago…",
    body: "Estamos confirmando tu transacción con MercadoPago. Esto toma unos segundos.",
  },
  approved: {
    icon: CheckCircle2,
    tone: "text-emerald-600",
    title: "¡Pago exitoso!",
    body: "Tu suscripción fue activada correctamente.",
  },
  failure: {
    icon: XCircle,
    tone: "text-destructive",
    title: "El pago no se completó",
    body: "Hubo un problema al procesar tu pago. Puedes intentarlo de nuevo desde los planes.",
  },
  pending: {
    icon: Clock,
    tone: "text-amber-600",
    title: "Pago en proceso",
    body: "Tu pago se está procesando. Te avisaremos por correo cuando se confirme.",
  },
  unknown: {
    icon: Clock,
    tone: "text-muted-foreground",
    title: "Estado desconocido",
    body: "No pudimos determinar el estado de tu pago.",
  },
};

export default function PaymentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("unknown");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    const search = new URLSearchParams(location.search);
    const paymentId = search.get("payment_id") || search.get("collection_id");
    const flow = getPendingPaymentFlow();

    if (path.includes("/failure")) {
      setStatus("failure");
      return;
    }
    if (path.includes("/pending")) {
      setStatus("pending");
      return;
    }
    if (!path.includes("/success")) {
      setStatus("unknown");
      return;
    }

    // El flujo ERP se activa vía webhook (usuario/empresa) y las credenciales llegan por
    // correo — no hay nada que verificar de forma síncrona en este redirect.
    if (flow !== "pocket" || !paymentId) {
      clearPendingPaymentFlow();
      setStatus("approved");
      setDetail(
        flow === "erp"
          ? "Recibirás tus credenciales de acceso por correo apenas se confirme el pago."
          : flow === "ecommerce"
            ? "Recibirás usuario, contraseña y el link de tu tienda (/tienda/…) por correo cuando se confirme el pago."
            : null
      );
      return;
    }

    // Flujo Pocket: verificar activa la suscripción y devuelve el token (auto-login).
    setStatus("verifying");
    expressVerifyPayment(paymentId).then((result) => {
      clearPendingPaymentFlow();
      if (result.success && result.token) {
        setStatus("approved");
        setTimeout(() => navigate("/express-pos", { replace: true }), 1500);
      } else {
        setStatus("failure");
        setDetail(result.message);
      }
    });
  }, [location, navigate]);

  const { icon: Icon, tone, title, body } = CONFIG[status];

  return (
    <div className="min-h-screen w-full bg-background">
      <MarketingHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Icon className={`h-8 w-8 ${tone} ${status === "verifying" ? "animate-spin" : ""}`} aria-hidden />
        </div>
        <h1 className="mt-6 text-[1.5rem] font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{detail || body}</p>

        {status === "failure" && (
          <Link
            to="/#planes"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver a intentar <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
        {status === "approved" && (
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ir a iniciar sesión <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
        {(status === "pending" || status === "unknown") && (
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:border-foreground/30"
          >
            Volver al inicio
          </Link>
        )}
      </main>
    </div>
  );
}
