import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  AlertCircle
} from "lucide-react";

export const InformacionContacto = () => {
  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6 text-indigo-400" />,
      title: "Email Corporativo",
      primary: "javierrojasq.0612@gmail.com",
      secondary: "Atención 24/7",
      description: "Consultas sobre productos, soporte y facturación.",
      gradient: "from-indigo-500/10 to-blue-500/10"
    },
    {
      icon: <Phone className="w-6 h-6 text-purple-400" />,
      title: "Línea Directa",
      primary: "+51 961 797 720",
      secondary: "Lunes a Sábado",
      description: "Asistencia inmediata para ventas y emergencias.",
      gradient: "from-purple-500/10 to-pink-500/10"
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-green-400" />,
      title: "WhatsApp Gerencial",
      primary: "Chat Directo",
      secondary: "Javier Rojas - Gerente",
      description: "Canal exclusivo para negociaciones y alianzas.",
      gradient: "from-green-500/10 to-emerald-500/10",
      action: {
        label: "Iniciar Chat",
        href: "https://wa.me/51961797720"
      }
    },
    {
      icon: <MapPin className="w-6 h-6 text-orange-400" />,
      title: "Sede Principal",
      primary: "Chiclayo, Perú",
      secondary: "Oficinas Administrativas",
      description: "Actualmente operando mayoritariamente en remoto.",
      gradient: "from-orange-500/10 to-red-500/10"
    }
  ];

  const scheduleInfo = [
    { day: "Lunes - Viernes", hours: "9:00 AM - 8:00 PM" },
    { day: "Sábados", hours: "9:00 AM - 1:00 PM" },
    { day: "Domingos", hours: "Cerrado (Soporte Email)" }
  ];

  return (
    <section className="w-full pb-24 relative px-4" id="informacion-contacto">

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Contact Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard className="h-full p-8 hover:bg-white/[0.02] transition-colors group relative overflow-hidden border-white/5">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${method.gradient} blur-[40px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity`} />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="p-3 bg-white/5 w-fit rounded-xl border border-white/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                      {method.icon}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 font-manrope">{method.title}</h3>

                    <div className="mb-4">
                      <p className="text-white/90 font-medium text-lg">{method.primary}</p>
                      <p className="text-white/40 text-sm">{method.secondary}</p>
                    </div>

                    <p className="text-white/50 text-sm leading-relaxed mb-auto">
                      {method.description}
                    </p>

                    {method.action && (
                      <a
                        href={method.action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-green-500/10 text-green-400 font-bold border border-green-500/20 hover:bg-green-500/20 transition-all font-manrope text-sm"
                      >
                        {method.action.label}
                      </a>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">

            {/* Hours Card */}
            <GlassCard className="p-8 border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white font-manrope">Horario de Atención</h3>
              </div>

              <div className="space-y-4">
                {scheduleInfo.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/60 text-sm">{item.day}</span>
                    <span className="text-white/90 font-medium text-sm text-right">{item.hours}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Emergency Card */}
            <GlassCard className="p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/20">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-indigo-300 shrink-0 mt-1" />
                <div>
                  <h4 className="text-white font-bold mb-1">¿Urgencia Crítica?</h4>
                  <p className="text-white/60 text-sm leading-relaxed mb-3">
                    Si eres cliente Enterprise, utiliza tu canal dedicado de soporte Slack para respuesta en &lt; 15 min.
                  </p>
                </div>
              </div>
            </GlassCard>

          </div>

        </div>
      </div>

    </section>
  );
};
