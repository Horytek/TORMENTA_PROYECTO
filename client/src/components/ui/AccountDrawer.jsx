import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  Button, Chip, Tooltip
} from "@heroui/react";
import { Info, X, UserCog } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useStore";
import { addClave } from "@/services/clave.services";
import { Toaster, toast } from "react-hot-toast";

// Hooks
import { useAccountData } from "@/hooks/useAccountData";
import { useTrialStatus } from "@/hooks/useTrialStatus";

// Components
import AccountInfo from "@/components/ui/Account/AccountInfo";
import AccountEditForm from "@/components/ui/Account/AccountEditForm";

export default function AccountDrawer({ open, onClose }) {
  // Estado global usuario
  const user = useUserStore(s => s.user);
  const plan_pago = useUserStore(s => s.plan_pago);
  const nombre = useUserStore(s => s.nombre);

  // Hooks de datos optimizados
  const { data, loading: dataLoading, reload } = useAccountData({ open });
  const trialInfo = useTrialStatus({ open, fechaPago: data.fechaPago, user });

  // Estado UI
  const [isEditing, setIsEditing] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // Formulario edición
  const [form, setForm] = useState({
    plan: "",
    environment: "",
    sol_user: "",
    sol_pass: "",
    ruc: "",
    razon_social: "",
    direccion: "",
    cert_password: "",
    certificadoBase64: "",
    logoBase64: "",
    client_id: "",
    client_secret: ""
  });

  // Actualizar formulario cuando llegan datos de empresa
  useEffect(() => {
    if (data.empresa && !isEditing) {
      setForm(f => ({
        ...f,
        ruc: data.empresa?.ruc || "",
        razon_social: data.empresa?.razonSocial || data.empresa?.empresa || "",
        direccion: data.empresa?.direccion || ""
      }));
    }
  }, [data.empresa, isEditing]);

  // Utilidades
  const fileToBase64 = file =>
    new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const fetchApiToken = async () => {
    const resp = await fetch("https://facturacion.apisperu.com/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "destinyelvacio@outlook.com", password: "AedoDelSol" })
    });
    const data = await resp.json();
    if (!data.token) throw new Error("Token apisperu ausente");
    return data.token;
  };

  const getPemFromCert = async () => {
    try {
      const token = await fetchApiToken();
      const resp = await fetch("https://facturacion.apisperu.com/api/v1/companies/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cert: form.certificadoBase64,
          cert_pass: form.cert_password,
          base64: true
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data?.pem) {
        toast.error(data?.message || "Error obteniendo PEM");
        return null;
      }
      return data.pem;
    } catch {
      toast.error("Error conversión PEM");
      return null;
    }
  };

  // Handlers de archivos
  const handleCertificadoChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setForm(p => ({ ...p, certificadoBase64: b64 }));
    } catch {
      toast.error("Error base64 certificado");
    }
  };

  const handleLogoChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setForm(p => ({ ...p, logoBase64: b64 }));
    } catch {
      toast.error("Error base64 logo");
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  // Guardar empresa + token SUNAT
  const handleSave = async () => {
    setLoadingSave(true);
    const asStr = v => (v != null && String(v).trim() !== "" ? String(v) : "string");
    try {
      const pem = await getPemFromCert();
      const apiToken = await fetchApiToken();
      const payload = {
        plan: asStr(form.plan),
        environment: asStr(form.environment),
        sol_user: asStr(form.sol_user),
        sol_pass: asStr(form.sol_pass),
        ruc: asStr(form.ruc),
        razon_social: asStr(form.razon_social),
        direccion: asStr(form.direccion),
        certificado: asStr(pem || form.certificadoBase64),
        logo: asStr(form.logoBase64),
        client_id: asStr(form.client_id),
        client_secret: asStr(form.client_secret)
      };

      let resp = await fetch("https://facturacion.apisperu.com/api/v1/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify(payload)
      });
      let dataRes = await resp.json();

      if (resp.status === 409) {
        resp = await fetch("https://facturacion.apisperu.com/api/v1/companies", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
          body: JSON.stringify(payload)
        });
        dataRes = await resp.json();
      }

      if (!resp.ok) {
        toast.error(`Error apisperu (${resp.status})`);
        setLoadingSave(false);
        return;
      }

      if (dataRes?.token?.code) {
        await addClave({
          id_empresa: data.empresa?.id_empresa,
          tipo: "Sunat",
          valor: dataRes.token.code,
          estado_clave: 1
        });
        toast.success("Token guardado");
        setIsEditing(false);
        reload(); // Recargar datos
      } else {
        toast.error("Respuesta sin token");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error enviando datos");
    } finally {
      setLoadingSave(false);
    }
  };

  // Derivados UI
  const empresa = data.empresa?.razonSocial || data.empresa?.empresa || "Empresa S.A.C.";
  const correo = data.empresa?.email || user?.original?.correo || user?.original?.email || "-";
  const ruc = data.empresa?.ruc || "-";
  const direccion = data.empresa?.direccion || "-";
  const telefono = data.empresa?.telefono || "-";
  const logo = data.empresa?.logotipo || null;
  const responsables = data.empresa?.responsables || [];
  const vencimiento = data.fechaPago || data.empresa?.fecha_vencimiento || user?.original?.fecha_vencimiento || null;
  const costo =
    data.empresa?.costo ||
    (String(plan_pago) === "1" ? "S/ 240" : String(plan_pago) === "2" ? "S/ 135" : "S/ 85");
  const estado = data.empresa?.estado || "Activo";
  const puedeEditar = user?.roleId === 1 || user?.roleId === "admin";

  const isEnabled = id => data.funcionesPlan.includes(id);

  return (
    <>
      <Toaster position="top-center" />
      <Drawer
        isOpen={open}
        onOpenChange={v => { if (!v) onClose?.(); }}
        placement="right"
        size="sm"
        overlayClassName="bg-black/40 backdrop-blur-[2px]"
        className="z-[12000]"
      >
        <DrawerContent>
          {internalClose => (
            <>
              <DrawerHeader className="sticky top-0 z-10 px-6 py-4 pr-14 border-b border-blue-100/30 dark:border-zinc-700/30 bg-gradient-to-r from-white/80 via-white/60 to-transparent dark:from-zinc-900/80 dark:via-zinc-900/70 dark:to-transparent backdrop-blur-md">
                <div className="flex items-center gap-3 w-full flex-wrap">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border border-blue-100/30 dark:border-zinc-700/30">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 dark:text-blue-100 truncate">Cuenta</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Datos de la empresa y beneficios</p>
                  </div>
                  <div className="w-full md:w-auto md:ml-auto mt-2 md:mt-0 mr-2 flex items-center gap-2 justify-start md:justify-end">
                    {trialInfo.loading ? (
                      <Chip size="sm" variant="flat" className="animate-pulse bg-gray-100">Cargando...</Chip>
                    ) : trialInfo.isTrial ? (
                      <Chip
                        size="sm"
                        color="warning"
                        variant="flat"
                        className="font-semibold text-[12px] py-0.5 px-2 bg-yellow-50 text-yellow-700 border border-yellow-200"
                      >
                        Periodo de prueba • {trialInfo.daysLeft}d
                      </Chip>
                    ) : (
                      <Chip
                        size="sm"
                        color="success"
                        variant="flat"
                        className="font-semibold text-[12px] py-0.5 px-2 bg-green-50 text-green-700 border border-green-200"
                      >
                        Producción
                      </Chip>
                    )}
                    <Chip
                      size="sm"
                      variant="flat"
                      className="font-semibold text-[12px] py-0.5 px-2 bg-white/80 dark:bg-zinc-800/70 text-gray-800 dark:text-blue-100 border border-gray-200 dark:border-zinc-700/30"
                      aria-label={`Plan ${String(plan_pago) || "-"}`}
                    >
                      Plan {String(plan_pago) || "-"}
                    </Chip>
                    {puedeEditar && (
                      <Tooltip content="Editar datos Sunat">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="text-blue-600 dark:text-blue-300"
                          onPress={() => setIsEditing(true)}
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
                    onPress={() => { internalClose?.(); onClose?.(); }}
                    aria-label="Cerrar cuenta"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DrawerHeader>

              <DrawerBody className="px-6 py-5 bg-transparent">
                {!isEditing ? (
                  <AccountInfo
                    empresa={empresa}
                    ruc={ruc}
                    logo={logo}
                    correo={correo}
                    telefono={telefono}
                    direccion={direccion}
                    vencimiento={vencimiento}
                    costo={costo}
                    plan_pago={plan_pago}
                    estado={estado}
                    trialInfo={trialInfo}
                    responsables={responsables}
                    allFunciones={data.funciones}
                    isEnabled={isEnabled}
                  />
                ) : (
                  <AccountEditForm
                    form={form}
                    loading={loadingSave}
                    onChange={handleInputChange}
                    onCert={handleCertificadoChange}
                    onLogo={handleLogoChange}
                    onCancel={() => setIsEditing(false)}
                    onSave={handleSave}
                  />
                )}
              </DrawerBody>

              <DrawerFooter className="px-6 py-4 bg-transparent border-t border-blue-100/30 dark:border-zinc-700/30 rounded-b-2xl flex justify-end gap-2">
                <Button size="sm" variant="flat" onPress={() => { internalClose?.(); onClose?.(); }}>
                  Cerrar
                </Button>
                {!isEditing && (
                  <Button size="sm" color="primary" onPress={() => setIsEditing(true)}>
                    Gestionar datos
                  </Button>
                )}
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}