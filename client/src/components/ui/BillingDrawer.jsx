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
import { getEmpresaDataByUser } from "@/services/empresa.services";

// Simulación de historial de pagos/facturas
const FACTURAS_FAKE = [
  { id: 1, fecha: "2024-05-01", monto: "S/ 120", estado: "Pagado", url: "#" },
  { id: 2, fecha: "2024-04-01", monto: "S/ 120", estado: "Pagado", url: "#" },
  { id: 3, fecha: "2024-03-01", monto: "S/ 120", estado: "Pendiente", url: "#" },
];

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

  useEffect(() => {
    if (open && nombre) {
      getEmpresaDataByUser(nombre)
        .then(data => setEmpresaData(data))
        .catch(() => setEmpresaData(null));
    }
  }, [open, nombre]);

  const planLabel = PLAN_LABELS[String(plan_pago)] || "Desconocido";
  const planColor = PLAN_COLORS[String(plan_pago)] || "default";
  const costo =
    empresaData?.costo ||
    (String(plan_pago) === "1" ? "S/ 120" : String(plan_pago) === "2" ? "S/ 60" : "S/ 30");
  const vencimiento = empresaData?.fecha_vencimiento || user?.fecha_vencimiento || null;
  const empresa = empresaData?.razonSocial || empresaData?.empresa || "Empresa S.A.C.";
  const correo = empresaData?.email || user?.correo || user?.email || "-";
  const estado = empresaData?.estado || "Activo";
  const metodoPago = empresaData?.metodo_pago || "Tarjeta Visa **** 1234"; // Simulado

  const isBillingFeatureEnabled = (featureId) => {
    if (String(plan_pago) === "1") return true;
    if (String(plan_pago) === "2") return featureId <= 3;
    if (String(plan_pago) === "3") return featureId === 1;
    return false;
  };

  // Simulación de alerta de vencimiento
  const alertaVencimiento = vencimiento && new Date(vencimiento) < new Date();

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
                  {/* Reemplazo método de pago por cantidad de comprobantes emitidos */}
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Comprobantes emitidos</span>
                    <div className="font-medium">{FACTURAS_FAKE.length}</div>
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
                <div>
                  <div className="mb-2 text-xs text-gray-500 dark:text-zinc-400">Historial de pagos</div>
                  <div className="space-y-2">
                    {FACTURAS_FAKE.map(factura => (
                      <div key={factura.id} className="flex items-center justify-between text-xs">
                        <span>
                          {factura.fecha} • {factura.monto} •
                          <span className={`ml-1 font-semibold ${factura.estado === "Pagado" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
                            {factura.estado}
                          </span>
                        </span>
                        <Tooltip content="Descargar factura">
                          <Button
                            isIconOnly
                            size="xs"
                            variant="light"
                            className="text-blue-600 dark:text-blue-300"
                            onPress={() => window.open(factura.url, "_blank")}
                          >
                            <DownloadCloud className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
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
              <Button
                size="sm"
                color="primary"
                onPress={() => {
                  window.location.href = "/app/facturacion";
                  internalClose?.();
                  onClose?.();
                }}
              >
                Administrar plan
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}