import React from "react";
import { SectionShell } from "./ui/SectionShell";
import { SectionHeader } from "./ui/SectionHeader";
import { GlassCard } from "./ui/GlassCard";
import {
    Factory, Truck, Store, Briefcase,
    Hammer, HeartPulse, Shirt, Globe,
    MoveRight
} from "lucide-react";

const sectors = [
    { icon: <Factory size={32} />, label: "Manufactura" },
    { icon: <Truck size={32} />, label: "Distribución" },
    { icon: <Store size={32} />, label: "Retail" },
    { icon: <Briefcase size={32} />, label: "Servicios" },
    { icon: <Hammer size={32} />, label: "Construcción" },
    { icon: <HeartPulse size={32} />, label: "Farmacia" },
    { icon: <Shirt size={32} />, label: "Moda y Accesorios" },
    { icon: <Globe size={32} />, label: "Importación" }
];

// Microtext mapping for design depth
const sectorDetails = {
    "Manufactura": "Producción • Costos • Lotes",
    "Distribución": "Rutas • Flota • Despacho",
    "Retail": "POS • Inventario • Fidelización",
    "Servicios": "Proyectos • Horas • Facturación",
    "Construcción": "Obras • Materiales • Avance",
    "Farmacia": "Lotes • Vencimientos • DIGEMID",
    "Moda y Accesorios": "Tallas • Colores • Colecciones",
    "Importación": "Aduanas • Costeo • Landed"
};

export const SectoresAtendemos = ({ onOpenModal }) => {
    return (
        <SectionShell id="sectores" className="relative z-10 py-24 md:py-32">

            {/* Background Overlay for Readability */}
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] -z-10 pointer-events-none" />

            <div className="max-w-[60ch] mx-auto text-center mb-16 px-4">
                <SectionHeader
                    title="Sectores que Atendemos"
                    subtitle="Experiencia comprobada en múltiples industrias con soluciones especializadas."
                    className="mb-0" // Reset margin to handle it in container
                />
            </div>

            {/* Premium Grid: 2 cols (mobile), 3 cols (md), 4 cols (lg) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto mb-24 px-4">
                {sectors.map((sector, index) => (
                    <GlassCard
                        key={index}
                        className="flex flex-col items-start justify-center p-6 md:p-8 !bg-white/5 border-white/10 hover:border-white/20 hover:-translate-y-px hover:shadow-lg transition-all duration-300 group cursor-default rounded-[20px] h-full"
                    >
                        {/* Icon Container */}
                        <div className="w-11 h-11 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:border-white/20 transition-all duration-300">
                            {React.cloneElement(sector.icon, { size: 20 })}
                        </div>

                        {/* Title Block - Left Aligned */}
                        <div className="w-full text-left mb-1">
                            <span className="text-base font-bold text-white/90 block">
                                {sector.label}
                            </span>
                        </div>

                        {/* Microtext Block - Left Aligned */}
                        <div className="w-full text-left">
                            <span className="text-xs text-white/50 font-medium block">
                                {sectorDetails[sector.label] || "Soluciones a medida"}
                            </span>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* CTA Integrado - Premium Glass Card */}
            <div className="w-full flex justify-center px-4">
                <GlassCard className="relative w-full max-w-3xl overflow-hidden rounded-[24px] border-white/10 bg-[#0A0B10] p-8 md:p-12 text-center shadow-2xl">

                    {/* Background Detail - Image 1 Style (Darker, Cleaner) */}

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Badge - Image 1 Style (Dark Pill) */}
                        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md shadow-inner">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                                Consulta sin compromiso
                            </span>
                        </div>

                        <h3 className="text-3xl md:text-5xl font-bold text-white mb-6 font-manrope tracking-tight text-balance leading-tight">
                            ¿Listo para transformar tu empresa?
                        </h3>

                        <p className="mb-10 max-w-lg text-lg leading-relaxed text-gray-400 font-light">
                            Agenda una llamada y revisa cómo HoryCore puede adaptarse a tus procesos y a tu crecimiento.
                        </p>

                        <button
                            onClick={() => onOpenModal && onOpenModal("Consulta", "contact")}
                            className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-[#5865F2] hover:bg-[#4752c4] px-10 py-4 text-lg font-bold text-white
                            shadow-[0_8px_30px_rgba(88,101,242,0.4)] hover:shadow-[0_12px_40px_rgba(88,101,242,0.5)]
                            transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Solicitar cotización
                            <MoveRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </button>

                        {/* Microcopy de confianza */}
                        <p className="mt-4 text-xs uppercase tracking-widest text-white/35">
                            Respuesta en &lt; 24h • Soporte local
                        </p>
                    </div>
                </GlassCard>
            </div>
        </SectionShell>
    );
};
