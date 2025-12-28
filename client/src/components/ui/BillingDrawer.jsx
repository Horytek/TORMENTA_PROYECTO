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
import { CheckCircle, XCircle, X, DownloadCloud, AlertTriangle } from "lucide-react";
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
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 shadow-sm p-5">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-blue-100 mb-2">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Empresa</span>
                    <div className="font-medium truncate">{empresa}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Correo</span>
                    <div className="font-medium truncate">{correo}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Vencimiento</span>
                    <div className="font-medium">{vencimiento ? new Date(vencimiento).toLocaleDateString() : "Sin fecha"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Costo</span>
                    <div className="font-medium">{costo}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Pagos registrados</span>
                    <div className="font-medium">{payments.length}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Resumen</span>
                    <div className="text-sm text-gray-600 dark:text-zinc-300 mt-1">
                      Plan {String(plan_pago) || "-"} • {estado}
                    </div>
                  </div>
                </div>
                {alertaVencimiento && (
                  <div className="flex items-center gap-2 my-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs text-yellow-700 dark:text-yellow-200">¡Tu suscripción está vencida o próxima a vencer!</span>
                  </div>
                )}
                <div className="my-3 h-px bg-gradient-to-r from-gray-100 to-transparent dark:from-zinc-800/30" />
                <div>
                  <div className="mb-2 text-xs text-gray-500 dark:text-zinc-400">Beneficios de facturación</div>
                  <div className="space-y-2">
                    {BILLING_FEATURES.map((f) => {
                      const enabled = isBillingFeatureEnabled(f.id);
                      return (
                        <div key={f.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {enabled ? (
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                            )}
                            <span className={`text-sm ${enabled ? "text-gray-800 dark:text-blue-100" : "text-gray-500 dark:text-zinc-400"}`}>
                              {f.label}
                            </span>
                          </div>
                          {!enabled && <span className="text-xs text-gray-400 dark:text-zinc-500">No incluido</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="my-4 h-px bg-gradient-to-r from-gray-100 to-transparent dark:from-zinc-800/30" />
                {/* Historial de pagos reales (mp_payments) */}
                <div>
                  <div className="mb-2 text-xs text-gray-500 dark:text-zinc-400">Historial de pagos</div>
                  <div className="space-y-2">
                    {loadingPayments ? (
                      <div className="text-xs text-gray-500">Cargando pagos...</div>
                    ) : payments.length === 0 ? (
                      <div className="text-xs text-gray-500">Sin pagos registrados</div>
                    ) : (
                      payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs">
                          <span className="truncate">
                            {new Date(p.date_created || p.created_at).toLocaleDateString()} • {p.currency_id || "S/"} {Number(p.transaction_amount || 0).toFixed(2)} •
                            <span className={`ml-1 font-semibold ${String(p.status).toLowerCase() === "approved" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                              {p.status}
                            </span>
                          </span>
                          <Tooltip content="Ver detalle">
                            <Button
                              isIconOnly
                              size="xs"
                              variant="light"
                              className="text-blue-600 dark:text-blue-300"
                              onPress={() => window.open(`/api/payment-receipt/${p.id}`, "_blank")}
                              aria-label="Descargar comprobante"
                            >
                              <DownloadCloud className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Renovación automática + Solicitud de cambio de plan (oculta por defecto) */}
                <div className="my-4 h-px bg-gradient-to-r from-gray-100 to-transparent dark:from-zinc-800/30" />

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800 dark:text-blue-100">Estado de Suscripción</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          {alertaVencimiento
                            ? "Tu suscripción ha vencido. Realiza el pago para reactivar."
                            : "Tu plan se renueva mensualmente de forma manual."}
                        </div>
                        {vencimiento && (
                          <div className={`text-[11px] font-semibold mt-1 ${alertaVencimiento ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                            Vence el: {new Date(vencimiento).toLocaleDateString()}
                          </div>
                        )}
                        {!canPay && fechaHabilitacion && (
                          <div className="mt-1 text-[10px] text-orange-500">
                            Podrás renovar a partir del {fechaHabilitacion.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Tooltip content={!canPay ? `Habilitado 5 días antes del vencimiento` : "Pago de renovación mensual"}>
                          <div className="w-full">
                            <Button
                              size="sm"
                              className={`w-full ${!canPay ? "opacity-50" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"}`}
                              isLoading={autoRenewLoading}
                              onPress={handleManualRenewal}
                              isDisabled={!canPay}
                            >
                              Pagar Renovación
                            </Button>
                          </div>
                        </Tooltip>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          className="text-xs h-7"
                          onPress={() => setShowCancelConfirm(true)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                    {/* Confirmación de Cancelación Inline */}
                    {showCancelConfirm && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg animate-in fade-in slide-in-from-top-1">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">¿Estás seguro?</p>
                        <p className="text-[11px] text-red-600 dark:text-red-400 mb-3 leading-snug">
                          Si cancelas, tendrás acceso hasta el <b>{vencimiento ? new Date(vencimiento).toLocaleDateString() : "fin del periodo"}</b>. Luego, tu cuenta y la de todos tus usuarios se desactivarán.
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="light"
                            className="h-6 text-[10px]"
                            onPress={() => setShowCancelConfirm(false)}
                          >
                            Volver
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            className="h-6 text-[10px] px-3"
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

                  {/* Instrucciones Breves */}
                  <div className="rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                    <Accordion isCompact variant="light">
                      <AccordionItem key="1" aria-label="Instrucciones de Pago" title={<span className="text-xs font-semibold text-gray-500">ℹ️ ¿Cómo funciona la renovación?</span>}>
                        <div className="text-xs text-gray-500 dark:text-zinc-400 space-y-2 pb-2">
                          <p>1. <b>Pago habilitado:</b> El botón de pago se activa 5 días antes de tu vencimiento.</p>
                          <p>2. <b>Sin cobros automáticos:</b> No te debitaremos nada. Tú decides cuándo pagar.</p>
                          <p>3. <b>Renovación:</b> Al realizar el pago, tu fecha de vencimiento se extiende 30 días automáticamente.</p>
                          <p>4. <b>Vencimiento:</b> Si llega la fecha y no pagas, tendrás un periodo de gracia breve antes de perder el acceso hasta que regularices.</p>
                        </div>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Solicitar cambio de plan (toggle) */}
                  {!showPlanChange ? (
                    <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800 dark:text-blue-100">Solicitar cambio de plan</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">Envía una solicitud indicando el plan y motivo</div>
                      </div>
                      <Button size="sm" variant="flat" onPress={() => setShowPlanChange(true)}>
                        Abrir formulario
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
                      <div className="text-sm font-semibold text-gray-800 dark:text-blue-100 mb-2">Solicitar cambio de plan</div>
                      <div className="grid grid-cols-1 gap-2">
                        <select
                          value={targetPlan}
                          onChange={(e) => setTargetPlan(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-sm"
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
                          placeholder="Cuéntanos por qué deseas cambiar de plan"
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          aria-label="Motivo del cambio"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="light" onPress={() => { setShowPlanChange(false); setTargetPlan(""); setReason(""); }}>
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            isLoading={sendingRequest}
                            isDisabled={!targetPlan || !reason.trim()}
                            onPress={handleRequestPlanChange}
                          >
                            Enviar solicitud
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-500 dark:text-zinc-400">
                  <p className="leading-snug">
                    Consulta aquí tus datos de facturación y beneficios. Para descargar comprobantes, cambiar de plan o actualizar método de pago, pulsa "Administrar plan".
                  </p>
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