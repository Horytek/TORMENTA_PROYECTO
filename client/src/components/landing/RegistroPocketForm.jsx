import React, { useState } from 'react';
import WalletBrick from './WalletBrick';
import { expressRegister } from '@/services/express.services';
import { toast } from "react-hot-toast";
import { CheckCircle2, Sparkles, Building2, Mail, Phone, Lock } from "lucide-react"; // StartContent icons
import { Input, Checkbox, Button } from "@heroui/react";

// Helper para determinar el plan
function getPlanPagoInt(planName) {
    let name = (planName || "").toLowerCase();
    name = name.replace(/plan|resumen del plan|resumen|del|de|el|la/gi, "").trim();

    // DB IDs: 1=Diario, 2=Semanal, 3=Express(Mensual)
    if (name.includes("diario") || name.includes("daily")) return 1;
    if (name.includes("semanal") || name.includes("weekly")) return 2;
    if (name.includes("express") || name.includes("mensual") || name.includes("monthly") || name.includes("basic")) return 3;

    return 3; // Default to Express
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
    const [isSuccess, setIsSuccess] = useState(false);

    const inputClassNames = {
        inputWrapper: "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 focus-within:!border-emerald-500/60 h-12 px-4",
        label: "text-sm text-zinc-400 mb-1",
        input: "!text-white !bg-transparent placeholder:text-zinc-600 text-sm"
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
        if (!formData.nombreNegocio.trim()) { formErrors.nombreNegocio = 'Requerido'; isValid = false; }
        if (!formData.email.trim()) { formErrors.email = 'Requerido'; isValid = false; }
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) { formErrors.email = 'Email inválido'; isValid = false; }
        if (!formData.telefono.trim()) { formErrors.telefono = 'Requerido'; isValid = false; }
        if (!formData.password.trim()) { formErrors.password = 'Requerido'; isValid = false; }
        else if (formData.password.length < 6) { formErrors.password = 'Mínimo 6 caracteres'; isValid = false; }
        if (!formData.aceptaTerminos) { formErrors.aceptaTerminos = 'Debes aceptar los términos'; isValid = false; }

        setErrors(formErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setCreating(true);

        // Payload for Express Register (Pocket POS)
        // Note: Express register expects { business_name, email, password }
        // We can also send other fields if the backend supports them later, checking controller... 
        // Controller only takes business_name, email, password. 
        // We should update the backend later to store name/phone if needed, 
        // but for now we stick to the working controller.

        const payload = {
            business_name: formData.nombreNegocio,
            email: formData.email,
            password: formData.password,
            plan_id: getPlanPagoInt(planInfo?.plan)
        };

        try {
            const result = await expressRegister(payload);
            setCreating(false);

            if (result) {
                toast.success("¡Cuenta creada! Completa el pago para activar tu suscripción.");
                // No token returned, so we don't login.
                // Just show success view (WalletBrick)
                setIsSuccess(true);
                // We keep the user on the page to pay
            }
        } catch (error) {
            console.error(error);
            setCreating(false);
            const msg = error.response?.data?.message || "Error al registrar el negocio.";
            toast.error(msg);
            setErrors({ ...errors, api: msg });
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* --- SECCIÓN PRINCIPAL DEL FORMULARIO --- */}
                <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    {/* Efecto de fondo sutil */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-1">¡Comencemos!</h3>
                                <p className="text-sm text-zinc-400">Configura tu negocio en segundos.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Nombre"
                                    labelPlacement="outside"
                                    placeholder="Juan"
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
                                    placeholder="Pérez"
                                    value={formData.apellido}
                                    onValueChange={(val) => handleChange('apellido', val)}
                                    isInvalid={!!errors.apellido}
                                    errorMessage={errors.apellido}
                                    variant="bordered"
                                    radius="lg"
                                    classNames={inputClassNames}
                                />
                            </div>

                            <Input
                                startContent={<Building2 className="text-zinc-500 w-4 h-4" />}
                                label="Nombre del Negocio"
                                labelPlacement="outside"
                                placeholder="Ej. Bodega El Chino"
                                value={formData.nombreNegocio}
                                onValueChange={(val) => handleChange('nombreNegocio', val)}
                                isInvalid={!!errors.nombreNegocio}
                                errorMessage={errors.nombreNegocio}
                                variant="bordered"
                                radius="lg"
                                classNames={inputClassNames}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    startContent={<Mail className="text-zinc-500 w-4 h-4" />}
                                    label="Email"
                                    labelPlacement="outside"
                                    type="text"
                                    placeholder="juan@gmail.com"
                                    value={formData.email}
                                    onValueChange={(val) => handleChange('email', val)}
                                    isInvalid={!!errors.email}
                                    errorMessage={errors.email}
                                    variant="bordered"
                                    radius="lg"
                                    classNames={inputClassNames}
                                />
                                <Input
                                    startContent={<Phone className="text-zinc-500 w-4 h-4" />}
                                    label="Teléfono"
                                    labelPlacement="outside"
                                    placeholder="999 000 111"
                                    value={formData.telefono}
                                    onValueChange={(val) => handleChange('telefono', val)}
                                    isInvalid={!!errors.telefono}
                                    errorMessage={errors.telefono}
                                    variant="bordered"
                                    radius="lg"
                                    classNames={inputClassNames}
                                />
                            </div>

                            <Input
                                startContent={<Lock className="text-zinc-500 w-4 h-4" />}
                                label="Contraseña"
                                labelPlacement="outside"
                                type="password"
                                placeholder="******"
                                value={formData.password}
                                onValueChange={(val) => handleChange('password', val)}
                                isInvalid={!!errors.password}
                                errorMessage={errors.password}
                                variant="bordered"
                                radius="lg"
                                classNames={inputClassNames}
                            />

                            <div className="pt-2">
                                <Checkbox
                                    isSelected={formData.aceptaTerminos}
                                    onValueChange={(val) => handleChange('aceptaTerminos', val)}
                                    color="success"
                                    classNames={{
                                        label: "text-small text-zinc-400",
                                        wrapper: "group-data-[selected=true]:bg-emerald-500 group-data-[selected=true]:border-emerald-500 text-white"
                                    }}
                                >
                                    Acepto <span className="text-emerald-400 hover:underline">términos y condiciones</span>.
                                </Checkbox>
                                {errors.aceptaTerminos && <p className="mt-1 text-xs text-red-400">{errors.aceptaTerminos}</p>}
                            </div>

                            <Button
                                type="submit"
                                isLoading={creating}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-lg shadow-lg shadow-emerald-500/20 data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed"
                                size="lg"
                                radius="lg"
                            >
                                {creating ? "Creando..." : "Crear Cuenta"}
                            </Button>
                        </form>
                    ) : (
                        // Vista de Éxito
                        <div className="text-center py-10 relative z-10 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">¡Cuenta Creada!</h3>
                            <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
                                Tu cuenta de Pocket POS ha sido creada exitosamente.
                            </p>

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
