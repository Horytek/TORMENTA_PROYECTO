import React, { useState, useRef, useEffect } from 'react';
import WalletBrick from './WalletBrick';
import { createEmpresaAndAdmin } from '@/services/empresa.services';
import { Button, Tooltip, Card, Input } from "@heroui/react";
import { HelpCircle } from "lucide-react";
import { FileKey, Image as ImageIcon } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { sendResendEmail, sendCredencialesEmail } from '@/services/resend.services';


// Popover minimalista estilo HeroUI/Shadcn para ayuda de logotipo
function LogotipoPopoverInfo() {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block">
      <Tooltip content="Guía para obtener la URL del logotipo" placement="bottom">
        <Button
          isIconOnly
          variant="flat"
          color="primary"
          className="rounded-xl shadow-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ayuda logotipo"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </Tooltip>
      {open && (
        <Card
          ref={popoverRef}
          className="absolute left-0 mt-2 z-50 min-w-[260px] max-w-[340px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3"
        >
          <div className="font-semibold text-base mb-2 text-secondary-color">Guía rápida</div>
          <ul className="list-none space-y-2 text-sm mb-2">
            <li>Convierte tu logotipo a <b>JPG</b>.</li>
            <li>Sube la imagen a <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-secondary-color underline">imgbb.com</a>.</li>
            <li>Marca <b>"No eliminar automáticamente"</b> antes de subir.</li>
            <li>Elige <b>BBCode completo enlazado</b> en "Códigos de inserción".</li>
            <li>Copia la URL que inicia con <span className="font-mono text-blue-600">https://i.ibb.co/...</span> y termina en <span className="font-mono text-blue-600">.jpg</span>.</li>
          </ul>
          <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-2 text-xs font-mono text-blue-600 mb-2 border border-blue-100 dark:border-blue-900">
            Ejemplo:<br />
            [url=https://ibb.co/V0m4rSk2][img]https://i.ibb.co/qL5QXs2k/wallhaven-z81jry-1920x1080.jpg[/img][/url]
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Solo usa la URL directa de la imagen (la segunda <span className="font-mono">https://i.ibb.co/...</span>).
          </div>
        </Card>
      )}
    </div>
  );
}

function getPlanPagoInt(planName) {
  // Limpia el nombre del plan antes de verificar
  let name = (planName || "").toLowerCase();
  name = name.replace(/plan|resumen del plan|resumen|del|de|el|la/gi, "").trim();

  if (name.includes("basic") || name.includes("básico")) return 3;
  if (name.includes("pro") || name.includes("empresarial") || name.includes("standart")) return 2;
  if (name.includes("enterprise") || name.includes("corporativo")) return 1;
  return 3; // Por defecto Básico
}

export const RegistroForm = ({ planInfo }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    aceptaTerminos: false,
    ruc: '',
    razonSocial: '',
    nombreComercial: '',
    direccion: '',
    distrito: '',
    provincia: '',
    departamento: '',
    codigoPostal: '',
    telefonoEmpresa: '',
    emailEmpresa: '',
    logotipo: '',
    pais: '',
    certificadoSunat: null,
    logoSunat: null,
    sunat_client_id: '',
    sunat_client_secret: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [adminCreds, setAdminCreds] = useState(null);

  // Placeholder para componentes futuros
  const Placeholder = ({ label }) => (
    <div className="rounded-xl py-2 px-4 bg-white/5 border border-gray-700/10 text-gray-400 text-xs text-center my-1 font-medium opacity-80 pointer-events-none select-none">
      {label}
    </div>
  );

    // Manejar archivos para certificado y logo SUNAT
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };
  

const extractImgbbUrl = (input) => {
  // Busca el segundo https://i.ibb.co/... en el texto
  const matches = input.match(/https:\/\/i\.ibb\.co\/[^\s\[\]]+\.(jpg|png)/gi);
  return matches && matches.length > 1 ? matches[1] : matches?.[0] || '';
};

const handleLogotipoPaste = (e) => {
  const pasted = e.clipboardData.getData('text');
  const url = extractImgbbUrl(pasted);
  if (url) {
    setFormData(prev => ({ ...prev, logotipo: url }));
    if (errors.logotipo) setErrors(prev => ({ ...prev, logotipo: '' }));
    e.preventDefault();
  }
};

const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  // Si el campo es logotipo, castea automáticamente al segundo https
  if (name === "logotipo") {
    const url = extractImgbbUrl(value);
    setFormData(prev => ({
      ...prev,
      [name]: url
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }
};

  const validateForm = () => {
    const formErrors = {};
    let isValid = true;

    if (!formData.nombre.trim()) { formErrors.nombre = 'El nombre es obligatorio'; isValid = false; }
    if (!formData.apellido.trim()) { formErrors.apellido = 'El apellido es obligatorio'; isValid = false; }
    if (!formData.aceptaTerminos) { formErrors.aceptaTerminos = 'Debes aceptar los términos'; isValid = false; }
    if (!formData.ruc.trim()) { formErrors.ruc = 'RUC es obligatorio'; isValid = false; }
    if (!formData.razonSocial.trim()) { formErrors.razonSocial = 'Razón Social es obligatoria'; isValid = false; }
    if (!formData.direccion.trim()) { formErrors.direccion = 'Dirección es obligatoria'; isValid = false; }
    if (!formData.pais.trim()) { formErrors.pais = 'País es obligatorio'; isValid = false; }
    if (formData.logotipo && !/^https:\/\/i\.ibb\.co\/.+\.jpg$/i.test(formData.logotipo)) {
      formErrors.logotipo = 'El logotipo debe ser una URL válida de imgbb (https://i.ibb.co/xxx.jpg)';
      isValid = false;
    }
    if (!formData.certificadoSunat) { formErrors.certificadoSunat = 'El certificado es obligatorio'; isValid = false; }
    if (!formData.logoSunat) { formErrors.logoSunat = 'El logo SUNAT es obligatorio'; isValid = false; }
    if (!formData.sunat_client_id.trim()) { formErrors.sunat_client_id = 'El client_id SUNAT es obligatorio'; isValid = false; }
    if (!formData.sunat_client_secret.trim()) { formErrors.sunat_client_secret = 'El client_secret SUNAT es obligatorio'; isValid = false; }

    setErrors(formErrors);
    return isValid;
  };

  function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => {
      // Solo el string base64, sin el prefijo data:...
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setCreating(true);

  // Enviar archivos a /send-resend (certificado y logo)
  const formDataToSend = new FormData();
  formDataToSend.append('certificado', formData.certificadoSunat);
  formDataToSend.append('logo', formData.logoSunat);
  formDataToSend.append('sunat_client_id', formData.sunat_client_id);
  formDataToSend.append('sunat_client_secret', formData.sunat_client_secret);

  await sendResendEmail(formDataToSend);

  // Determinar el plan_pago int según el plan seleccionado
  const plan_pago = getPlanPagoInt(planInfo.plan);

  const empresaPayload = {
    ruc: formData.ruc,
    razonSocial: formData.razonSocial,
    nombreComercial: formData.nombreComercial || null,
    direccion: formData.direccion,
    distrito: formData.distrito || null,
    provincia: formData.provincia || null,
    departamento: formData.departamento || null,
    codigoPostal: formData.codigoPostal || null,
    telefono: formData.telefonoEmpresa || null,
    email: formData.emailEmpresa || null,
    logotipo: formData.logotipo || null,
    moneda: null,
    pais: formData.pais,
    plan_pago
  };

  setCreating(true);
  const result = await createEmpresaAndAdmin(empresaPayload);
  setCreating(false);

  if (!result?.success) {
    alert(result?.message || "No se pudo completar el registro");
    return;
  }

  // Enviar credenciales al correo de la empresa
  if (result.admin && formData.emailEmpresa) {
    await sendCredencialesEmail({
      to: formData.emailEmpresa,
      usuario: result.admin.usua,
      contrasena: result.admin.contra
    });
  }

  setAdminCreds(result.admin);
  setFormSubmitted(true);
};

  return (
    <div className="rounded-2xl p-6 md:p-8 w-full">
      <div className="max-w-[1200px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 bg-card-bg border border-gray-700/20 rounded-3xl p-10 md:p-12 shadow-xl min-h-[520px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-semibold text-primary-text">Registro</h3>
                <p className="text-sm text-gray-400">Completa los datos para activar tu suscripción</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Plan</div>
                <div className="text-lg font-semibold text-primary-text">{planInfo.plan}</div>
                <div className="text-sm text-gray-400">{planInfo.price} / {planInfo.period}</div>
              </div>
            </div>

            {!formSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label htmlFor="nombre" className="block text-base md:text-lg font-medium text-primary-text mb-1">Nombre</label>
                    <input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange}
                      placeholder="Tu nombre"
                      className={`w-full px-6 py-4 rounded-2xl bg-transparent border ${errors.nombre ? 'border-red-500' : 'border-gray-700'} text-primary-text placeholder-gray-500`} />
                    {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
                  </div>
                  <div>
                    <label htmlFor="apellido" className="block text-base md:text-lg font-medium text-primary-text mb-1">Apellido</label>
                    <input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange}
                      placeholder="Tu apellido"
                      className={`w-full px-6 py-4 rounded-2xl bg-transparent border ${errors.apellido ? 'border-red-500' : 'border-gray-700'} text-primary-text placeholder-gray-500`} />
                    {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido}</p>}
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-lg font-semibold text-primary-text mb-2">Datos de la empresa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ruc" className="block text-sm font-medium text-primary-text mb-1">RUC</label>
                      <input id="ruc" name="ruc" value={formData.ruc} onChange={handleChange}
                        placeholder="11 dígitos"
                        className={`w-full px-4 py-3 rounded-xl bg-transparent border ${errors.ruc ? 'border-red-500' : 'border-gray-700'} text-primary-text`} />
                      {errors.ruc && <p className="mt-1 text-xs text-red-500">{errors.ruc}</p>}
                    </div>
                    <div>
                      <label htmlFor="razonSocial" className="block text-sm font-medium text-primary-text mb-1">Razón Social</label>
                      <input id="razonSocial" name="razonSocial" value={formData.razonSocial} onChange={handleChange}
                        placeholder="Empresa S.A.C."
                        className={`w-full px-4 py-3 rounded-xl bg-transparent border ${errors.razonSocial ? 'border-red-500' : 'border-gray-700'} text-primary-text`} />
                      {errors.razonSocial && <p className="mt-1 text-xs text-red-500">{errors.razonSocial}</p>}
                    </div>
                    <div>
                      <label htmlFor="nombreComercial" className="block text-sm font-medium text-primary-text mb-1">Nombre Comercial</label>
                      <input id="nombreComercial" name="nombreComercial" value={formData.nombreComercial} onChange={handleChange}
                        placeholder="Marca o nombre comercial"
                        className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text" />
                    </div>
                    <div>
                      <label htmlFor="direccion" className="block text-sm font-medium text-primary-text mb-1">Dirección</label>
                      <input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange}
                        placeholder="Calle, número, distrito"
                        className={`w-full px-4 py-3 rounded-xl bg-transparent border ${errors.direccion ? 'border-red-500' : 'border-gray-700'} text-primary-text`} />
                      {errors.direccion && <p className="mt-1 text-xs text-red-500">{errors.direccion}</p>}
                    </div>
                    <div>
                      <label htmlFor="distrito" className="block text-sm font-medium text-primary-text mb-1">Distrito</label>
                      <input id="distrito" name="distrito" value={formData.distrito} onChange={handleChange}
                        placeholder="Ejemplo: Miraflores"
                        className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text" />
                    </div>
                    <div>
                      <label htmlFor="provincia" className="block text-sm font-medium text-primary-text mb-1">Provincia</label>
                      <input id="provincia" name="provincia" value={formData.provincia} onChange={handleChange}
                        placeholder="Ejemplo: Lima"
                        className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text" />
                    </div>
                    <div>
                      <label htmlFor="departamento" className="block text-sm font-medium text-primary-text mb-1">Departamento</label>
                      <input id="departamento" name="departamento" value={formData.departamento} onChange={handleChange}
                        placeholder="Ejemplo: Lima"
                        className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text" />
                    </div>
                    <div>
                      <label htmlFor="codigoPostal" className="block text-sm font-medium text-primary-text mb-1">Código Postal</label>
                      <input id="codigoPostal" name="codigoPostal" value={formData.codigoPostal} onChange={handleChange}
                        placeholder="Ejemplo: 15047"
                        className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text" />
                    </div>
                    <div>
                      <label htmlFor="telefonoEmpresa" className="block text-sm font-medium text-primary-text mb-1">Teléfono Empresa</label>
                      <input id="telefonoEmpresa" name="telefonoEmpresa" value={formData.telefonoEmpresa} onChange={handleChange}
                        placeholder="Ejemplo: +51 961 797 720"
                        className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text" />
                    </div>
                    <div>
                      <label htmlFor="emailEmpresa" className="block text-sm font-medium text-primary-text mb-1">Email Empresa</label>
                      <input id="emailEmpresa" name="emailEmpresa" type="email" value={formData.emailEmpresa} onChange={handleChange}
                        placeholder="empresa@email.com"
                        className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="logotipo" className="block text-sm font-medium text-primary-text">
                          Logotipo
                        </label>
                        <LogotipoPopoverInfo />
                      </div>
                      <input
                        id="logotipo"
                        name="logotipo"
                        value={formData.logotipo}
                        onChange={handleChange}
                        onPaste={handleLogotipoPaste}
                        placeholder="Pega aquí la URL https://i.ibb.co/xxx.jpg"
                        className={`w-full px-4 py-3 rounded-xl bg-transparent border ${errors.logotipo ? 'border-red-500' : 'border-gray-700'} text-primary-text`}
                      />
                      {errors.logotipo && <p className="mt-1 text-xs text-red-500">{errors.logotipo}</p>}
                    </div>
                    <div>
                      <label htmlFor="pais" className="block text-sm font-medium text-primary-text mb-1">País</label>
                      <input id="pais" name="pais" value={formData.pais} onChange={handleChange}
                        placeholder="Perú"
                        className={`w-full px-4 py-3 rounded-xl bg-transparent border ${errors.pais ? 'border-red-500' : 'border-gray-700'} text-primary-text`} />
                      {errors.pais && <p className="mt-1 text-xs text-red-500">{errors.pais}</p>}
                    </div>                
                      {/* Certificado SUNAT */}
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <FileKey className="text-blue-500" />
                          </EmptyMedia>
                          <EmptyTitle>Certificado SUNAT <span className="text-red-500">*</span></EmptyTitle>
                          <EmptyDescription>
                            Haga click aquí o arrastre y suelte su certificado en formato P12 o PFX
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <input
                            id="certificadoSunat"
                            name="certificadoSunat"
                            type="file"
                            accept=".pfx,.p12"
                            onChange={handleFileChange}
                            className="w-full mt-2 cursor-pointer"
                          />
                          {errors.certificadoSunat && (
                            <p className="mt-1 text-xs text-red-500">{errors.certificadoSunat}</p>
                          )}
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
                            Haga click aquí o arrastre y suelte su logo en .png - máximo 100KB
                          </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <input
                            id="logoSunat"
                            name="logoSunat"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full mt-2 cursor-pointer"
                          />
                          {errors.logoSunat && (
                            <p className="mt-1 text-xs text-red-500">{errors.logoSunat}</p>
                          )}
                        </EmptyContent>
                      </Empty>

                    {/* Credenciales SUNAT */}
                      <div className="col-span-1">
                        <label htmlFor="sunat_client_id" className="block text-sm font-medium text-primary-text mb-1">
                          Credenciales de API SUNAT (client_id)
                        </label>
                        <input
                          id="sunat_client_id"
                          name="sunat_client_id"
                          value={formData.sunat_client_id}
                          onChange={handleChange}
                          placeholder="Credenciales client_id"
                          className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text"
                        />
                        {errors.sunat_client_id && <p className="mt-1 text-xs text-red-500">{errors.sunat_client_id}</p>}
                      </div>
                      <div className="col-span-1">
                        <label htmlFor="sunat_client_secret" className="block text-sm font-medium text-primary-text mb-1">
                          Credenciales de API SUNAT (client_secret)
                        </label>
                        <input
                          id="sunat_client_secret"
                          name="sunat_client_secret"
                          value={formData.sunat_client_secret}
                          onChange={handleChange}
                          placeholder="Credenciales client_secret"
                          className="w-full px-4 py-3 rounded-xl bg-transparent border border-gray-700 text-primary-text"
                        />
                        {errors.sunat_client_secret && <p className="mt-1 text-xs text-red-500">{errors.sunat_client_secret}</p>}
                      </div>
                  </div>
                </div>

                {/* Placeholder para componentes futuros */}
                <Placeholder label="Selector de moneda" />
                <Placeholder label="Adjuntar documentos legales" />
                <Placeholder label="Configuración avanzada de empresa" />

                <div>
                  <label htmlFor="aceptaTerminos" className="flex items-center gap-3 cursor-pointer select-none">
                    <input id="aceptaTerminos" name="aceptaTerminos" type="checkbox" checked={formData.aceptaTerminos} onChange={handleChange} className="sr-only peer" />
                    <span className="w-5 h-5 rounded-lg border border-gray-600 flex items-center justify-center bg-transparent transition-colors duration-150 peer-checked:bg-secondary-color peer-checked:border-transparent">
                      <svg className="hidden w-3 h-3 text-white peer-checked:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M4 12l4 4L20 6" /></svg>
                    </span>
                    <span className="text-base text-gray-300">Acepto los <span className="text-secondary-color underline cursor-pointer">términos y condiciones</span></span>
                  </label>
                </div>
                {errors.aceptaTerminos && <p className="mt-1 text-xs text-red-500">{errors.aceptaTerminos}</p>}

                <div className="pt-3">
                  <button type="submit" disabled={creating}
                    className="w-full inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-secondary-color to-primary-color text-white font-semibold shadow-xl hover:scale-[1.02] transition-transform">
                    {creating ? "Creando empresa y usuario..." : "Continuar con el pago"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-primary-text mb-4 text-center">Resumen y pago</h4>
                  {adminCreds && (
                    <div className="p-4 mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                      <div className="font-semibold mb-1">¡Revisa tu correo!</div>
                      <div className="text-sm">
                        Hemos enviado las credenciales de acceso a tu correo electrónico. Por favor, revisa tu bandeja de entrada en Gmail, Outlook u otro proveedor.
                      </div>
                      <div className="text-xs opacity-80 mt-2">
                        <b>Paso 1:</b> <span className="text-white">Primero debes realizar el pago en Mercado Pago usando el botón de abajo.</span><br />
                        <b>Paso 2:</b> <span className="text-white">
                          Luego, ingresa a la ruta{" "}
                          <a
                            href="/login"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-secondary-color hover:text-primary-color transition-colors"
                          >
                            /login
                          </a>{" "}
                          para activar tu cuenta y acceder al sistema.
                        </span>
                        <br />
                        <span className="block mt-2">
                          <b>Importante:</b> Si no ves el correo en unos minutos, revisa también la carpeta de spam o correo no deseado.<br />
                          Espera unos minutos mientras activamos el modo producción para la facturación electrónica en SUNAT.
                        </span>
                      </div>
                    </div>
                  )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-card-bg border border-gray-700/20 shadow-sm">
                    <div className="text-sm text-gray-400 mb-3">Contacto</div>
                    <dl className="space-y-3">
                      <div><dt className="text-xs text-gray-400">Nombre</dt><dd className="text-primary-text font-medium">{formData.nombre} {formData.apellido}</dd></div>
                      <div><dt className="text-xs text-gray-400">Email</dt><dd className="text-primary-text">{formData.email}</dd></div>
                      <div><dt className="text-xs text-gray-400">Teléfono</dt><dd className="text-primary-text">{formData.telefono}</dd></div>
                    </dl>
                  </div>
                  <div className="p-6 rounded-2xl bg-card-bg border border-gray-700/20 shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="text-sm text-gray-400">Plan seleccionado</div>
                      <div className="mt-2 text-2xl font-bold text-primary-text">{planInfo.plan}</div>
                      <div className="text-xl text-primary-text mt-1">{planInfo.price} <span className="text-sm text-gray-400">/ {planInfo.period}</span></div>
                      <ul className="mt-4 space-y-2 text-sm text-gray-300">
                        <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Soporte técnico</li>
                        <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Módulos esenciales</li>
                        <li className="flex items-center gap-3"><span className="w-5 h-5 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Reportes y KPIs</li>
                      </ul>
                    </div>
                    <div className="mt-6">
                      <div className="w-full">
                        <WalletBrick planInfo={planInfo} userData={{
                          nombre: formData.nombre,
                          apellido: formData.apellido,
                          email: formData.emailEmpresa,
                          telefono: formData.telefonoEmpresa
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <aside className="lg:col-span-1">
            <div className="bg-card-bg border border-gray-700/20 rounded-3xl p-8 md:p-10 shadow-lg sticky top-8 min-h-[360px]">
              <div className="mb-4">
                <div className="text-sm text-gray-400">Resumen del plan</div>
                <div className="text-2xl font-bold text-primary-text">{planInfo.plan}</div>
                <div className="text-gray-400">{planInfo.price} / {planInfo.period}</div>
              </div>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Soporte técnico</li>
                <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Módulos esenciales</li>
                <li className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-secondary-color/20 flex items-center justify-center text-secondary-color">✓</span> Reportes y KPIs</li>
              </ul>
              <div className="mt-6 text-xs text-gray-400">Una vez enviado el pago, revisaremos los datos y activaremos la cuenta en 24 horas.</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};