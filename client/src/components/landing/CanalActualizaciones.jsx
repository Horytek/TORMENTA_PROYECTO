import { SectionShell } from "./ui/SectionShell";
import { GlassCard } from "./ui/GlassCard";
import { LifeBuoy, Mail, MessageCircle, Clock } from "lucide-react";

export const CanalActualizaciones = () => {
  return (
    <section className="w-full py-24 relative z-10 bg-[#060a14]">
      <div className="max-w-5xl mx-auto px-6">

        <GlassCard className="!bg-[#0A0B10] p-10 md:p-12 border-white/10 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">

            {/* Icon & Title */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-500 mb-6 border border-blue-500/20">
                <LifeBuoy className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4 font-manrope">¿Ayuda con la actualización?</h3>
              <p className="text-white/50 text-lg font-light leading-relaxed mb-0">
                Nuestro equipo técnico te acompaña en cada paso para garantizar una transición fluida y sin interrupciones.
              </p>
            </div>

            {/* Contact Cards Grid */}
            <div className="flex-1 w-full grid grid-cols-1 gap-4">
              {/* Email */}
              <a href="mailto:javierrojasq.0612@gmail.com" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#1A1D26] flex items-center justify-center text-white/70 group-hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-0.5">Soporte</span>
                  <span className="text-white font-medium text-sm">javierrojasq.0612@gmail.com</span>
                </div>
              </a>

              {/* WhatsApp */}
              <a href="tel:+51961797720" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#1A1D26] flex items-center justify-center text-white/70 group-hover:text-white transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-0.5">WhatsApp</span>
                  <span className="text-white font-medium text-sm">+51 961 797 720</span>
                </div>
              </a>

              {/* Horario */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-full bg-[#1A1D26] flex items-center justify-center text-white/70">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-0.5">Horario</span>
                  <span className="text-white font-medium text-sm">Lun-Vie: 8AM - 8PM</span>
                </div>
              </div>

            </div>

          </div>
        </GlassCard>

      </div>
    </section>
  );
};
