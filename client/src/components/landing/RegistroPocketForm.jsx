import React, { useState } from 'react';
import WalletBrick from './WalletBrick';
import { createEmpresaAndAdmin } from '@/services/empresa.services';
import { sendCredencialesEmail } from '@/services/resend.services';
import { toast } from "react-hot-toast";
import { User, Mail, Phone, Store, CheckCircle2, Sparkles } from "lucide-react";

// Helper para determinar el plan
function getPlanPagoInt(planName) {
    let name = (planName || "").toLowerCase();
    name = name.replace(/plan|resumen del plan|resumen|del|de|el|la/gi, "").trim();
    if (name.includes("basic") || name.includes("básico") || name.includes("diario") || name.includes("semanal") || name.includes("express")) return 3;
    if (name.includes("pro") || name.includes("empresarial") || name.includes("standart")) return 2;
    if (name.includes("enterprise") || name.includes("corporativo")) return 1;
    return 3;
}

export const RegistroPocketForm = ({ planInfo }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        nombreNegocio: '',
        email: '',
        telefono: '',
        password: '',
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
        if (!formData.nombreNegocio.trim()) { formErrors.nombreNegocio = 'Requerido'; isValid = false; }
        if (!formData.email.trim()) { formErrors.email = 'Requerido'; isValid = false; }
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) { formErrors.email = 'Email inválido'; isValid = false; }
        if (!formData.telefono.trim()) { formErrors.telefono = 'Requerido'; isValid = false; }
        // Password eliminado visualmente según lógica anterior, pero si se requiere validación interna:
        // if (!formData.password...) 
        if (!formData.aceptaTerminos) { formErrors.aceptaTerminos = 'Debes aceptar los términos'; isValid = false; }

        setErrors(formErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setCreating(true);
        const plan_pago = getPlanPagoInt(planInfo.plan);
        const simulRuc = formData.telefono.replace(/\D/g, '').padEnd(11, '0').slice(0, 11);

        const empresaPayload = {
            ruc: simulRuc,
            razonSocial: formData.nombreNegocio,
            nombreComercial: formData.nombreNegocio,
            direccion: "Dirección Pendiente",
            telefono: formData.telefono,
            email: formData.email,
            pais: formData.pais,
            plan_pago
        };

        const result = await createEmpresaAndAdmin(empresaPayload);
        setCreating(false);

        if (!result?.success) {
            toast.error(result?.message || "No se pudo completar el registro");
            return;
        }

        const isPaidPlan = planInfo?.priceValue && parseFloat(planInfo.priceValue) > 0;

        if (result.admin && formData.email && !isPaidPlan) {
            await sendCredencialesEmail({
                to: formData.email,
                usuario: result.admin.usua,
                contrasena: result.admin.contra
            });
        }

        setAdminCreds(result.admin);
        setFormSubmitted(true);
    };

    // --- COMPONENTE INPUT MEJORADO ---
    const FormInput = ({ icon: Icon, label, name, type = "text", placeholder, required = true }) => (
        <div className="space-y-1.5">
            <label htmlFor={name} className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                {label} {required && <span className="text-emerald-500">*</span>}
            </label>
            <div className="relative group">
                {/* Icono con mejor posicionamiento */}
                {Icon && (
                    <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none border-r border-zinc-700/50 bg-zinc-800/30 rounded-l-lg">
                        <Icon className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                    </div>
                )}

                <input
                    id={name}
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={`
                        w-full h-11 pr-4 ${Icon ? 'pl-14' : 'pl-4'} rounded-lg
                        bg-zinc-800/80 border-0 
                        text-white text-sm placeholder:text-zinc-600
                        focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-zinc-800
                        transition-all duration-200
                        ${errors[name] ? 'ring-2 ring-red-500/50' : ''}
                    `}
                />
            </div>
            {errors[name] && <p className="text-xs text-red-400 mt-1">{errors[name]}</p>}
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* --- SECCIÓN PRINCIPAL DEL FORMULARIO --- */}
                <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    {/* Efecto de fondo sutil */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                    {!formSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-1">¡Comencemos!</h3>
                                <p className="text-sm text-zinc-400">Configura tu negocio en segundos.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormInput name="nombre" label="Nombre" placeholder="Juan" />
                                <FormInput name="apellido" label="Apellido" placeholder="Pérez" />
                            </div>

                            <FormInput name="nombreNegocio" label="Nombre del Negocio" placeholder="Ej. Bodega El Chino" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput name="email" label="Email" type="email" placeholder="juan@gmail.com" />
                                <FormInput name="telefono" label="Teléfono" placeholder="999 000 111" />
                            </div>

                            <div className="pt-2">
                                <label className="flex items-start gap-3 cursor-pointer group select-none">
                                    <div className="relative mt-0.5">
                                        <input
                                            type="checkbox"
                                            name="aceptaTerminos"
                                            checked={formData.aceptaTerminos}
                                            onChange={handleChange}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-md border-2 ${formData.aceptaTerminos ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 group-hover:border-zinc-500'} flex items-center justify-center transition-colors`}>
                                            {formData.aceptaTerminos && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                    </div>
                                    <span className="text-xs text-zinc-400 leading-snug">
                                        Acepto <span className="text-emerald-400 hover:underline">términos y condiciones</span>.
                                    </span>
                                </label>
                                {errors.aceptaTerminos && <p className="mt-1 text-xs text-red-400">{errors.aceptaTerminos}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {creating ? "Creando..." : "Crear Cuenta"}
                            </button>
                        </form>
                    ) : (
                        // Vista de Éxito / Credenciales
                        <div className="text-center py-10 relative z-10 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">¡Todo listo!</h3>
                            <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
                                Tu cuenta ha sido pre-creada. Realiza el pago para activarla.
                            </p>

                            <div className="bg-zinc-950/50 rounded-xl p-4 mb-8 border border-zinc-800 text-left">
                                <div className="flex justify-between text-sm mb-2 pb-2 border-b border-zinc-800/50">
                                    <span className="text-zinc-500">Usuario:</span>
                                    <span className="text-emerald-400 font-mono font-medium">{adminCreds?.usua}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Contraseña:</span>
                                    <span className="text-emerald-400 font-mono font-medium">{adminCreds?.contra}</span>
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-3 text-center">
                                    Guarda estos datos. También fueron enviados a tu correo.
                                </p>
                            </div>

                            <WalletBrick
                                planInfo={planInfo}
                                userData={{
                                    nombre: formData.nombre,
                                    apellido: formData.apellido,
                                    email: formData.email,
                                    telefono: formData.telefono
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* --- SIDEBAR RESUMEN --- */}
                <aside className="lg:col-span-2 space-y-4">
                    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 rounded-md">
                                {planInfo.plan}
                            </span>
                            <span className="text-xl font-bold text-white">
                                {planInfo.price}<span className="text-sm text-zinc-500 font-normal">/{planInfo.period}</span>
                            </span>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            {(planInfo.features || []).map((feature, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <span className="text-sm text-zinc-300">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex gap-3">
                            <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                            <p className="text-xs text-blue-200/80">
                                Prueba sin compromiso. Si no te convence, cancelas cuando quieras.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};