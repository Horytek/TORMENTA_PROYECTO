import {
  Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter,
  Button, Chip, Tooltip, Input
} from "@heroui/react";
import { Info, CheckCircle, XCircle, X, UserCog, FileKey, Image as ImageIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/store/useStore";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getFunciones } from "@/services/funciones.services";
import { getPlanes } from "@/services/planes.services";
import { getUsuario, updateUsuario } from "@/services/usuario.services";
import { addClave } from "@/services/clave.services";
import axios from "@/api/axios";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent
} from "@/components/ui/empty";
import { Toaster, toast } from "react-hot-toast";

// Cache simple para evitar recargas redundantes
const cache = {
  empresa: null,
  funciones: null,
  planes: null,
  lastNombre: null,
  lastPlanPago: null
};

export default function AccountDrawer({ open, onClose }) {
  // Estado global usuario
  const user = useUserStore(s => s.user);
  const plan_pago = useUserStore(s => s.plan_pago);
  const nombre = useUserStore(s => s.nombre);

  // Estado UI / datos
  const [empresaData, setEmpresaData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [funcionesPlan, setFuncionesPlan] = useState([]);
  const [allFunciones, setAllFunciones] = useState([]);
  const [fechaPago, setFechaPago] = useState(null);

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

  // Info de prueba
  const [trialInfo, setTrialInfo] = useState({
    isTrial: false,
    daysLeft: 0,
    trialEnd: null,
    extended: false,
    readyForProd: false
  });

  // Flag de recarga
  const reloadRef = useRef(false);

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

  // Fetch inicial empresa / funciones / fecha pago
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      const needsReload =
        reloadRef.current ||
        cache.lastNombre !== nombre ||
        cache.lastPlanPago !== plan_pago ||
        !cache.empresa ||
        !cache.funciones ||
        !cache.planes;

      if (!open || !nombre) return;

      if (needsReload) {
        try {
          const data = await getEmpresaDataByUser(nombre);
          if (!ignore) {
            cache.empresa = data;
            cache.lastNombre = nombre;
            setEmpresaData(data);
            setForm(f => ({
              ...f,
              ruc: data?.ruc || "",
              razon_social: data?.razonSocial || data?.empresa || "",
              direccion: data?.direccion || ""
            }));
          }
        } catch {
          if (!ignore) setEmpresaData(null);
        }

        try {
          const [funciones, planes] = await Promise.all([getFunciones(), getPlanes()]);
          cache.funciones = funciones || [];
            cache.planes = planes || [];
          setAllFunciones(funciones || []);
          const planObj = planes?.find(p => String(p.id_plan) === String(plan_pago));
          const ids = planObj?.funciones ? planObj.funciones.split(",").map(n => Number(n)) : [];
          setFuncionesPlan(ids);
          cache.lastPlanPago = plan_pago;
        } catch {
          setAllFunciones([]);
          setFuncionesPlan([]);
        }

        reloadRef.current = false;
      } else {
        setEmpresaData(cache.empresa);
        setAllFunciones(cache.funciones);
        const planObj = cache.planes?.find(p => String(p.id_plan) === String(plan_pago));
        const ids = planObj?.funciones ? planObj.funciones.split(",").map(n => Number(n)) : [];
        setFuncionesPlan(ids);
      }

      // fecha_pago
      try {
        let fecha = null;
        const src = user?.original;
        if (Array.isArray(src)) fecha = src[0]?.fecha_pago;
        else fecha = src?.fecha_pago || user?.fecha_pago || null;
        if (!fecha && user?.id) {
          const u = await getUsuario(user.id);
          fecha = Array.isArray(u) ? u[0]?.fecha_pago : u?.fecha_pago;
        }
        if (!ignore) setFechaPago(fecha || null);
      } catch {
        if (!ignore) setFechaPago(null);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [open, nombre, plan_pago, user?.id]);

  // Lógica periodo de prueba
  useEffect(() => {
    if (!open) return;
    const MS_DAY = 86400000;
    const fmt = d => d.toISOString().slice(0, 10);

    const evalTrial = async () => {
      if (!fechaPago) {
        setTrialInfo({ isTrial: false, daysLeft: 0, trialEnd: null, extended: false, readyForProd: true });
        if (user?.id) try { await updateUsuario(user.id, { estado_prueba: 0 }); } catch {}
        return;
      }

      const fp = new Date(fechaPago);
      if (Number.isNaN(fp.getTime())) {
        setTrialInfo({ isTrial: false, daysLeft: 0, trialEnd: null, extended: false, readyForProd: true });
        if (user?.id) try { await updateUsuario(user.id, { estado_prueba: 0 }); } catch {}
        return;
      }

      const trialStart = new Date(fp);
      trialStart.setMonth(trialStart.getMonth() - 1);
      let trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 7);

      const today = new Date();
      let ventasCount = 0;
      let productosCount = 0;

      try {
        const resV = await axios.get("/reporte/registro_ventas_sunat", {
          params: { startDate: fmt(trialStart), endDate: fmt(today) }
        });
        const rows = Array.isArray(resV?.data?.data) ? resV.data.data : [];
        ventasCount = rows.length;
      } catch {}

      try {
        const resK = await axios.get("/kardex");
        const items = Array.isArray(resK?.data?.data) ? resK.data.data : [];
        productosCount = items.length;
      } catch {}

      const readyForProd = ventasCount > 0 && productosCount > 0;

      let extended = false;
      if (!readyForProd && today > trialEnd) {
        const maxEnd = fp;
        while (today > trialEnd && trialEnd < maxEnd) {
          const next = new Date(trialEnd);
          next.setDate(next.getDate() + 7);
          trialEnd = next <= maxEnd ? next : maxEnd;
          extended = true;
        }
      }

      const isTrial = !readyForProd && today < trialEnd;
      const daysLeft = Math.max(0, Math.ceil((trialEnd - today) / MS_DAY));

      setTrialInfo({
        isTrial,
        daysLeft,
        trialEnd: trialEnd.toISOString(),
        extended,
        readyForProd
      });

      try {
        if (user?.id) await updateUsuario(user.id, { estado_prueba: isTrial ? 1 : 0 });
      } catch {}
    };

    evalTrial();
  }, [open, fechaPago, user?.id]);

  // Helpers UI
  const isEnabled = id => funcionesPlan.includes(id);
  const handleInputChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  // Guardar empresa + token SUNAT
  const handleSave = async () => {
    setLoading(true);
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
      let data = await resp.json();

      if (resp.status === 409) {
        resp = await fetch("https://facturacion.apisperu.com/api/v1/companies", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
          body: JSON.stringify(payload)
        });
        data = await resp.json();
      }

      if (!resp.ok) {
        toast.error(`Error apisperu (${resp.status})`);
        setLoading(false);
        return;
      }

      if (data?.token?.code) {
        await addClave({
          id_empresa: empresaData?.id_empresa,
          tipo: "Sunat",
          valor: data.token.code,
          estado_clave: 1
        });
        toast.success("Token guardado");
        setIsEditing(false);
        reloadRef.current = true;
      } else {
        toast.error("Respuesta sin token");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error enviando datos");
    } finally {
      setLoading(false);
    }
  };

  // Derivados UI
  const empresa = empresaData?.razonSocial || empresaData?.empresa || "Empresa S.A.C.";
  const correo = empresaData?.email || user?.original?.correo || user?.original?.email || "-";
  const ruc = empresaData?.ruc || "-";
  const direccion = empresaData?.direccion || "-";
  const telefono = empresaData?.telefono || "-";
  const logo = empresaData?.logotipo || null;
  const responsables = empresaData?.responsables || [];
  const vencimiento = fechaPago || empresaData?.fecha_vencimiento || user?.original?.fecha_vencimiento || null;
  const costo =
    empresaData?.costo ||
    (String(plan_pago) === "1" ? "S/ 240" : String(plan_pago) === "2" ? "S/ 135" : "S/ 85");
  const estado = empresaData?.estado || "Activo";
  const puedeEditar = user?.roleId === 1 || user?.roleId === "admin";

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
                <div className="flex items-center gap-3 w-full flex-wrap"> {/* <- permite envolver a 2 filas */}
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border border-blue-100/30 dark:border-zinc-700/30">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                 <div className="flex-1 min-w-0"> {/* <- título ocupa el espacio disponible */}
                    <h3 className="font-semibold text-base text-gray-900 dark:text-blue-100 truncate">Cuenta</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Datos de la empresa y beneficios</p>
                  </div>
                 <div className="w-full md:w-auto md:ml-auto mt-2 md:mt-0 mr-2 flex items-center gap-2 justify-start md:justify-end"> 
                   {/* ^ chips pasan a segunda fila en pantallas estrechas */}
                    {trialInfo.isTrial ? (
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
                  <div className="rounded-2xl bg-gradient-to-br from-bgDark1/80 via-bgDark2/80 to-bgDark1/80 dark:from-zinc-900/80 dark:via-zinc-900/70 dark:to-zinc-900/80 border border-gray-100/20 dark:border-zinc-700/30 shadow-sm p-5">
                    <div className="flex items-center gap-4 mb-4">
                      {logo && (
                        <img
                          src={logo}
                          alt="Logo empresa"
                          className="w-12 h-12 rounded-lg border border-gray-200 dark:border-zinc-700 object-contain bg-white"
                        />
                      )}
                      <div>
                        <div
                          className="font-bold text-blue-900 dark:text-blue-100 text-lg break-words leading-tight max-w-[260px]"
                          title={empresa}
                        >
                          {empresa}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">RUC: {ruc}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-blue-100 mb-2">
                      <DataItem label="Correo" value={correo} />
                      <DataItem label="Teléfono" value={telefono} />
                      <DataItem label="Dirección" value={direccion} />
                      <DataItem
                        label="Vencimiento"
                        value={vencimiento ? new Date(vencimiento).toLocaleDateString() : "Sin fecha"}
                      />
                      <DataItem label="Costo" value={costo} />
                      <DataItem label="Resumen" value={`Plan ${String(plan_pago) || "-"} • ${estado}`} />
                    </div>

                    <div className="mb-2">
                      {trialInfo.isTrial ? (
                        <TrialBanner trialInfo={trialInfo} />
                      ) : (
                        <ProdBanner />
                      )}
                    </div>

                    {responsables?.length > 0 && (
                      <Responsables responsables={responsables} />
                    )}

                    <DividerLine />
                    <Beneficios allFunciones={allFunciones} isEnabled={isEnabled} />
                    <FooterHint />
                  </div>
                ) : (
                  <EditForm
                    form={form}
                    loading={loading}
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

/* Subcomponentes internos simples */

function DataItem({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-500 dark:text-zinc-400">{label}</span>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}

function TrialBanner({ trialInfo }) {
  return (
    <div className="flex items-center gap-2 text-yellow-700 text-sm">
      <Info className="w-4 h-4" />
      <span>
        Periodo de prueba activo. Quedan {trialInfo.daysLeft} días.
        {trialInfo.extended && (
          <span className="ml-2 text-xs text-yellow-600">(extendido por falta de ventas/productos)</span>
        )}
      </span>
    </div>
  );
}

function ProdBanner() {
  return (
    <div className="flex items-center gap-2 text-green-700 text-sm">
      <CheckCircle className="w-4 h-4" />
      <span>Producción activa.</span>
    </div>
  );
}

function Responsables({ responsables }) {
  return (
    <div className="mb-2">
      <span className="text-xs text-gray-500 dark:text-zinc-400">Responsables</span>
      <ul className="text-xs text-gray-700 dark:text-blue-100 ml-2 list-disc">
        {responsables.map((r, i) => (
          <li key={i}>{r.nombre} ({r.rol})</li>
        ))}
      </ul>
    </div>
  );
}

function DividerLine() {
  return <div className="my-3 h-px bg-gradient-to-r from-gray-100 to-transparent dark:from-zinc-800/30" />;
}

function Beneficios({ allFunciones, isEnabled }) {
  return (
    <div>
      <div className="mb-2 text-xs text-gray-500 dark:text-zinc-400">Beneficios disponibles</div>
      <div className="space-y-2">
        {allFunciones.map(f => {
          const enabled = isEnabled(f.id_funciones);
          return (
            <div key={f.id_funciones} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {enabled ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                )}
                <span className={`text-sm ${enabled ? "text-gray-800 dark:text-blue-100" : "text-gray-500 dark:text-zinc-400"}`}>
                  {f.funcion}
                </span>
              </div>
              {!enabled && <span className="text-xs text-gray-400 dark:text-zinc-500">No incluido</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FooterHint() {
  return (
    <div className="mt-4 text-xs text-gray-500 dark:text-zinc-400">
      <p className="leading-snug">
        Información básica de la cuenta. Para más detalles o editar datos pulsa "Gestionar datos".
      </p>
    </div>
  );
}

function EditForm({ form, loading, onChange, onCert, onLogo, onCancel, onSave }) {
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); onSave(); }}>
      <SelectField label="Plan *" name="plan" value={form.plan} onChange={onChange} options={[["free", "Free"]]} />
      <SelectField
        label="Entorno *"
        name="environment"
        value={form.environment}
        onChange={onChange}
        options={[["beta", "Beta Sunat"], ["produccion", "Producción Sunat"]]}
      />
      <Input label="Usuario SOL" name="sol_user" value={form.sol_user} onChange={onChange} className="w-full" />
      <Input label="Contraseña SOL" name="sol_pass" value={form.sol_pass} onChange={onChange} className="w-full" />
      <Input label="RUC *" name="ruc" value={form.ruc} onChange={onChange} required className="w-full" />
      <Input label="Razón Social *" name="razon_social" value={form.razon_social} onChange={onChange} required className="w-full" />
      <Input label="Dirección *" name="direccion" value={form.direccion} onChange={onChange} required className="w-full" />
      <Input
        label="Contraseña del Certificado *"
        name="cert_password"
        value={form.cert_password}
        onChange={onChange}
        required
        className="w-full"
        placeholder="Contraseña del archivo .pfx/.p12"
      />
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileKey className="text-blue-500" />
          </EmptyMedia>
          <EmptyTitle>Certificado SUNAT <span className="text-red-500">*</span></EmptyTitle>
          <EmptyDescription>Archivo PFX/P12 (Base64)</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <input
            id="certificado"
            name="certificado"
            type="file"
            accept=".pfx,.p12"
            onChange={onCert}
            className="w-full mt-2 cursor-pointer"
            required
          />
        </EmptyContent>
      </Empty>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon className="text-blue-500" />
          </EmptyMedia>
          <EmptyTitle>Logo SUNAT <span className="text-red-500">*</span></EmptyTitle>
          <EmptyDescription>PNG (Base64)</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png"
            onChange={onLogo}
            className="w-full mt-2 cursor-pointer"
            required
          />
        </EmptyContent>
      </Empty>
      <Input label="Client ID" name="client_id" value={form.client_id} onChange={onChange} className="w-full" />
      <Input label="Client Secret" name="client_secret" value={form.client_secret} onChange={onChange} className="w-full" />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="flat" onPress={onCancel}>Cancelar</Button>
        <Button size="sm" color="primary" type="submit" isLoading={loading}>Guardar</Button>
      </div>
    </form>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full rounded-lg border px-3 py-2"
      >
        <option value="">Seleccione</option>
        {options.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
    </div>
  );
}