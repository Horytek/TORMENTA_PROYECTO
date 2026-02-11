import React, { useState } from 'react';
import WalletBrick from './WalletBrick';
import { createEmpresaAndAdmin } from '@/services/empresa.services';
import { sendCredencialesEmail } from '@/services/resend.services';
import { toast } from "react-hot-toast";
import { Building2, User, Mail, Phone, MapPin, CheckCircle2, Sparkles } from "lucide-react";

function getPlanPagoInt(planName) {
  let name = (planName || "").toLowerCase();
  name = name.replace(/plan|resumen del plan|resumen|del|de|el|la/gi, "").trim();
  if (name.includes("basic") || name.includes("básico") || name.includes("emprendedor") || name.includes("diario") || name.includes("semanal") || name.includes("express")) return 3;
  if (name.includes("pro") || name.includes("empresarial") || name.includes("empresario") || name.includes("standart")) return 2;
  if (name.includes("enterprise") || name.includes("corporativo")) return 1;
  return 3;
}

export const RegistroForm = ({ planInfo }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    ruc: '',
    razonSocial: '',
    direccion: '',
    telefonoEmpresa: '',
    emailEmpresa: '',
    pais: 'Perú',
    aceptaTerminos: false
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [adminCreds, setAdminCreds] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const formErrors = {};
    let isValid = true;

    if (!formData.nombre.trim()) { formErrors.nombre = 'Requerido'; isValid = false; }
    if (!formData.apellido.trim()) { formErrors.apellido = 'Requerido'; isValid = false; }
    if (!formData.ruc.trim() || !/^\d{11}$/.test(formData.ruc)) { formErrors.ruc = 'RUC inválido (11 dígitos)'; isValid = false; }
    if (!formData.razonSocial.trim()) { formErrors.razonSocial = 'Requerido'; isValid = false; }
    if (!formData.direccion.trim()) { formErrors.direccion = 'Requerido'; isValid = false; }
    if (!formData.emailEmpresa.trim()) { formErrors.emailEmpresa = 'Requerido'; isValid = false; }
    if (!formData.telefonoEmpresa.trim()) { formErrors.telefonoEmpresa = 'Requerido'; isValid = false; }
    if (!formData.aceptaTerminos) { formErrors.aceptaTerminos = 'Debes aceptar los términos'; isValid = false; }

    setErrors(formErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setCreating(true);
    const plan_pago = getPlanPagoInt(planInfo.plan);

    const empresaPayload = {
      ruc: formData.ruc,
      razonSocial: formData.razonSocial,
      nombreComercial: null,
      direccion: formData.direccion,
      distrito: null,
      provincia: null,
      departamento: null,
      codigoPostal: null,
      telefono: formData.telefonoEmpresa,
      email: formData.emailEmpresa,
      logotipo: null,
      moneda: null,
      pais: formData.pais,
      plan_pago
    };

    const result = await createEmpresaAndAdmin(empresaPayload);
    setCreating(false);

    if (!result?.success) {
      toast.error(result?.message || "No se pudo completar el registro");
      return;
    }

    // Modificado: Solo enviar credenciales si es plan gratuito o precio 0.
    // Si hay pago de por medio, el webhook se encargará de enviar el correo de bienvenida.
    const isPaidPlan = planInfo?.priceValue && parseFloat(planInfo.priceValue) > 0;

    if (result.admin && formData.emailEmpresa && !isPaidPlan) {
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-3 bg-gradient-to-b from-gray-900/80 to-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6 md:p-8">
          {!formSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Datos del Administrador */}
              <div className="pb-4 border-b border-gray-700/30">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-emerald-400" />
                  Datos del administrador
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput name="nombre" label="Nombre" placeholder="Tu nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} />
                  <FormInput name="apellido" label="Apellido" placeholder="Tu apellido" value={formData.apellido} onChange={handleChange} error={errors.apellido} />
                </div>
              </div>

              {/* Datos de la Empresa */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  Datos de la empresa
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput icon={Building2} name="ruc" label="RUC" placeholder="20XXXXXXXXX" value={formData.ruc} onChange={handleChange} error={errors.ruc} />
                  <FormInput name="razonSocial" label="Razón Social" placeholder="Empresa S.A.C." value={formData.razonSocial} onChange={handleChange} error={errors.razonSocial} />
                </div>

                <FormInput icon={MapPin} name="direccion" label="Dirección" placeholder="Av. Principal 123, Lima" value={formData.direccion} onChange={handleChange} error={errors.direccion} />

                <div className="grid grid-cols-2 gap-4">
                  <FormInput icon={Mail} name="emailEmpresa" label="Email" type="email" placeholder="contacto@empresa.com" value={formData.emailEmpresa} onChange={handleChange} error={errors.emailEmpresa} />
                  <FormInput icon={Phone} name="telefonoEmpresa" label="Teléfono" placeholder="+51 999 999 999" value={formData.telefonoEmpresa} onChange={handleChange} error={errors.telefonoEmpresa} />
                </div>

                <input type="hidden" name="pais" value={formData.pais} />
              </div>

              {/* Términos */}
              <div className="pt-4 border-t border-gray-700/30">
                <label htmlFor="aceptaTerminos" className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      id="aceptaTerminos"
                      name="aceptaTerminos"
                      type="checkbox"
                      checked={formData.aceptaTerminos}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 ${formData.aceptaTerminos ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'} 
                      flex items-center justify-center transition-all group-hover:border-emerald-400`}>
                      {formData.aceptaTerminos && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 leading-snug">
                    Acepto los <a href="/landing/terminos" className="text-emerald-400 hover:underline">términos y condiciones</a> y
                    la <a href="/landing/privacidad" className="text-emerald-400 hover:underline">política de privacidad</a>
                  </span>
                </label>
                {errors.aceptaTerminos && <p className="mt-1 text-xs text-red-400">{errors.aceptaTerminos}</p>}
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 
                  text-white font-semibold text-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 
                  disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Crear cuenta y continuar
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Estado de éxito */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¡Cuenta creada!</h3>
              <p className="text-gray-400 mb-6">Revisa tu correo para obtener tus credenciales de acceso</p>

              {adminCreds && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-emerald-300 mb-2">Credenciales enviadas a: <strong>{formData.emailEmpresa}</strong></p>
                  <p className="text-xs text-gray-400">
                    Después del pago, ingresa a <a href="/login" className="text-emerald-400 underline">/login</a> para acceder.
                  </p>
                </div>
              )}

              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-4">Completa el pago para activar tu cuenta:</p>
                <WalletBrick planInfo={planInfo} userData={{
                  nombre: formData.nombre,
                  apellido: formData.apellido,
                  email: formData.emailEmpresa,
                  telefono: formData.telefonoEmpresa
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Resumen del Plan */}
        <aside className="lg:col-span-2">
          <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-6 sticky top-24">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-3">
                <Sparkles className="w-4 h-4" />
                Plan seleccionado
              </div>
              <h3 className="text-2xl font-bold text-white">{planInfo.plan}</h3>
              <p className="text-3xl font-bold text-emerald-400 mt-2">
                {planInfo.price}
                <span className="text-sm text-gray-400 font-normal">/{planInfo.period}</span>
              </p>
            </div>

            <ul className="space-y-3 text-sm">
              {(planInfo.features || ['Soporte técnico incluido', 'Módulos esenciales', 'Reportes y KPIs', 'Actualizaciones gratis']).map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-4 border-t border-gray-700/30">
              <p className="text-xs text-gray-500 text-center">
                Tu cuenta se activará automáticamente después del pago.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

// Componente de input estilizado (Movido Afuera)
const FormInput = ({ icon: Icon, label, name, type = "text", placeholder, required = true, value, onChange, error }) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="text-sm font-medium text-gray-300 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-500" />}
      {label} {required && <span className="text-emerald-400">*</span>}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${error ? 'border-red-500' : 'border-gray-700/50'} 
        text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all`}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);