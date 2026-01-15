import { motion } from 'framer-motion';
import { GlassCard } from "./ui/GlassCard";
import { ShieldAlert, CreditCard, Ban, Scale, BookOpen, Mail, Phone, MapPin, Calendar, Globe } from "lucide-react";

export const TerminosResponsabilidad = () => {

  const sections = [
    {
      id: 1,
      icon: <ShieldAlert className="w-6 h-6 text-white" />,
      title: "Limitación de Responsabilidad",
      content: (
        <>
          <p className="mb-4 text-white/60">
            En la máxima medida permitida por la ley, HoryTek no será responsable por <span className="text-white font-bold">daños indirectos, incidentales, especiales</span> o consecuentes que puedan surgir del uso de nuestros servicios.
          </p>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-sm text-white/50">
              <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">Límite:</span> Nuestra responsabilidad total estará limitada al monto pagado por el cliente por los servicios en los últimos 12 meses.
            </p>
          </div>
        </>
      )
    },
    {
      id: 2,
      icon: <CreditCard className="w-6 h-6 text-white" />,
      title: "Facturación y Pagos",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Términos de Pago
            </h4>
            <p className="text-xs text-white/50 leading-relaxed">
              Establecidos en el contrato específico. Los pagos deben realizarse según los plazos acordados.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
              <Ban className="w-4 h-4 text-red-400" /> Incumplimiento
            </h4>
            <p className="text-xs text-white/50 leading-relaxed">
              El incumplimiento puede resultar en la <span className="text-white">suspensión temporal</span> de los servicios.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      icon: <CreditCard className="w-6 h-6 text-white" />,
      title: "Política de Reembolso",
      content: (
        <p className="text-sm text-white/60 leading-relaxed mt-2">
          Para suscripciones mensuales, puede cancelar en cualquier momento y el acceso continuará hasta el final del ciclo de facturación. <span className="text-white">No ofrecemos reembolsos</span> por meses parciales o servicios ya prestados, salvo errores técnicos atribuibles a nuestra plataforma.
        </p>
      )
    },
    {
      id: 4,
      icon: <Ban className="w-6 h-6 text-white" />,
      title: "Terminación del Servicio",
      content: (
        <div className="space-y-3 text-white/60">
          <p>
            Cualquiera de las partes puede terminar el contrato de acuerdo con los <span className="text-white font-medium">términos específicos</span> del acuerdo comercial.
          </p>
          <p>
            HoryTek proporcionará un <span className="text-white font-medium">período razonable para la migración</span> de datos en caso de terminación.
          </p>
        </div>
      )
    },
    {
      id: 5,
      icon: <Scale className="w-6 h-6 text-white" />,
      title: "Ley Aplicable y Jurisdicción",
      content: (
        <div className="flex items-start gap-4">
          <Globe className="w-8 h-8 text-indigo-500/50 shrink-0" />
          <p className="text-white/60">
            Estos términos se rigen por las <span className="text-white font-medium">leyes de la República del Perú</span>.
            Cualquier disputa será resuelta en los tribunales competentes de <span className="text-white font-medium">Lima, Perú</span>.
          </p>
        </div>
      )
    }
  ];

  return (
    <section className="w-full pb-24 relative z-10 px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Disclaimer General */}
        <GlassCard className="!bg-[#0A0B10] p-8 md:p-10 border-indigo-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row items-center gap-8">
            <div className="hidden md:flex w-20 h-20 rounded-2xl bg-[#1A1D26] items-center justify-center border border-white/5 shadow-2xl shrink-0">
              <BookOpen className="w-10 h-10 text-white/80" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 font-manrope">Aceptación de los Términos</h3>
              <p className="text-white/50 leading-relaxed">
                Al acceder y utilizar los servicios de HoryCore, usted acepta estar legalmente vinculado por estos términos.
                Si no está de acuerdo, por favor absténgase de utilizar nuestra plataforma.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Grid de Secciones */}
        <div className="grid grid-cols-1 gap-6">
          {sections.map((section) => (
            <GlassCard key={section.id} className="p-8 hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
              <div className="absolute -left-20 top-0 w-40 h-full bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col md:flex-row items-start gap-6">
                {/* Number Badge */}
                <div className="w-12 h-12 rounded-xl bg-[#1A1D26] border border-white/10 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  {section.icon}
                </div>

                <div className="flex-1 w-full">
                  <h3 className="text-xl font-bold text-white mb-4 font-manrope group-hover:text-indigo-400 transition-colors">
                    {section.id}. {section.title}
                  </h3>
                  <div className="text-sm leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Contact Info Footer */}
        <div className="w-full mt-16 p-8 rounded-3xl bg-[#0A0B10] border border-white/10 text-center relative overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-indigo-500/10 blur-[60px] rounded-full" />

          <h3 className="text-2xl font-bold text-white mb-8 relative z-10 font-manrope">Información de Contacto</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <a href="mailto:javierrojasq.0612@gmail.com" className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center gap-3 group">
              <Mail className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-white/60 text-sm">javierrojasq.0612@gmail.com</span>
            </a>
            <a href="tel:+51961797720" className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center gap-3 group">
              <Phone className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-white/60 text-sm">+51 961 797 720</span>
            </a>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-3 group">
              <MapPin className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-white/60 text-sm">Chiclayo, Perú</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-white/30 text-xs">
            <Calendar className="w-3 h-3" />
            <span>Última actualización: {new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>

        </div>

      </div>
    </section>
  );
};
