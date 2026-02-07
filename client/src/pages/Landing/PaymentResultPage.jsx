import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LandingSubPageLayout } from '../../components/landing/LandingSubPageLayout';
import { CheckCircle2, XCircle, Clock, ArrowRight, RotateCw } from "lucide-react";

export default function PaymentResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, approved, failure, pending

    useEffect(() => {
        // Determine status from URL path
        const path = location.pathname;
        if (path.includes('/success')) setStatus('approved');
        else if (path.includes('/failure')) setStatus('failure');
        else if (path.includes('/pending')) setStatus('pending');
        else setStatus('unknown');
    }, [location]);

    const config = {
        approved: {
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "bg-emerald-500/20",
            title: "¡Pago Exitoso!",
            desc: "Tu suscripción ha sido activada correctamente. Hemos enviado los detalles a tu correo.",
            button: "Ir a Iniciar Sesión",
            action: () => navigate('/login')
        },
        failure: {
            icon: XCircle,
            color: "text-red-400",
            bg: "bg-red-500/20",
            title: "El pago no se completó",
            desc: "Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.",
            button: "Volver a intentar",
            action: () => navigate('/landing/registro')
        },
        pending: {
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-500/20",
            title: "Pago en proceso",
            desc: "Tu pago se está procesando. Te notificaremos por correo cuando se confirme.",
            button: "Volver al inicio",
            action: () => navigate('/landing')
        },
        unknown: {
            icon: RotateCw,
            color: "text-gray-400",
            bg: "bg-gray-500/20",
            title: "Estado desconocido",
            desc: "No pudimos determinar el estado de tu pago.",
            button: "Volver al inicio",
            action: () => navigate('/landing')
        }
    };

    const currentConfig = config[status] || config.unknown;
    const Icon = currentConfig.icon;

    return (
        <LandingSubPageLayout activeSectorColor="#10b981">
            <section className="min-h-[60vh] flex items-center justify-center py-20">
                <div className="container mx-auto px-4 relative z-10 text-center">

                    <div className="max-w-md mx-auto bg-gradient-to-b from-gray-900/80 to-gray-900/40 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-10">
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${currentConfig.bg} flex items-center justify-center`}>
                            <Icon className={`w-10 h-10 ${currentConfig.color}`} />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
                            {currentConfig.title}
                        </h1>

                        <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                            {currentConfig.desc}
                        </p>

                        <button
                            onClick={currentConfig.action}
                            className="w-full py-3.5 px-6 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            {currentConfig.button}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>

                </div>
            </section>
        </LandingSubPageLayout>
    );
}
