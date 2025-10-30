import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Chip,
  Tooltip,
  Input,
} from "@heroui/react";
import { Info, CheckCircle, XCircle, X, UserCog, FileKey, Image as ImageIcon } from "lucide-react";
import { useUserStore } from "@/store/useStore";
import { useEffect, useState, useRef } from "react";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getFunciones } from "@/services/funciones.services";
import { getPlanes } from "@/services/planes.services";
import { getUsuario } from "@/services/usuario.services";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { addClave } from "@/services/clave.services";
import { Toaster,toast } from "react-hot-toast";

// Cache local para empresa y funciones/planes
const cache = {
  empresa: null,
  funciones: null,
  planes: null,
  lastNombre: null,
  lastPlanPago: null,
};

export default function AccountDrawer({ open, onClose }) {
  const user = useUserStore(state => state.user);
  const plan_pago = useUserStore(state => state.plan_pago);
  const nombre = useUserStore(state => state.nombre);
  const [empresaData, setEmpresaData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    plan: "",
    environment: "",
    sol_user: "",
    sol_pass: "",
    ruc: "",
    razon_social: "",
    direccion: "",
    certificado: null,
    logo: null,
    cert_password: "",
    certificadoBase64: "",
    pem: "",
    logoBase64: "",
    client_id: "",
    client_secret: "",
  });
  const [loading, setLoading] = useState(false);
  const [funcionesPlan, setFuncionesPlan] = useState([]);
  const [allFunciones, setAllFunciones] = useState([]);
  const [fechaPago, setFechaPago] = useState(null);

  // Ref para saber si hay que recargar datos (ej: después de guardar)
  const reloadRef = useRef(false);

  const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => {
      // Elimina el prefijo data:...base64,
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  // Obtener token de la API externa (login)
  const fetchApiToken = async () => {
    try {
      const response = await fetch("https://facturacion.apisperu.com/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "destinyelvacio@outlook.com",
          password: "AedoDelSol"
        }),
      });
      const data = await response.json();
      if (!data.token) throw new Error("No se pudo obtener el token de apisperu");
      return data.token;
    } catch (e) {
      toast.error("Error al obtener token de apisperu");
      throw e;
    }
  };

  // Convertir certificado a base64 y luego obtener PEM usando la API de certificados
  const handleCertificadoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, certificado: file }));
    try {
      const base64 = await fileToBase64(file);
      setForm((prev) => ({ ...prev, certificadoBase64: base64 }));
    } catch {
      toast.error("Error al convertir archivo a base64");
    }
  };

  // Convertir logo a base64 usando la API
  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, logo: file }));
    try {
      const base64 = await fileToBase64(file);
      setForm((prev) => ({ ...prev, logoBase64: base64 }));
    } catch {
      toast.error("Error al convertir archivo a base64");
    }
  };

  // Obtener PEM desde la API de certificados
const getPemFromCert = async () => {
  try {
    const token = await fetchApiToken();
    const response = await fetch("https://facturacion.apisperu.com/api/v1/companies/certificate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cert: form.certificadoBase64,   // base64 del .pfx/.p12 (sin prefijo data:)
        cert_pass: form.cert_password,  // contraseña del certificado
        base64: true,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(`Error al convertir certificado: ${data?.message || response.statusText}`);
      return null;
    }

    if (!data?.pem) {
      toast.error("No se pudo obtener el PEM del certificado");
      return null;
    }
    return data.pem;
  } catch (e) {
    toast.error("Error al convertir certificado a PEM con apisperu");
    return null;
  }
};

  useEffect(() => {
    let ignore = false;
    async function fetchEmpresaAndFunciones() {
      // Solo consulta si hay cambio de usuario, plan o reload forzado
      const shouldReload =
        reloadRef.current ||
        cache.lastNombre !== nombre ||
        cache.lastPlanPago !== plan_pago ||
        !cache.empresa ||
        !cache.funciones ||
        !cache.planes;

      if (open && nombre) {
        if (shouldReload) {
          try {
            const data = await getEmpresaDataByUser(nombre);
            if (!ignore) {
              cache.empresa = data;
              cache.lastNombre = nombre;
              setEmpresaData(data);
              setForm(prev => ({
                ...prev,
                ruc: data?.ruc || "",
                razon_social: data?.razonSocial || data?.empresa || "",
                direccion: data?.direccion || "",
              }));
            }
          } catch {
            if (!ignore) setEmpresaData(null);
          }
          try {
            const [funciones, planes] = await Promise.all([
              getFunciones(),
              getPlanes()
            ]);
            cache.funciones = funciones || [];
            cache.planes = planes || [];
            setAllFunciones(funciones || []);
            const plan = planes?.find(p => String(p.id_plan) === String(plan_pago));
            const funcionesIds = plan?.funciones
              ? plan.funciones.split(",").map(id => Number(id))
              : [];
            setFuncionesPlan(funcionesIds);
            cache.lastPlanPago = plan_pago;
          } catch {
            setAllFunciones([]);
            setFuncionesPlan([]);
          }
          reloadRef.current = false;
        } else {
          setEmpresaData(cache.empresa);
          setAllFunciones(cache.funciones);
          const plan = cache.planes?.find(p => String(p.id_plan) === String(plan_pago));
          const funcionesIds = plan?.funciones
            ? plan.funciones.split(",").map(id => Number(id))
            : [];
          setFuncionesPlan(funcionesIds);
        }
        // Obtener fecha de pago real del usuario admin
      try {
        // Si user.original.fecha_pago es array, busca el campo en el primer elemento
        let fecha = null;
        if (Array.isArray(user?.original)) {
          fecha = user.original[0]?.fecha_pago || null;
        } else if (user?.original?.fecha_pago) {
          fecha = user.original.fecha_pago;
        } else if (user?.fecha_pago) {
          fecha = user.fecha_pago;
        }
        // Si no hay fecha, consulta a la API
        if (!fecha && user?.id) {
          const usuario = await getUsuario(user.id);
          // usuario puede ser array o objeto
          if (Array.isArray(usuario)) {
            fecha = usuario[0]?.fecha_pago || null;
          } else if (usuario?.fecha_pago) {
            fecha = usuario.fecha_pago;
          }
        }
        if (!ignore) setFechaPago(fecha);
      } catch {
        if (!ignore) setFechaPago(null);
      }
      }
    }
    fetchEmpresaAndFunciones();
    return () => { ignore = true; };
  }, [open, nombre, plan_pago, user?.id]);

  // Validar si la función está habilitada en el plan
  const isEnabled = (featureKey) => {
    return funcionesPlan.includes(featureKey);
  };

  // Maneja cambios en los inputs normales
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Validar campos requeridos
  const camposRequeridosCompletos = () => {
    return (
      form.plan &&
      form.environment &&
      form.ruc &&
      form.razon_social &&
      form.direccion &&
      form.certificadoBase64 &&
      form.logoBase64 &&
      form.cert_password
    );
  };

  // Guardar empresa y token en la tabla clave
const handleSave = async () => {
  setLoading(true);
  const asStr = (v) => (v != null && String(v).trim() !== "" ? String(v) : "string");

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
      client_secret: asStr(form.client_secret),
    };

    // Intento de creación
    let response = await fetch("https://facturacion.apisperu.com/api/v1/companies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });
    let data = await response.json();

    // Si ya existe (409), intentar actualizar
    if (response.status === 409) {
      console.warn("Apisperu /companies 409 (Conflict). Reintentando con PUT...", data);
      response = await fetch("https://facturacion.apisperu.com/api/v1/companies", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(payload),
      });
      data = await response.json();
    }

    if (!response.ok) {
      console.error("Apisperu /companies error:", response.status, data);
      toast.error(`Error apisperu (${response.status}): ${data?.message || response.statusText}`);
      setLoading(false);
      return;
    }

    if (data?.token?.code) {
      await addClave({
        id_empresa: empresaData?.id_empresa,
        tipo: "Sunat",
        valor: data.token.code,
        estado_clave: 1,
      });
      toast.success("Datos enviados y token guardado correctamente.");
      setIsEditing(false);
      reloadRef.current = true;
    } else {
      toast.error("No se recibió token en la respuesta de /companies.");
    }
  } catch (e) {
    console.error("Error enviando a apisperu:", e);
    toast.error("Error al enviar datos a apisperu o guardar token.");
  } finally {
    setLoading(false);
  }
};

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
    (String(plan_pago) === "1" ? "S/ 120" : String(plan_pago) === "2" ? "S/ 60" : "S/ 30");
  const estado = empresaData?.estado || "Activo";
  const puedeEditar = user?.roleId === 1 || user?.roleId === "admin";

  return (
    <>
      <Toaster position="top-center" />
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
              {!isEditing ? (
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
                    {allFunciones.map((f) => {
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
                  <div className="mt-4 text-xs text-gray-500 dark:text-zinc-400">
                    <p className="leading-snug">
                      Información básica de la cuenta. Para más detalles, cambios de plan o editar datos de empresa, pulsa "Gestionar datos" o el icono de edición.
                    </p>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan *</label>
                    <select name="plan" value={form.plan} onChange={handleInputChange} required className="w-full rounded-lg border px-3 py-2">
                      <option value="">Seleccione</option>
                      <option value="free">Free</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Entorno *</label>
                    <select name="environment" value={form.environment} onChange={handleInputChange} required className="w-full rounded-lg border px-3 py-2">
                      <option value="">Seleccione</option>
                      <option value="beta">Beta Sunat</option>
                      <option value="produccion">Producción Sunat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Usuario SOL</label>
                    <Input name="sol_user" value={form.sol_user} onChange={handleInputChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña SOL</label>
                    <Input name="sol_pass" value={form.sol_pass} onChange={handleInputChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">RUC *</label>
                    <Input name="ruc" value={form.ruc} onChange={handleInputChange} required className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Razón Social *</label>
                    <Input name="razon_social" value={form.razon_social} onChange={handleInputChange} required className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección *</label>
                    <Input name="direccion" value={form.direccion} onChange={handleInputChange} required className="w-full" />
                  </div>
                  {/* Contraseña del certificado */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Contraseña del Certificado *</label>
                    <Input name="cert_password" value={form.cert_password} onChange={handleInputChange} required className="w-full" placeholder="Contraseña del archivo .pfx/.p12" />
                  </div>
                  {/* Certificado SUNAT */}
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileKey className="text-blue-500" />
                      </EmptyMedia>
                      <EmptyTitle>Certificado SUNAT <span className="text-red-500">*</span></EmptyTitle>
                      <EmptyDescription>
                        Selecciona tu certificado en formato PFX/P12 (Base64)
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <input
                        id="certificado"
                        name="certificado"
                        type="file"
                        accept=".pfx,.p12"
                        onChange={handleCertificadoChange}
                        className="w-full mt-2 cursor-pointer"
                        required
                      />
                    </EmptyContent>
                  </Empty>
                  {/* Logo SUNAT */}
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ImageIcon className="text-blue-500" />
                      </EmptyMedia>
                      <EmptyTitle>Logo SUNAT <span className="text-red-500">*</span></EmptyTitle>
                      <EmptyDescription>
                        Selecciona tu logo en formato PNG (Base64)
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/png"
                        onChange={handleLogoChange}
                        className="w-full mt-2 cursor-pointer"
                        required
                      />
                    </EmptyContent>
                  </Empty>
                  <div>
                    <label className="block text-sm font-medium mb-1">Client ID</label>
                    <Input name="client_id" value={form.client_id} onChange={handleInputChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Client Secret</label>
                    <Input name="client_secret" value={form.client_secret} onChange={handleInputChange} className="w-full" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="flat" onPress={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" color="primary" type="submit" isLoading={loading}>
                      Guardar
                    </Button>
                  </div>
                </form>
              )}
            </DrawerBody>

            <DrawerFooter className="px-6 py-4 bg-transparent border-t border-blue-100/30 dark:border-zinc-700/30 rounded-b-2xl flex justify-end gap-2">
              <Button size="sm" variant="flat" onPress={() => { internalClose?.(); onClose?.(); }}>
                Cerrar
              </Button>
              {!isEditing && (
                <Button
                  size="sm"
                  color="primary"
                  onPress={() => setIsEditing(true)}
                >
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