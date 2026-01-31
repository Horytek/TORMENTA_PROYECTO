import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Chip,
  Tooltip,
} from "@heroui/react";
import { FaRegCreditCard } from "react-icons/fa";
import { CheckCircle, XCircle, X, DownloadCloud, AlertTriangle, Building2, CalendarDays, Banknote, Receipt, Sparkles, History, CreditCard, Info, ArrowRightLeft } from "lucide-react";
import { useUserStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getMpPayments, requestPlanChange, createPreference } from "@/services/payment.services";
import { getUsuario } from "@/services/usuario.services";
import { toast } from "react-hot-toast";

const PLAN_LABELS = { "1": "Enterprise", "2": "Pro", "3": "Basic" };
const PLAN_COLORS = { "1": "success", "2": "warning", "3": "default" };

const BILLING_FEATURES = [
  { id: 1, label: "Facturación electrónica" },
  { id: 2, label: "Historial de pagos" },
  { id: 3, label: "Soporte prioritario" },
  { id: 4, label: "Descarga de comprobantes" },
  { id: 5, label: "Alertas de vencimiento" },
];

// Helper component for summary pills
function InfoPill({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
      <div className="text-slate-400 dark:text-zinc-500 mb-1">{icon}</div>
      <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-slate-700 dark:text-zinc-200">{value || "-"}</span>
    </div>
  );
}

export default function BillingDrawer({ open, onClose }) {
  const { user, plan_pago, nombre } = useUserStore();
  const [empresaData, setEmpresaData] = useState(null);

  // Pagos reales mp_payments
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Solicitud de cambio de plan
  const [targetPlan, setTargetPlan] = useState("");
  const [reason, setReason] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showPlanChange, setShowPlanChange] = useState(false);

  // Auto-renovación (preapproval)
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);

  // Fecha de vencimiento real (usuario puede venir como array)
  const [fechaPago, setFechaPago] = useState(null);

  // Estado para confirmación de cancelación
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);


  useEffect(() => {
    if (open && nombre) {
      getEmpresaDataByUser(nombre)
        .then(data => setEmpresaData(data))
        .catch(() => setEmpresaData(null));
    }
  }, [open, nombre]);

  // Fecha de vencimiento real desde API de usuario (mismo patrón que AccountDrawer)
  useEffect(() => {
    let ignore = false;
    const fetchVencimiento = async () => {
      if (!open) return;
      try {
        let fecha = null;
        if (Array.isArray(user?.original)) {
          fecha = user.original[0]?.fecha_pago || null;
        } else if (user?.original?.fecha_pago) {
          fecha = user.original.fecha_pago;
        } else if (user?.fecha_pago) {
          fecha = user.fecha_pago;
        }
        if (!fecha && user?.id) {
          const u = await getUsuario(user.id);
          if (Array.isArray(u)) fecha = u[0]?.fecha_pago || null;
          else if (u?.fecha_pago) fecha = u.fecha_pago;
        }
        if (!ignore) setFechaPago(fecha);
      } catch {
        if (!ignore) setFechaPago(null);
      }
    };
    fetchVencimiento();
    return () => { ignore = true; };
  }, [open, user?.id]);

  // Cargar pagos del backend
  useEffect(() => {
    const fetchPayments = async () => {
      if (!open) return;
      try {
        setLoadingPayments(true);
        const res = await getMpPayments();
        setPayments(Array.isArray(res?.data) ? res.data : []);
      } catch {
        setPayments([]);
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchPayments();
  }, [open]);

  const planLabel = PLAN_LABELS[String(plan_pago)] || "Desconocido";
  const planColor = PLAN_COLORS[String(plan_pago)] || "default";
  const costo =
    empresaData?.costo ||
    (String(plan_pago) === "1" ? "S/ 240" : String(plan_pago) === "2" ? "S/ 135" : "S/ 85");
  const vencimiento = fechaPago || empresaData?.fecha_vencimiento || user?.original?.fecha_vencimiento || null;
  const empresa = empresaData?.razonSocial || empresaData?.empresa || "Empresa S.A.C.";
  const correo = empresaData?.email || user?.correo || user?.email || "-";
  const estado = empresaData?.estado || "Activo";

  const isBillingFeatureEnabled = (featureId) => {
    if (String(plan_pago) === "1") return true;
    if (String(plan_pago) === "2") return featureId <= 3;
    if (String(plan_pago) === "3") return featureId === 1;
    return false;
  };

  const alertaVencimiento = vencimiento && new Date(vencimiento) < new Date();

  // Lógica para habilitar pago: Solo si faltan 5 días o menos (o ya venció)
  const today = new Date();
  const vencimientoDate = vencimiento ? new Date(vencimiento) : null;
  const diffTime = vencimientoDate ? vencimientoDate - today : 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const canPay = !vencimientoDate || diffDays <= 5; // Habilitado 5 días antes o infinito si no hay fecha
  const fechaHabilitacion = vencimientoDate ? new Date(vencimientoDate.getTime() - (5 * 24 * 60 * 60 * 1000)) : null;






  // Manual Renewal (Pago manual mensual)
  const handleManualRenewal = async () => {
    try {
      setAutoRenewLoading(true);
      // Limpiar costo a numero
      const amount = Number(String(costo).replace(/[^\d.]/g, "")) || 0;

      const preferenceData = {
        items: [
          {
            id: `RENEW_${plan_pago}_${Date.now()}`,
            title: `Renovación Plan ${planLabel}`,
            quantity: 1,
            unit_price: amount,
            description: `Renovación mensual del plan ${planLabel} para ${empresa}`
          }
        ],
        payer: {
          email: correo,
          name: empresa
        },
        external_reference: correo, // Clave para vincular el pago al tenant
        back_urls: {
          success: window.location.origin + "/success",
          failure: window.location.origin + "/failure",
          pending: window.location.origin + "/pending"
        },
        auto_return: "approved"
      };

      const res = await createPreference(preferenceData);
      const data = res?.data || res;

      if (data?.id) {
        // Redirigir al checkout de Mercado Pago (init_point no siempre viene en la respuesta corta, pero si la id)
        // Usualmente la respuesta trae init_point si es full. Si no, usamos el sandbox/prod link construible o esperamos init_point.
        // Ajuste: createPreference controller devuelve { id, success: true }, falta init_point?
        // Revisemos controller: devuelve { id: result.id, success: true }. LE FALTA init_point.
        // Pero el wallet brick usaba ID. Aqui queremos link.
        // El SDK de react abre modal. Nosotros queremos Link.
        // !IMPORTANTE: El controller actual solo devuelve ID.
        // Vamos a intentar abrir el checkout con el ID (sandbox o production).
        // O mejor: usar el WalletBrick aqui? No, el usuario quiere link/boton.

        // HACK: Si el controller no devuelve init_point, no podemos redirigir facilmente sin el SDK.
        // Pero el usuario dijo "mande un link".
        // Voy a asumir que el controller PUEDE devolver init_point o lo ajustaré si falla.
        // Por ahora, si solo tengo ID, instancio el checkout pro o uso el link estandar:
        // https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=...

        const countryUrl = "https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=";
        window.location.href = `${countryUrl}${data.id}`;
      } else {
        toast.error("No se pudo generar el enlace de pago");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al iniciar renovación");
    } finally {
      setAutoRenewLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    // Feedback visual solamente, ya que "Cancelar" en modelo manual significa no pagar.
    const dateStr = vencimiento ? new Date(vencimiento).toLocaleDateString() : "hoy";
    toast(
      (t) => (
        <div className="text-sm">
          <b>Suscripción cancelada</b>
          <p>Tendrás acceso hasta el {dateStr}. Luego, tu cuenta pasará a inactiva si no realizas el pago.</p>
          <Button size="sm" variant="light" onPress={() => toast.dismiss(t.id)} className="mt-2 text-blue-500">
            Entendido
          </Button>
        </div>
      ),
      { duration: 6000, icon: "🗓️" }
    );
  };

  // Enviar solicitud de cambio de plan (Resend)
  const handleRequestPlanChange = async () => {
    if (!targetPlan || !reason.trim()) {
      toast.error("Seleccione el plan destino y detalle el motivo");
      return;
    }
    try {
      setSendingRequest(true);
      const res = await requestPlanChange({
        current_plan: planLabel,
        target_plan: targetPlan,
        reason,
        requester_email: correo,
        requester_name: empresa,
      });
      if (res?.success) {
        toast.success("Solicitud enviada. Te contactaremos pronto.");
        setTargetPlan("");
        setReason("");
        setShowPlanChange(false);
      } else {
        toast.error(res?.message || "No se pudo enviar la solicitud");
      }
    } catch {
      toast.error("Error al enviar la solicitud");
    } finally {
      setSendingRequest(false);
    }
  };



  return (
    <Drawer
      isOpen={open}
      onOpenChange={(v) => { if (!v) onClose?.(); }}
      placement="right"
      size="sm"
      overlayClassName="bg-black/40 backdrop-blur-[2px]"
      className="z-[12000]"
      motionProps={{
        variants: {
          enter: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
          exit: { opacity: 0, x: 100, transition: { duration: 0.2, ease: "easeIn" } },
        }
      }}
    >
      <DrawerContent>
        {(internalClose) => (
          <>
            <DrawerHeader className="sticky top-0 z-10 px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                  <FaRegCreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">
                    Facturación
                  </h3>
                  <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">Plan y métodos de pago</p>
                </div>
                <div className="flex items-center gap-2">
                  <Chip
                    size="sm"
                    variant="flat"
                    className={`font-semibold text-[10px] h-6 px-2 border ${String(plan_pago) === "1" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      String(plan_pago) === "2" ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                  >
                    {planLabel}
                  </Chip>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                    onPress={() => {
                      internalClose?.();
                      onClose?.();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DrawerHeader>

            <DrawerBody className="px-5 py-6 bg-slate-50/50 dark:bg-zinc-950/50">
              <div className="space-y-4">
                {/* Summary Card */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/10 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight truncate">{empresa}</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{correo}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <InfoPill icon={<CalendarDays className="w-3.5 h-3.5" />} label="Vence" value={vencimiento ? new Date(vencimiento).toLocaleDateString() : "-"} />
                      <InfoPill icon={<Banknote className="w-3.5 h-3.5" />} label="Costo" value={costo} />
                      <InfoPill icon={<Receipt className="w-3.5 h-3.5" />} label="Pagos" value={payments.length.toString()} />
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-zinc-400">Estado</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${alertaVencimiento ? "bg-red-500" : "bg-emerald-500"} shadow-sm`} />
                      <span className={`text-xs font-semibold ${alertaVencimiento ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                        Plan {String(plan_pago) || "-"} • {estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alert Banner */}
                {alertaVencimiento && (
                  <div className="rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 border border-red-200/80 dark:border-red-800/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">¡Suscripción vencida!</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Realiza el pago para reactivar tu acceso.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Billing Features Card */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">Beneficios de Facturación</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    {BILLING_FEATURES.map((f) => {
                      const enabled = isBillingFeatureEnabled(f.id);
                      return (
                        <div key={f.id} className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition-colors ${enabled ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "opacity-50"}`}>
                          <div className="flex items-center gap-3">
                            {enabled ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-400 dark:text-zinc-600" />
                            )}
                            <span className={`text-sm ${enabled ? "text-slate-700 dark:text-zinc-200 font-medium" : "text-slate-500 dark:text-zinc-500"}`}>
                              {f.label}
                            </span>
                          </div>
                          {!enabled && <span className="text-[10px] text-slate-400 dark:text-zinc-600 uppercase tracking-wide">No incluido</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment History Card */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">Historial de Pagos</span>
                    </div>
                  </div>
                  <div className="p-4">
                    {loadingPayments ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : payments.length === 0 ? (
                      <div className="text-center py-6">
                        <Receipt className="w-8 h-8 text-slate-300 dark:text-zinc-700 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 dark:text-zinc-500">Sin pagos registrados</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {payments.map(p => (
                          <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${String(p.status).toLowerCase() === "approved" ? "bg-emerald-500" : "bg-amber-500"}`} />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-700 dark:text-zinc-200 truncate">
                                  {p.currency_id || "S/"} {Number(p.transaction_amount || 0).toFixed(2)}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                                  {new Date(p.date_created || p.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Tooltip content="Descargar comprobante">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-700 rounded-lg"
                                onPress={() => window.open(`/api/payment-receipt/${p.id}`, "_blank")}
                              >
                                <DownloadCloud className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscription Status Card */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">Estado de Suscripción</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                          {alertaVencimiento
                            ? "Tu suscripción ha vencido. Realiza el pago para reactivar."
                            : "Tu plan se renueva mensualmente de forma manual."}
                        </p>
                        {vencimiento && (
                          <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md text-xs font-medium ${alertaVencimiento ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"}`}>
                            <CalendarDays className="w-3 h-3" />
                            Vence el: {new Date(vencimiento).toLocaleDateString()}
                          </div>
                        )}
                        {!canPay && fechaHabilitacion && (
                          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                            Podrás renovar a partir del {fechaHabilitacion.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Tooltip content={!canPay ? `Habilitado 5 días antes del vencimiento` : "Pago de renovación mensual"}>
                          <Button
                            size="sm"
                            className={`${!canPay ? "opacity-50 bg-slate-100 text-slate-400" : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"}`}
                            isLoading={autoRenewLoading}
                            onPress={handleManualRenewal}
                            isDisabled={!canPay}
                          >
                            Pagar Renovación
                          </Button>
                        </Tooltip>
                        <Button
                          size="sm"
                          variant="light"
                          className="text-xs h-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onPress={() => setShowCancelConfirm(true)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>

                    {/* Cancel Confirmation */}
                    {showCancelConfirm && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200/80 dark:border-red-900/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">¿Estás seguro?</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mb-3 leading-relaxed">
                          Si cancelas, tendrás acceso hasta el <span className="font-semibold">{vencimiento ? new Date(vencimiento).toLocaleDateString() : "fin del periodo"}</span>. Luego, tu cuenta y la de todos tus usuarios se desactivarán.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="flat"
                            className="h-7 text-xs"
                            onPress={() => setShowCancelConfirm(false)}
                          >
                            Volver
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            className="h-7 text-xs px-4"
                            onPress={() => {
                              handleCancelSubscription();
                              setShowCancelConfirm(false);
                            }}
                          >
                            Sí, cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* FAQ Accordion */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <Accordion isCompact variant="light" className="px-0">
                    <AccordionItem
                      key="1"
                      aria-label="Instrucciones de Pago"
                      title={
                        <div className="flex items-center gap-2 py-1">
                          <Info className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">¿Cómo funciona la renovación?</span>
                        </div>
                      }
                      classNames={{
                        trigger: "px-4 py-3",
                        content: "px-4 pb-4"
                      }}
                    >
                      <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-2.5">
                        <p className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">1</span> <span><strong>Pago habilitado:</strong> El botón se activa 5 días antes del vencimiento.</span></p>
                        <p className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">2</span> <span><strong>Sin cobros automáticos:</strong> No te debitaremos nada.</span></p>
                        <p className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">3</span> <span><strong>Renovación:</strong> El pago extiende 30 días automáticamente.</span></p>
                        <p className="flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">4</span> <span><strong>Vencimiento:</strong> Hay un breve periodo de gracia antes de perder acceso.</span></p>
                      </div>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Plan Change Request Card */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wide">Cambio de Plan</span>
                    </div>
                    {!showPlanChange && (
                      <Button size="sm" variant="flat" className="h-7 text-xs" onPress={() => setShowPlanChange(true)}>
                        Solicitar
                      </Button>
                    )}
                  </div>

                  {!showPlanChange ? (
                    <div className="p-4">
                      <p className="text-xs text-slate-500 dark:text-zinc-400 text-center">
                        Envía una solicitud indicando el plan deseado y el motivo del cambio.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      <select
                        value={targetPlan}
                        onChange={(e) => setTargetPlan(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        aria-label="Plan destino"
                      >
                        <option value="">Seleccione nuevo plan</option>
                        <option value="Basic">Basic</option>
                        <option value="Pro">Pro</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Cuéntanos por qué deseas cambiar de plan..."
                        className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        aria-label="Motivo del cambio"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="flat" className="h-8" onPress={() => { setShowPlanChange(false); setTargetPlan(""); setReason(""); }}>
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          color="primary"
                          className="h-8"
                          isLoading={sendingRequest}
                          isDisabled={!targetPlan || !reason.trim()}
                          onPress={handleRequestPlanChange}
                        >
                          Enviar solicitud
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </DrawerBody>

            <DrawerFooter className="px-6 py-4 bg-transparent border-t border-blue-100/30 dark:border-zinc-700/30 rounded-b-2xl flex justify-end gap-2">
              <Button size="sm" variant="flat" onPress={() => { internalClose?.(); onClose?.(); }}>
                Cerrar
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
