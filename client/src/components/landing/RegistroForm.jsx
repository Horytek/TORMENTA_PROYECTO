import React, { useState } from 'react';
import WalletBrick from './WalletBrick';
import { createEmpresaAndAdmin } from '@/services/empresa.services';
import { sendCredencialesEmail } from '@/services/resend.services';
import { toast } from "react-hot-toast";
import { Building2, User, Mail, Phone, MapPin, CheckCircle2, Sparkles } from "lucide-react";
import { Input, Checkbox, Button } from "@heroui/react";

// Helper para determinar el plan
function getPlanPagoInt(planName) {
  let name = (planName || "").toLowerCase();
  name = name.replace(/plan|resumen del plan|resumen|del|de|el|la/gi, "").trim();
  // Basic / Emprendedor / Diario / Semanal / Express -> 3
  if (name.includes("basic") || name.includes("básico") || name.includes("emprendedor") || name.includes("diario") || name.includes("semanal") || name.includes("express")) return 3;
  // Pro / Empresario -> 2
  if (name.includes("pro") || name.includes("empresarial") || name.includes("empresario") || name.includes("standart")) return 2;
  // Enterprise / Corporativo -> 1
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

  const inputClassNames = {
    inputWrapper: "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 focus-within:!border-emerald-500/60 h-12 px-4",
    label: "text-sm text-zinc-400 mb-1",
    input: "text-white !bg-transparent placeholder:text-zinc-600 text-sm"
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario Principal */}
        <div className="lg:col-span-8 bg-[#0f121a] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />

          {!formSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">

              {/* Datos del Administrador */}
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-400" />
                  </span>
                  Datos del Administrador
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Tu nombre"
                    value={formData.nombre}
                    onValueChange={(val) => handleChange('nombre', val)}
                    isInvalid={!!errors.nombre}
                    errorMessage={errors.nombre}
                    variant="bordered"
                    radius="lg"
                    classNames={inputClassNames}
                  />
                  <Input
                    label="Apellido"
                    labelPlacement="outside"
                    placeholder="Tu apellido"
                    value={formData.apellido}
                    onValueChange={(val) => handleChange('apellido', val)}
                    isInvalid={!!errors.apellido}
                    errorMessage={errors.apellido}
                    variant="bordered"
                    radius="lg"
                    classNames={inputClassNames}
                  />
                </div>
              </div>

              {/* Datos de la Empresa */}
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                  </span>
                  Datos de la Empresa
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      startContent={<Building2 className="text-zinc-500 w-4 h-4" />}
                      label="RUC"
                      labelPlacement="outside"
                      placeholder="20XXXXXXXXX"
                      value={formData.ruc}
                      onValueChange={(val) => handleChange('ruc', val)}
                      isInvalid={!!errors.ruc}
                      errorMessage={errors.ruc}
                      variant="bordered"
                      radius="lg"
                      classNames={inputClassNames}
                    />
                    <Input
                      label="Razón Social"
                      labelPlacement="outside"
                      placeholder="Empresa S.A.C."
                      value={formData.razonSocial}
                      onValueChange={(val) => handleChange('razonSocial', val)}
                      isInvalid={!!errors.razonSocial}
                      errorMessage={errors.razonSocial}
                      variant="bordered"
                      radius="lg"
                      classNames={inputClassNames}
                    />
                  </div>

                  <Input
                    startContent={<MapPin className="text-zinc-500 w-4 h-4" />}
                    label="Dirección Fiscal"
                    labelPlacement="outside"
                    placeholder="Av. Principal 123, Lima"
                    value={formData.direccion}
                    onValueChange={(val) => handleChange('direccion', val)}
                    isInvalid={!!errors.direccion}
                    errorMessage={errors.direccion}
                    variant="bordered"
                    radius="lg"
                    classNames={inputClassNames}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      startContent={<Mail className="text-zinc-500 w-4 h-4" />}
                      label="Email Corporativo"
                      labelPlacement="outside"
                      type="text"
                      placeholder="contacto@empresa.com"
                      value={formData.emailEmpresa}
                      onValueChange={(val) => handleChange('emailEmpresa', val)}
                      isInvalid={!!errors.emailEmpresa}
                      errorMessage={errors.emailEmpresa}
                      variant="bordered"
                      radius="lg"
                      classNames={inputClassNames}
                    />
                    <Input
                      startContent={<Phone className="text-zinc-500 w-4 h-4" />}
                      label="Teléfono / Celular"
                      labelPlacement="outside"
                      placeholder="+51 999 999 999"
                      value={formData.telefonoEmpresa}
                      onValueChange={(val) => handleChange('telefonoEmpresa', val)}
                      isInvalid={!!errors.telefonoEmpresa}
                      errorMessage={errors.telefonoEmpresa}
                      variant="bordered"
                      radius="lg"
                      classNames={inputClassNames}
                    />
                  </div>
                </div>

                <input type="hidden" name="pais" value={formData.pais} />
              </div>

              {/* Términos */}
              <div className="pt-6 border-t border-gray-800">
                <Checkbox
                  isSelected={formData.aceptaTerminos}
                  onValueChange={(val) => handleChange('aceptaTerminos', val)}
                  color="success"
                  classNames={{
                    label: "text-sm text-zinc-400"
                  }}
                >
                  He leído y acepto los <a href="/landing/terminos" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">términos y condiciones</a> y la <a href="/landing/privacidad" className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline">política de privacidad</a> de HoryCore.
                </Checkbox>
                {errors.aceptaTerminos && <p className="mt-2 text-sm text-red-400 font-medium ml-2">{errors.aceptaTerminos}</p>}
              </div>

              {/* Botón Submit */}
              <Button
                type="submit"
                isLoading={creating}
                color="success"
                size="lg"
                className="w-full font-bold text-white shadow-lg shadow-emerald-900/20"
                endContent={!creating && <Sparkles className="w-5 h-5" />}
              >
                {creating ? "Procesando registro..." : "Crear cuenta y continuar"}
              </Button>
            </form>
          ) : (
            /* Estado de éxito */
            <div className="text-center py-12 relative z-10 animate-fade-in-up">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/30">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">¡Bienvenido a bordo!</h3>
              <p className="text-gray-400 mb-8 text-lg">Tu cuenta ha sido creada exitosamente.</p>

              {adminCreds && (
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-6 mb-8 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Mail className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Credenciales enviadas a</p>
                      <p className="text-white font-medium">{formData.emailEmpresa}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center border-t border-emerald-500/10 pt-4 mt-2">
                    Si no encuentras el correo, por favor revisa tu carpeta de spam.
                  </p>
                </div>
              )}

              <div className="mt-8">
                <div className="flex items-center justify-center gap-2 mb-6 text-gray-500 text-sm uppercase tracking-wider font-bold">
                  <span className="w-8 h-px bg-gray-800"></span>
                  Siguiente Paso
                  <span className="w-8 h-px bg-gray-800"></span>
                </div>
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
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#0f121a] border border-gray-800 rounded-3xl p-8 sticky top-24 shadow-xl">
            <div className="text-center mb-8 pb-8 pt-4 border-b border-gray-800 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[#0f121a] text-xs font-bold text-gray-500 uppercase tracking-widest">
                Resumen
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{planInfo.plan}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-emerald-400 leading-none">{planInfo.price}</span>
                <span className="text-lg text-gray-500 font-medium leading-none">/{planInfo.period}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Incluye:</h4>
              <ul className="space-y-4">
                {(planInfo.features || ['Soporte técnico incluido', 'Módulos esenciales', 'Reportes y KPIs', 'Actualizaciones gratis']).map((feature, i) => (
                  <li key={i} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-300 leading-tight group-hover:text-gray-200 transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex gap-3">
                <div className="mt-1">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-white mb-1">Garantía de Satisfacción</h5>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Si no estás satisfecho con el servicio, contáctanos y te ayudaremos a resolverlo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};