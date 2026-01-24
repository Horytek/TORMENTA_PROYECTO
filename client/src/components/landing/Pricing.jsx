import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export const Pricing = () => {
  const [isMonthly, setIsMonthly] = useState(true);
  const navigate = useNavigate();

  const handlePlanSelection = (planName, period) => {
    const searchParams = new URLSearchParams({
      plan: planName,
      period: period
    });
    navigate(`/landing/registro?${searchParams.toString()}`);
  };

  return (
    <section className="py-24 bg-[#02040a] text-white relative font-manrope">
      {/* Background Gradients for seamless integration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 font-manrope">Planes simples y transparentes.</h2>
          <p className="text-gray-400">Escala tu negocio con la tecnología adecuada.</p>

          {/* Toggle */}
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
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Plan Emprendedor */}
          <div className="p-8 rounded-2xl border border-white/10 bg-[#0f121a] hover:border-landing-accent/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Emprendedor</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold tracking-tight text-white">S/ {isMonthly ? '79' : '790'}</span>
              <span className="text-gray-500 text-sm">/ {isMonthly ? 'mes' : 'año'}</span>
            </div>
            <p className="text-sm text-gray-400 mb-8 min-h-[40px]">Para boutiques y tiendas de moda que inician.</p>
            <button
              onClick={() => handlePlanSelection('Emprendedor', isMonthly ? 'mes' : 'año')}
              className="w-full py-3 rounded-lg border border-white/20 hover:border-white hover:bg-white hover:text-black text-white font-semibold transition-all mb-8"
            >
              Comenzar
            </button>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex gap-3"><Check size={18} className="text-emerald-400 shrink-0" /> Punto de Venta (POS) Rápido</li>
              <li className="flex gap-3"><Check size={18} className="text-emerald-400 shrink-0" /> Gestión de Tallas y Colores</li>
              <li className="flex gap-3"><Check size={18} className="text-emerald-400 shrink-0" /> Control de Inventario (Kárdex)</li>
              <li className="flex gap-3"><Check size={18} className="text-emerald-400 shrink-0" /> 1 Usuario / 1 Almacén</li>
            </ul>
          </div>

          {/* Plan Empresario (Featured) */}
          <div className="p-8 rounded-2xl bg-[#0f121a] text-white shadow-2xl relative lg:-mt-4 lg:pb-12 border border-white/10 group hover:border-landing-accent/30 transition-all duration-300">
            <div className="absolute top-6 right-6 text-xs font-bold tracking-widest text-landing-accent opacity-80 uppercase">RECOMENDADO</div>

            <h3 className="text-xl font-bold mb-2 text-white">Empresario</h3>
            <div className="mb-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tighter text-white">S/ {isMonthly ? '149' : '1,490'}</span>
              <span className="text-gray-500 text-sm font-medium">/ {isMonthly ? 'mes' : 'año'}</span>
            </div>

            <p className="text-xs text-gray-400 font-bold mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-landing-accent rounded-full"></span>
              MEJOR PARA CRECIMIENTO
            </p>

            <p className="text-gray-400 text-sm mb-8 leading-relaxed">Facturación electrónica y control total para tu equipo.</p>

            <button
              onClick={() => handlePlanSelection('Empresario', isMonthly ? 'mes' : 'año')}
              className="w-full py-4 rounded-xl bg-white hover:bg-gray-100 text-black font-bold transition-all hover:-translate-y-1 shadow-lg shadow-white/10 mb-8 flex items-center justify-center gap-2"
            >
              Obtener Pro <span className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all">→</span>
            </button>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex gap-3 items-center"><Check size={16} className="text-white shrink-0" /> Todo en Emprendedor</li>
              <li className="flex gap-3 items-center"><Check size={16} className="text-white shrink-0" /> Facturación Electrónica (SUNAT)</li>
              <li className="flex gap-3 items-center"><Check size={16} className="text-white shrink-0" /> Multi-Almacén (Hasta 2 sedes)</li>
              <li className="flex gap-3 items-center"><Check size={16} className="text-white shrink-0" /> Hasta 3 Usuarios y Roles</li>
              <li className="flex gap-3 items-center"><Check size={16} className="text-white shrink-0" /> Reportes de Rendimiento</li>
            </ul>
          </div>

          {/* Plan Corporativo */}
          <div className="p-8 rounded-2xl border border-white/10 bg-[#0f121a] hover:border-landing-accent/30 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-2">Corporativo</h3>
            <div className="mb-2">
              <span className="text-4xl font-bold tracking-tight text-white">A medida</span>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-6 uppercase tracking-wider">Para cadenas y franquicias</p>

            <p className="text-sm text-gray-400 mb-8 min-h-[40px]">Soluciones personalizadas para alto volumen.</p>

            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={() => window.location.href = 'mailto:ventas@horycore.com'}
                className="w-full py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
              >
                Contactar Ventas
              </button>
              <button className="w-full py-3 rounded-lg border border-white/20 text-gray-400 font-medium hover:text-white hover:border-white transition-colors">
                Agendar Demostración
              </button>
            </div>

            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex gap-3"><Check size={18} className="text-landing-accent shrink-0" /> Sedes y Usuarios Ilimitados</li>
              <li className="flex gap-3"><Check size={18} className="text-landing-accent shrink-0" /> Inteligencia de Negocios (BI)</li>
              <li className="flex gap-3"><Check size={18} className="text-landing-accent shrink-0" /> API de Integración</li>
            </ul>
          </div>
        </div>

        {/* FAQ Quick Block - Redesigned to fix the "image 5" issue & line alignment */}


      </div>
    </section>
  );
};
