import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { LandingButton } from './ui/LandingButton';
import { PLANS_CONFIG } from '../../config/plans.config';

export const Pricing = ({ isPocketMode }) => {
  const [isMonthly, setIsMonthly] = useState(true);
  const navigate = useNavigate();

  const handlePlanSelection = (planName, period) => {
    const searchParams = new URLSearchParams({
      plan: planName,
      period: period
    });

    if (isPocketMode) {
      navigate(`/landing/registro?${searchParams.toString()}`);
    } else {
      navigate(`/landing/registro-licencia?${searchParams.toString()}`);
    }
  };

  return (
    <section className="py-24 bg-[#02040a] text-white relative font-manrope">
      {/* Background Gradients for seamless integration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 font-manrope">Planes simples y transparentes.</h2>
          <p className="text-gray-400">Escala tu negocio con la tecnología adecuada.</p>


          {/* Toggle - Hidden in Pocket Mode */}
          {!isPocketMode && (
            <div className="flex items-center justify-center gap-6 mt-8 select-none">
              <span
                className={`cursor-pointer transition-colors duration-300 ${isMonthly ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setIsMonthly(true)}
              >
                Mensual
              </span>

              <button
                onClick={() => setIsMonthly(!isMonthly)}
                className="w-14 h-8 rounded-full border-2 border-white/20 p-1 relative transition-colors hover:border-white/40 focus:outline-none"
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${!isMonthly ? 'translate-x-[1.4rem]' : 'translate-x-0'}`} />
              </button>

              <span
                className={`cursor-pointer transition-colors duration-300 flex items-center gap-2 ${!isMonthly ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setIsMonthly(false)}
              >
                Anual
                <span className="text-landing-accent text-[10px] font-bold bg-landing-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wider">-20%</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {isPocketMode ? (
            <>
              {/* Plan Diario */}
              <div className="p-8 rounded-2xl border border-white/10 bg-[#0f121a] hover:border-amber-500/30 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-2">Diario</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold tracking-tight text-white">S/ 5</span>
                  <span className="text-gray-500 text-sm">/ día</span>
                </div>
                <p className="text-sm text-gray-400 mb-8 min-h-[40px]">Perfecto para ferias o ventas eventuales.</p>
                <LandingButton
                  onClick={() => handlePlanSelection('Diario', 'dia')}
                  variant="secondary"
                  fullWidth
                  className="hover:border-amber-500 hover:bg-amber-500 hover:text-black mb-8 border-white/20"
                >
                  Elegir Diario
                </LandingButton>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li className="flex gap-3"><Check size={18} className="text-amber-400 shrink-0" /> Acceso total por 24 horas</li>
                  <li className="flex gap-3"><Check size={18} className="text-amber-400 shrink-0" /> Ventas ilimitadas</li>
                </ul>
              </div>

              {/* Plan Semanal */}
              <div className="p-8 rounded-2xl border border-white/10 bg-[#0f121a] hover:border-amber-500/30 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-2">Semanal</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold tracking-tight text-white">S/ 10</span>
                  <span className="text-gray-500 text-sm">/ semana</span>
                </div>
                <p className="text-sm text-gray-400 mb-8 min-h-[40px]">Ideal para campañas cortas o temporadas.</p>
                <LandingButton
                  onClick={() => handlePlanSelection('Semanal', 'semana')}
                  variant="secondary"
                  fullWidth
                  className="hover:border-amber-500 hover:bg-amber-500 hover:text-black mb-8 border-white/20"
                >
                  Elegir Semanal
                </LandingButton>
                <ul className="space-y-4 text-sm text-gray-400">
                  <li className="flex gap-3"><Check size={18} className="text-amber-400 shrink-0" /> Acceso por 7 días</li>
                  <li className="flex gap-3"><Check size={18} className="text-amber-400 shrink-0" /> Gestión de inventario</li>
                </ul>
              </div>

              {/* Plan Express (Mensual) - Featured */}
              <div className="p-8 rounded-2xl bg-[#0f121a] text-white shadow-2xl relative lg:-mt-4 lg:pb-12 border border-amber-500/50 group hover:border-amber-500 transition-all duration-300">
                <div className="absolute top-6 right-6 text-xs font-bold tracking-widest text-amber-500 opacity-100 uppercase">POPULAR</div>

                <h3 className="text-xl font-bold mb-2 text-white">Express Mensual</h3>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tighter text-white">S/ 30</span>
                  <span className="text-gray-500 text-sm font-medium">/ mes</span>
                </div>

                <p className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                  MEJOR VALOR
                </p>

                <p className="text-gray-400 text-sm mb-8 leading-relaxed">Tu negocio operando todo el mes sin preocupaciones.</p>

                <LandingButton
                  onClick={() => handlePlanSelection('Express', 'mes')}
                  variant="accent"
                  size="lg"
                  fullWidth
                  className="mb-8 flex items-center justify-center gap-2 group"
                >
                  Obtener Express <span className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all">→</span>
                </LandingButton>
                <ul className="space-y-4 text-sm text-gray-300">
                  <li className="flex gap-3 items-center"><Check size={16} className="text-amber-500 shrink-0" /> Todo incluido por 30 días</li>
                  <li className="flex gap-3 items-center"><Check size={16} className="text-amber-500 shrink-0" /> Sin contratos forzosos</li>
                  <li className="flex gap-3 items-center"><Check size={16} className="text-amber-500 shrink-0" /> Actualizaciones gratuitas</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Plan Basic */}
              <div className="p-8 rounded-2xl border border-white/10 bg-[#0f121a] hover:border-landing-accent/30 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-2">Basic</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold tracking-tight text-white">S/ {isMonthly ? PLANS_CONFIG.Basic.monthly : PLANS_CONFIG.Basic.yearly}</span>
                  <span className="text-gray-500 text-sm">/ {isMonthly ? 'mes' : 'año'}</span>
                </div>
                <p className="text-sm text-gray-400 mb-8 min-h-[40px]">Para boutiques y tiendas de moda que inician.</p>
                <LandingButton
                  onClick={() => handlePlanSelection('Basic', isMonthly ? 'mes' : 'año')}
                  variant="outlineWhite"
                  fullWidth
                  className="mb-8 border-white/20"
                >
                  Comenzar
                </LandingButton>
                <ul className="space-y-4 text-sm text-gray-400">
                  {PLANS_CONFIG.Basic.features.map((feature, i) => (
                    <li key={i} className="flex gap-3"><Check size={18} className="text-emerald-400 shrink-0" /> {feature}</li>
                  ))}
                </ul>
              </div>

              {/* Plan Pro (Featured) */}
              <div className="p-8 rounded-2xl bg-[#0f121a] text-white shadow-2xl relative lg:-mt-4 lg:pb-12 border border-white/10 group hover:border-landing-accent/30 transition-all duration-300">
                <div className="absolute top-6 right-6 text-xs font-bold tracking-widest text-landing-accent opacity-80 uppercase">RECOMENDADO</div>

                <h3 className="text-xl font-bold mb-2 text-white">Pro</h3>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tighter text-white">S/ {isMonthly ? PLANS_CONFIG.Pro.monthly : PLANS_CONFIG.Pro.yearly.toLocaleString('es-PE')}</span>
                  <span className="text-gray-500 text-sm font-medium">/ {isMonthly ? 'mes' : 'año'}</span>
                </div>

                <p className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-landing-accent rounded-full"></span>
                  MEJOR PARA CRECIMIENTO
                </p>

                <p className="text-gray-400 text-sm mb-8 leading-relaxed">Facturación electrónica y control total para tu equipo.</p>

                <LandingButton
                  onClick={() => handlePlanSelection('Pro', isMonthly ? 'mes' : 'año')}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="mb-8 flex items-center justify-center gap-2 group shadow-white/10"
                >
                  Obtener Pro <span className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all">→</span>
                </LandingButton>
                <ul className="space-y-4 text-sm text-gray-300">
                  {PLANS_CONFIG.Pro.features.map((feature, i) => (
                    <li key={i} className="flex gap-3 items-center"><Check size={16} className="text-white shrink-0" /> {feature}</li>
                  ))}
                </ul>
              </div>

              {/* Plan Enterprise */}
              <div className="p-8 rounded-2xl border border-white/10 bg-[#0f121a] hover:border-landing-accent/30 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold tracking-tight text-white">S/ {isMonthly ? PLANS_CONFIG.Enterprise.monthly : PLANS_CONFIG.Enterprise.yearly.toLocaleString('es-PE')}</span>
                  <span className="text-gray-500 text-sm">/ {isMonthly ? 'mes' : 'año'}</span>
                </div>
                <p className="text-xs text-gray-500 font-medium mb-6 uppercase tracking-wider">Para cadenas y franquicias</p>

                <p className="text-sm text-gray-400 mb-8 min-h-[40px]">Soluciones personalizadas para alto volumen.</p>

                <LandingButton
                  variant="primary"
                  fullWidth
                  onClick={() => handlePlanSelection('Enterprise', isMonthly ? 'mes' : 'año')}
                  className="mb-8"
                >
                  Elegir Enterprise
                </LandingButton>

                <ul className="space-y-4 text-sm text-gray-400">
                  {PLANS_CONFIG.Enterprise.features.map((feature, i) => (
                    <li key={i} className="flex gap-3"><Check size={18} className="text-landing-accent shrink-0" /> {feature}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* FAQ Quick Block - Redesigned to fix the "image 5" issue & line alignment */}


      </div>
    </section>
  );
};
