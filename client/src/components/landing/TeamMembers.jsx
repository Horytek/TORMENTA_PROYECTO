import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";

export const TeamMembers = () => {

  // Core Team Data
  const leaderTeam = [
    { initials: "DB", name: "Davist Bustamante", role: "CEO & Fundador", desc: "Visionario y líder del proyecto Horycore. Dirige la estrategia general.", isCeo: true },
    { initials: "MR", name: "Marco Rioja", role: "CTO & Arquitecto", desc: "Responsable de la arquitectura técnica y escalabilidad.", isCeo: false },
    { initials: "AR", name: "Andree Requejo", role: "Director TI", desc: "Lidera I+D de nuevas funcionalidades y tecnología.", isCeo: false },
    { initials: "ÁM", name: "Ángel Montenegro", role: "Director Ops", desc: "Optimiza procesos internos y eficiencia operativa.", isCeo: false },
    { initials: "FF", name: "Fernando Fernandez", role: "Director Producto", desc: "Especialista en UX. Asegura que Horycore sea intuitivo.", isCeo: false },
    { initials: "JR", name: "Javier Rojas", role: "Gerente General", desc: "Supervisa operaciones y cumplimiento de objetivos.", isCeo: false }
  ];

  // Specialists Data
  const specialists = [
    { name: 'Adrian Portocarrero', role: 'Full Stack Senior', initials: 'AP', desc: 'Desarrollo de microservicios y APIs escalables.' },
    { name: 'Julio Castañeda', role: 'Full Stack Senior', initials: 'JC', desc: 'Optimización de frontend y experiencia de usuario.' },
    { name: 'Armando Infante', role: 'Especialista BD', initials: 'AI', desc: 'Modelado de datos y optimización de consultas complejas.' },
    { name: 'Juan Forero', role: 'DBA Senior', initials: 'JF', desc: 'Seguridad, respaldo y alta disponibilidad de datos.' },
    { name: 'Johan Torres', role: 'Analista de Datos', initials: 'JT', desc: 'Inteligencia de negocios y paneles de control en tiempo real.' }
  ];

  return (
    <section className="w-full pb-32 relative z-10">
      <div className="max-w-7xl mx-auto px-6">

        {/* Lideres Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {leaderTeam.map((member, i) => (
            <GlassCard key={i} className={`p-0 group ${member.isCeo ? 'border-indigo-500/30 bg-indigo-500/5' : ''}`}>
              {/* Inner Content Wrapper for Perfect Centering */}
              <div className="flex flex-col items-center text-center p-8 w-full h-full">

                {/* Icon Container */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl ring-4 ring-white/5 group-hover:scale-105 transition-transform duration-300 ${member.isCeo ? 'bg-[#5865F2]' : 'bg-[#1A1D26]'}`}>
                  <span className="text-2xl font-bold text-white font-manrope">{member.initials}</span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3 font-manrope">{member.name}</h3>

                {/* Role Pill */}
                <div className={`inline-block px-4 py-1.5 rounded-full border mb-5 ${member.isCeo ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-white/5 border-white/10'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${member.isCeo ? 'text-indigo-200' : 'text-white/60'}`}>{member.role}</span>
                </div>

                <p className="text-white/50 text-sm leading-relaxed font-light px-2">
                  {member.desc}
                </p>

              </div>
            </GlassCard>
          ))}
        </div>


        {/* Especialistas Header */}
        <div className="mb-8">
          <div className="w-full bg-[#0A0B10] border border-white/10 rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
            <p className="text-lg md:text-xl text-gray-300 font-light relative z-10">
              Además contamos con <span className="text-white font-bold">especialistas de élite</span> que apoyan en desarrollo, seguridad y mejora continua.
            </p>
          </div>
        </div>

        {/* Especialistas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialists.map((spec, i) => (
            <div key={i} className="bg-[#0A0B10] border border-white/10 rounded-2xl p-5 flex items-start gap-5 hover:border-white/20 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Circle Avatar (Side) */}
              <div className="w-12 h-12 rounded-full bg-[#1A1D26] flex items-center justify-center shrink-0 border border-white/5">
                <span className="text-white font-bold text-sm tracking-wide">{spec.initials}</span>
              </div>

              {/* Text Info */}
              <div className="flex flex-col items-start pt-0.5">
                <h4 className="text-white font-bold text-sm font-manrope mb-1">{spec.name}</h4>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{spec.role}</p>
                <p className="text-white/40 text-xs leading-snug">
                  {spec.desc}
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
