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
import { useEffect, useState, useRef } from "react";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getMpPayments, requestPlanChange, createPreapproval } from "@/services/payment.services";
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
  const [subActive, setSubActive] = useState(false);
  const [subNextPayment, setSubNextPayment] = useState(null);
  const [subChecking, setSubChecking] = useState(false);

  // Referencia para el intervalo de polling
  const pollingIntervalRef = useRef(null);

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


    // Helper: consulta estado de suscripción
  const fetchSubscriptionStatus = async () => {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || "").trim());
    if (!emailOk) {
      console.log("⚠️ Email no válido para verificar suscripción:", correo);
      return;
    }
    try {
      setSubChecking(true);
      console.log("🔄 Verificando estado de suscripción para:", correo, "Plan:", planLabel);
      const res = await createPreapproval({ plan: planLabel, email: correo });
      const data = res?.data || res;
      console.log("📊 Respuesta de suscripción:", data);
      
      // Solo mostrar "Activa" si MP confirma (estricto)
      const isActive = Boolean(data?.active_strict ?? data?.active);
      setSubActive(isActive);
      setSubNextPayment(data?.preapproval?.next_payment_date || null);
      
      console.log(isActive ? "✅ Suscripción ACTIVA" : "❌ Suscripción NO activa");
    } catch (err) {
      console.error("❌ Error al verificar suscripción:", err);
      setSubActive(false);
      setSubNextPayment(null);
    } finally {
      setSubChecking(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchSubscriptionStatus();
  }, [open, planLabel, correo]);

  // Re-check al volver del tab/ventana
  useEffect(() => {
    if (!open) return;
    
    const onFocus = () => {
      console.log("🔍 Usuario regresó a la ventana, verificando suscripción...");
      fetchSubscriptionStatus();
    };
    
    const onVisibilityChange = () => {
      if (!document.hidden) {
        console.log("👁️ Pestaña visible, verificando suscripción...");
        fetchSubscriptionStatus();
      }
    };
    
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [open, planLabel, correo]);

  // Preapproval (renovación automática)
  const handleEnableAutoRenew = async () => {
    try {
      setAutoRenewLoading(true);
      console.log("🚀 Iniciando proceso de activación de renovación automática");
      
      const res = await createPreapproval({
        plan: planLabel,
        amount: Number(String(costo).replace(/[^\d.]/g, "")) || 0,
        email: correo,
        nombre: empresa,
      });
      const data = res?.data || res;
      console.log("📦 Respuesta inicial de preapproval:", data);
      
      if (data?.init_point) {
        // Abrir ventana de MercadoPago
        console.log("🌐 Abriendo ventana de MercadoPago:", data.init_point);
        const mpWindow = window.open(data.init_point, "_blank");
        
        // Limpiar cualquier polling anterior
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        
        // Iniciar polling inteligente
        let attempts = 0;
        const maxAttempts = 40; // 2 minutos (40 * 3 segundos)
        
        console.log("⏰ Iniciando polling cada 3 segundos (máx 2 minutos)");
        
        pollingIntervalRef.current = setInterval(async () => {
          attempts++;
          console.log(`🔍 Polling intento ${attempts}/${maxAttempts}`);
          
          // Verificar estado de suscripción
          try {
            const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || "").trim());
            if (!emailOk) {
              console.log("⚠️ Email no válido, deteniendo polling");
              clearInterval(pollingIntervalRef.current);
              return;
            }
            
            const checkRes = await createPreapproval({ plan: planLabel, email: correo });
            const checkData = checkRes?.data || checkRes;
            const isActive = Boolean(checkData?.active_strict ?? checkData?.active);
            
            console.log(`📊 Intento ${attempts}: isActive=${isActive}, source=${checkData?.source}`);
            
            if (isActive) {
              // ¡Suscripción activada!
              console.log("🎉 ¡SUSCRIPCIÓN ACTIVADA! Deteniendo polling");
              setSubActive(true);
              setSubNextPayment(checkData?.preapproval?.next_payment_date || null);
              clearInterval(pollingIntervalRef.current);
              toast.success("¡Suscripción activada correctamente!");
              
              // Cerrar ventana de MP si aún está abierta
              if (mpWindow && !mpWindow.closed) {
                console.log("🪟 Cerrando ventana de MercadoPago");
                mpWindow.close();
              }
            } else if (attempts >= maxAttempts) {
              // Tiempo agotado
              console.log("⏱️ Tiempo agotado, deteniendo polling");
              clearInterval(pollingIntervalRef.current);
              toast("Verifica tu correo para confirmar el pago", { icon: "⏳" });
            }
          } catch (err) {
            console.error("❌ Error en polling:", err);
            if (attempts >= maxAttempts) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        }, 3000);
      } else {
        console.error("❌ No se recibió init_point");
        toast.error(data?.message || "No se pudo generar la suscripción automática");
      }
    } catch (err) {
      console.error("❌ Error al crear preapproval:", err);
      toast.error("Error al crear la suscripción automática");
    } finally {
      setAutoRenewLoading(false);
    }
  };
  
  // Limpiar polling al desmontar o cerrar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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

useEffect(() => {
  let alive = true;
  const checkSubscription = async () => {
    if (!open) return;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo || "").trim());
    if (!emailOk) return;
    try {
      setSubChecking(true);
      const res = await createPreapproval({ plan: planLabel, email: correo });
      const data = res?.data || res;
      if (!alive) return;
      setSubActive(Boolean(data?.active_strict ?? data?.active));
      setSubNextPayment(data?.preapproval?.next_payment_date || null);
    } catch {
      if (!alive) return;
      setSubActive(false);
      setSubNextPayment(null);
    } finally {
      if (alive) setSubChecking(false);
    }
  };
  checkSubscription();
  return () => { alive = false; };
}, [open, planLabel, correo]);

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
            <DrawerHeader className="sticky top-0 z-10 px-6 py-4 pr-14 border-b border-blue-100/30 dark:border-zinc-700/30 bg-gradient-to-r from-white/80 via-white/60 to-transparent dark:from-zinc-900/80 dark:via-zinc-900/70 dark:to-transparent backdrop-blur-md">
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border border-blue-100/30 dark:border-zinc-700/30">
                  <FaRegCreditCard className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-blue-100 truncate">
                    Facturación
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Detalles de tu plan y pagos</p>
                </div>
                <div className="ml-auto flex items-center gap-2 mr-2">
                  <Chip
                    color={planColor}
                    size="sm"
                    variant="flat"
                    className="font-semibold text-[12px] py-0.5 px-2 bg-white/80 dark:bg-zinc-800/70 text-gray-800 dark:text-blue-100 border border-gray-200 dark:border-zinc-700/30 min-w-[72px] text-center"
                    aria-label={`Plan ${planLabel}`}
                  >
                    {planLabel}
                  </Chip>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="absolute right-4 top-4 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 z-20"
                  onPress={() => {
                    internalClose?.();
                    onClose?.();
                  }}
                  aria-label="Cerrar facturación"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DrawerHeader>

            <DrawerBody className="px-6 py-5 bg-transparent">
              <div className="rounded-2xl bg-gradient-to-br from-bgDark1/80 via-bgDark2/80 to-bgDark1/80 dark:from-zinc-900/80 dark:via-zinc-900/70 dark:to-zinc-900/80 border border-gray-100/20 dark:border-zinc-700/30 shadow-sm p-5">
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
                  {/* Auto-renovación */}
                  <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-800 dark:text-blue-100">Renovación automática</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          {subChecking ? "Verificando suscripción..." : subActive ? "Tu suscripción está activa" : "Autoriza cobros recurrentes de tu plan actual"}
                        </div>
                        {subActive && subNextPayment && (
                          <div className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
                            Próximo cobro: {new Date(subNextPayment).toLocaleString("es-PE")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!subChecking && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color={subActive ? "success" : "default"}
                          >
                            {subActive ? "Activa" : "No activa"}
                          </Chip>
                        )}
                        {!subActive && (
                          <Button
                            size="sm"
                            color="primary"
                            isLoading={autoRenewLoading}
                            onPress={handleEnableAutoRenew}
                            isDisabled={subChecking}
                          >
                            Activar
                          </Button>
                        )}
                      </div>
                    </div>
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