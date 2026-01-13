import { SectionShell } from "./ui/SectionShell";
import { GlassCard } from "./ui/GlassCard";
import { MoveRight } from "lucide-react";

export const TransformacionDigital = ({ onOpenModal }) => {
  return (
    <SectionShell id="transformacion" className="relative z-10 py-24 md:py-32">
      <div className="w-full max-w-6xl mx-auto px-4">

        {/* Header Style - Horizontal Line */}
        <div className="flex items-center gap-6 mb-16 w-full">
          <h2 className="text-3xl md:text-5xl font-bold text-white font-manrope tracking-tight leading-none whitespace-nowrap">
            Da el siguiente paso
          </h2>
          <div className="h-[1px] bg-white/10 w-full rounded-full relative overflow-hidden flex-1">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shimmer" />
          </div>
        </div>

        {/* Main CTA Card */}
        <GlassCard className="relative w-full overflow-hidden rounded-[24px] border-white/10 bg-[#0A0B10] p-10 md:p-20 text-center shadow-2xl">

          {/* Background Detail */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md shadow-inner">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                Únete a la evolución
              </span>
            </div>

            <h3 className="text-4xl md:text-6xl font-bold text-white mb-8 font-manrope tracking-tight text-balance leading-tight">
              El futuro de tu empresa <br />
              <span className="text-indigo-400">comienza hoy.</span>
            </h3>

            <p className="mb-12 text-lg md:text-xl leading-relaxed text-gray-400 font-light max-w-2xl">
              No dejes que la complejidad operativa frene tu crecimiento. Descubre el poder de tener toda tu empresa bajo control.
            </p>

            <button
              onClick={() => onOpenModal && onOpenModal("Demo", "demo")}
              className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-[#5865F2] hover:bg-[#4752c4] px-12 py-5 text-lg font-bold text-white
                    shadow-[0_8px_30px_rgba(88,101,242,0.4)] hover:shadow-[0_12px_40px_rgba(88,101,242,0.5)]
                    transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Solicitar Demo Gratuita
              <MoveRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="mt-6 text-xs text-white/30 uppercase tracking-widest font-medium">
              Sin tarjeta de crédito • Cancelación en cualquier momento
            </p>
          </div>
        </GlassCard>

      </div>
    </SectionShell>
  );
};
