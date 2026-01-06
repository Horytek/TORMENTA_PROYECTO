import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  Button, Chip, Tooltip
} from "@heroui/react";
import { Info, X, UserCog } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useStore";
import { addClave } from "@/services/clave.services";
import { toast } from "react-hot-toast";

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
              <DrawerHeader className="sticky top-0 z-10 px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">Cuenta</h3>
                    <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">Información y configuración</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {trialInfo.loading ? (
                      <Chip size="sm" variant="flat" className="bg-slate-100 text-slate-400 h-6 text-[10px]">...</Chip>
                    ) : trialInfo.isTrial ? (
                      <Chip
                        size="sm"
                        variant="flat"
                        className="font-semibold text-[10px] h-6 px-2 bg-amber-50 text-amber-700 border border-amber-100"
                      >
                        Prueba • {trialInfo.daysLeft}d
                      </Chip>
                    ) : (
                      <Chip
                        size="sm"
                        variant="flat"
                        className="font-semibold text-[10px] h-6 px-2 bg-emerald-50 text-emerald-700 border border-emerald-100"
                      >
                        Producción
                      </Chip>
                    )}

                    {puedeEditar && (
                      <Tooltip content="Editar datos Sunat" closeDelay={0}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-lg"
                          onPress={() => setIsEditing(true)}
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    )}
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
                      onPress={() => { internalClose?.(); onClose?.(); }}
                      aria-label="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DrawerHeader>

              <DrawerBody className="px-0 bg-slate-50/50 dark:bg-zinc-950/50 p-5">
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