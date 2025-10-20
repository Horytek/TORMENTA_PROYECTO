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
import { Info, CheckCircle, XCircle, X, UserCog } from "lucide-react";
import { useUserStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { getEmpresaDataByUser } from "@/services/empresa.services";

const FEATURE_LABELS = [
  { id: 1, key: "usuarios_ilimitados", label: "Usuarios ilimitados" },
  { id: 2, key: "multiples_sucursales", label: "Múltiples sucursales" },
  { id: 3, key: "chatbot", label: "Asistente (Chatbot)" },
  { id: 4, key: "mensajeria_log", label: "Mensajería / Logs" },
  { id: 5, key: "sucursales_ilimitadas", label: "Sucursales ilimitadas" },
];

export default function AccountDrawer({ open, onClose }) {
  const { user, plan_pago, nombre } = useUserStore();
  const funciones = Array.isArray(user?.funciones) ? user.funciones : [];
  const [empresaData, setEmpresaData] = useState(null);

  useEffect(() => {
    if (open && nombre) {
      getEmpresaDataByUser(nombre)
        .then(data => setEmpresaData(data))
        .catch(() => setEmpresaData(null));
    }
  }, [open, nombre]);

  const isEnabled = (featureId) => {
    if (String(plan_pago) === "1") return true;
    if (funciones && funciones.length) return funciones.includes(featureId);
    return false;
  };

  const empresa = empresaData?.razonSocial || empresaData?.empresa || "Empresa S.A.C.";
  const correo = empresaData?.email || user?.correo || user?.email || "-";
  const ruc = empresaData?.ruc || "-";
  const direccion = empresaData?.direccion || "-";
  const telefono = empresaData?.telefono || "-";
  const logo = empresaData?.logotipo || null;
  const responsables = empresaData?.responsables || [];
  const vencimiento = empresaData?.fecha_vencimiento || user?.fecha_vencimiento || null;
  const costo =
    empresaData?.costo ||
    (String(plan_pago) === "1" ? "S/ 120" : String(plan_pago) === "2" ? "S/ 60" : "S/ 30");
  const estado = empresaData?.estado || "Activo";
  const puedeEditar = user?.rol === 1 || user?.rol === "admin"; // Ajusta según tu lógica de permisos

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
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-blue-100 truncate">
                    Cuenta
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Datos de la empresa y beneficios</p>
                </div>
                <div className="ml-auto flex items-center gap-2 mr-2">
                  <Chip
                    size="sm"
                    variant="flat"
                    className="font-semibold text-[12px] py-0.5 px-2 bg-white/80 dark:bg-zinc-800/70 text-gray-800 dark:text-blue-100 border border-gray-200 dark:border-zinc-700/30 min-w-[72px] text-center"
                    aria-label={`Plan ${String(plan_pago) || "-"}`}
                  >
                    Plan {String(plan_pago) || "-"}
                  </Chip>
                  {puedeEditar && (
                    <Tooltip content="Editar empresa">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-blue-600 dark:text-blue-300"
                        onPress={() => window.location.href = "/configuracion/negocio"}
                      >
                        <UserCog className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  )}
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
                  aria-label="Cerrar cuenta"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DrawerHeader>

            <DrawerBody className="px-6 py-5 bg-transparent">
              <div className="rounded-2xl bg-gradient-to-br from-bgDark1/80 via-bgDark2/80 to-bgDark1/80 dark:from-zinc-900/80 dark:via-zinc-900/70 dark:to-zinc-900/80 border border-gray-100/20 dark:border-zinc-700/30 shadow-sm p-5">
                <div className="flex items-center gap-4 mb-4">
                  {logo && (
                    <img src={logo} alt="Logo empresa" className="w-12 h-12 rounded-lg border border-gray-200 dark:border-zinc-700 object-contain bg-white" />
                  )}
                  <div>
                    <div
                        className="font-bold text-blue-900 dark:text-blue-100 text-lg break-words leading-tight max-w-[210px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[480px] 2xl:max-w-[540px]"
                        title={empresa}
                        >
                        {empresa}
                        </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">RUC: {ruc}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-blue-100 mb-2">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Correo</span>
                    <div className="font-medium truncate">{correo}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Teléfono</span>
                    <div className="font-medium truncate">{telefono}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Dirección</span>
                    <div className="font-medium truncate">{direccion}</div>
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
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Resumen</span>
                    <div className="text-sm text-gray-600 dark:text-zinc-300 mt-1">
                      Plan {String(plan_pago) || "-"} • {estado}
                    </div>
                  </div>
                </div>
                {responsables && responsables.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 dark:text-zinc-400">Responsables</span>
                    <ul className="text-xs text-gray-700 dark:text-blue-100 ml-2 list-disc">
                      {responsables.map((r, i) => (
                        <li key={i}>{r.nombre} ({r.rol})</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="my-3 h-px bg-gradient-to-r from-gray-100 to-transparent dark:from-zinc-800/30" />
                <div>
                  <div className="mb-2 text-xs text-gray-500 dark:text-zinc-400">Beneficios disponibles</div>
                  <div className="space-y-2">
                    {FEATURE_LABELS.map((f) => {
                      const enabled = isEnabled(f.id);
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
                <div className="mt-4 text-xs text-gray-500 dark:text-zinc-400">
                  <p className="leading-snug">
                    Información básica de la cuenta. Para más detalles, cambios de plan o editar datos de empresa, pulsa "Gestionar plan" o el icono de edición.
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
                Gestionar plan
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}