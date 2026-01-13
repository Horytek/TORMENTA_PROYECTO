import React from "react";
import { SectionShell } from "./ui/SectionShell";
import { GlassCard } from "./ui/GlassCard";
import { Mail, Phone, Clock, MoveRight } from "lucide-react";

export const ContactoServicios = ({ onOpenModal }) => {
  return (
    <SectionShell id="contacto" className="relative z-10 py-24 md:py-32">

      {/* Container Layout - Aligned with Site Grid */}
      <div className="w-full max-w-6xl mx-auto px-4">

        {/* Header - Horizontal Line Style (Beneficios Clave Image) */}
        <div className="flex items-center gap-6 mb-16 w-full">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-manrope tracking-tight leading-none whitespace-nowrap">
            Da el siguiente paso
          </h2>
          <div className="h-[1px] bg-white/10 w-full rounded-full relative overflow-hidden flex-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
          </div>
        </div>

        {/* Main Card - Big Glass without harsh borders */}
        <GlassCard className="p-8 md:p-16 !bg-[#060a14]/60 backdrop-blur-xl border-white/5 relative overflow-hidden rounded-[2.5rem] shadow-2xl">

          {/* Ambient Background Glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

          {/* Content Container */}
          <div className="relative z-10">

            {/* Headline Block */}
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#1e1b4b] border border-[#312e81] mb-6 shadow-inner">
                <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Garantía de Implementación</span>
              </div>

              <h3 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.15] font-manrope text-balance">
                ¿Listo para revolucionar <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                  la gestión de tu boutique?
                </span>
              </h3>
              <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
                Solicita una demostración personalizada y descubre por qué las marcas líderes confían en HoryCore.
              </p>
            </div>

            {/* 3 Mini Cards (Glass + Consistent Icon Container) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                { icon: <Mail className="w-5 h-5" />, title: "Email", value: "ventas@horycore.com" },
                { icon: <Phone className="w-5 h-5" />, title: "WhatsApp", value: "+51 961 797 720" },
                { icon: <Clock className="w-5 h-5" />, title: "Horario", value: "Lun-Vie: 9AM - 6PM" }
              ].map((item, idx) => (
                <div key={idx} className="p-6 md:p-8 rounded-[20px] bg-[#0b0e16] border border-white/5 hover:border-[#6366f1]/30 transition-all duration-300 group text-center hover:-translate-y-1 hover:shadow-lg relative overflow-hidden">
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="w-12 h-12 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:bg-[#6366f1]/20 group-hover:border-[#6366f1]/30 transition-all duration-300">
                    {item.icon}
                  </div>
                  <h4 className="text-white/90 font-bold mb-1 text-base">{item.title}</h4>
                  <p className="text-sm text-white/60 font-medium">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Main CTA - Refined Button (Glow & Border) */}
            <div className="text-center mb-16">
              <button
                onClick={() => onOpenModal && onOpenModal('Demo', 'demo')}
                className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-[#0F111A] border border-[#6366f1]/50 hover:border-[#6366f1] text-white font-bold text-lg shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Agendar Demostración
                  <div className="bg-[#6366f1] p-1.5 rounded-lg group-hover:translate-x-1 transition-transform border border-white/10">
                    <MoveRight className="w-4 h-4 text-white" />
                  </div>
                </span>
                {/* Button Internal Glow */}
                <div className="absolute inset-0 bg-[#6366f1]/5 blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <p className="mt-4 text-xs text-white/30 uppercase tracking-widest font-medium">
                Sin compromiso • Respuesta en &lt; 24h
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto border-t border-white/5 pt-12">
              {[
                { val: "+50", label: "Tiendas Activas" },
                { val: "Alta", label: "Satisfacción" },
                { val: "24/7", label: "Soporte Local" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl md:bg-white/[0.02] md:border md:border-white/5 hover:bg-white/[0.04] transition-colors">
                  <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 font-manrope">{stat.val}</h4>
                  <p className="text-[10px] md:text-xs text-white/40 uppercase tracking-[0.15em] font-bold text-center">{stat.label}</p>
                </div>
              ))}
            </div>

          </div>

        </GlassCard>

      </div>
    </SectionShell>
  );
};
