import React from "react";
import { SectionShell } from "./ui/SectionShell";
import { SectionHeader } from "./ui/SectionHeader";
import { GlassCard } from "./ui/GlassCard";

export const ServiciosAdicionales = () => {
  return (
    <SectionShell id="servicios-adicionales">
      <SectionHeader
        title="Servicios Adicionales"
        subtitle="Complementamos tu inversión con servicios especializados que aseguran el éxito de tu implementación."
        badge="Valor Agregado"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Implementación */}
        <GlassCard className="p-8 md:p-10 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="w-12 h-12 rounded-xl bg:[var(--premium-bg)] border border-[var(--premium-border)] flex items-center justify-center text-white mb-6">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Implementación y Capacitación</h3>
            <p className="text-[var(--premium-muted)] mb-6 leading-relaxed">
              Acompañamiento completo desde la instalación hasta la adopción total del sistema por parte de tu equipo.
            </p>
            <div className="inline-block px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono mb-8">
              ● 2-4 semanas
            </div>
          </div>

          <ul className="space-y-2 border-t border-white/5 pt-6">
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Migración de datos
            </li>
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Capacitación personalizada
            </li>
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Go-live asegurado
            </li>
          </ul>
        </GlassCard>

        {/* Card 2: Integraciones */}
        <GlassCard className="p-8 md:p-10 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="w-12 h-12 rounded-xl bg:[var(--premium-bg)] border border-[var(--premium-border)] flex items-center justify-center text-white mb-6">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Integraciones</h3>
            <p className="text-[var(--premium-muted)] mb-6 leading-relaxed">
              Conectamos HoryCore con tus sistemas existentes: bancos, e-commerce, POS, y más.
            </p>
            <div className="inline-block px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono mb-8">
              ● 1-2 semanas
            </div>
          </div>

          <ul className="space-y-2 border-t border-white/5 pt-6">
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> APIs robustas
            </li>
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Sincronización en tiempo real
            </li>
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Compatibilidad total
            </li>
          </ul>
        </GlassCard>

        {/* Card 3: Hosting */}
        <GlassCard className="p-8 md:p-10 flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="w-12 h-12 rounded-xl bg:[var(--premium-bg)] border border-[var(--premium-border)] flex items-center justify-center text-white mb-6">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hosting en la Nube</h3>
            <p className="text-[var(--premium-muted)] mb-4 text-sm leading-relaxed">
              Infraestructura segura y confiable con respaldos automáticos y alta disponibilidad.
            </p>
            <div className="inline-block px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono mb-6">
              ● Disponible 24/7
            </div>
          </div>

          <ul className="space-y-2 border-t border-white/5 pt-4">
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> 99.9% uptime
            </li>
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Backups automáticos
            </li>
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Seguridad avanzada
            </li>
          </ul>
        </GlassCard>

        {/* Card 4: Soporte */}
        <GlassCard className="p-8 md:p-10 flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="w-12 h-12 rounded-xl bg:[var(--premium-bg)] border border-[var(--premium-border)] flex items-center justify-center text-white mb-6">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Soporte Técnico 24/7</h3>
            <p className="text-[var(--premium-muted)] mb-4 text-sm leading-relaxed">
              Asistencia técnica continua para garantizar el funcionamiento óptimo de tu sistema.
            </p>
            <div className="inline-block px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono mb-6">
              ● Siempre disponible
            </div>
          </div>

          <ul className="space-y-2 border-t border-white/5 pt-4">
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Respuesta inmediata
            </li>
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Expertos locales
            </li>
            <li className="flex items-center text-sm text-[var(--premium-muted2)]">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-3" /> Múltiples canales
            </li>
          </ul>
        </GlassCard>

      </div>
    </SectionShell>
  );
};
