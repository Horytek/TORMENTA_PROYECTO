import { motion } from 'framer-motion';
import { GlassCard } from "./ui/GlassCard";
import {
  Shield,
  Lock,
  Eye,
  Share2,
  Cookie,
  Globe,
  RefreshCw,
  Mail,
  Server,
  Database,
  Users
} from "lucide-react";

export const PrivacyContent = () => {

  const sections = [
    {
      id: 1,
      icon: <Database className="w-6 h-6 text-white" />,
      title: "Información que Recopilamos",
      content: (
        <ul className="space-y-3 mt-4">
          <li className="flex items-start gap-3 text-sm text-white/60">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
            <span><strong className="text-indigo-200">Registro:</strong> Nombre, email, teléfono, empresa y cargo.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-white/60">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
            <span><strong className="text-indigo-200">Empresarial:</strong> Datos financieros, inventarios y transacciones.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-white/60">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
            <span><strong className="text-indigo-200">Técnica:</strong> Dirección IP, navegador y uso del sistema.</span>
          </li>
        </ul>
      )
    },
    {
      id: 2,
      icon: <Eye className="w-6 h-6 text-white" />,
      title: "Uso de la Información",
      content: (
        <p className="text-sm text-white/60 leading-relaxed mt-2">
          Utilizamos tus datos para proporcionar el servicio ERP, procesar transacciones, cumplir normativas SUNAT, mejorar la seguridad y brindar soporte técnico dedicado.
        </p>
      )
    },
    {
      id: 3,
      icon: <Shield className="w-6 h-6 text-white" />,
      title: "Protección de Datos",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
            <Lock className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-white/70">Encriptación AES-256</span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-white/70">Acceso por Roles</span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
            <Server className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-white/70">Backups Redundantes</span>
          </div>
        </div>
      )
    },
    {
      id: 4,
      icon: <Share2 className="w-6 h-6 text-white" />,
      title: "Compartir Información",
      content: (
        <p className="text-sm text-white/60 leading-relaxed mt-2">
          <span className="text-white font-medium">No vendemos datos.</span> Solo compartimos información con proveedores de servicio (hosting) o por requerimiento legal (SUNAT/Autoridades).
        </p>
      )
    },
    {
      id: 5,
      icon: <Cookie className="w-6 h-6 text-white" />,
      title: "Cookies",
      content: (
        <p className="text-sm text-white/60 leading-relaxed mt-2">
          Usamos cookies esenciales para el funcionamiento del sistema, preferencias de usuario y analítica anonimizada para mejorar la experiencia.
        </p>
      )
    },
    {
      id: 6,
      icon: <Globe className="w-6 h-6 text-white" />,
      title: "Transferencias Internacionales",
      content: (
        <p className="text-sm text-white/60 leading-relaxed mt-2">
          Tus datos se procesan principalmente en <span className="text-white">Perú</span>. Cualquier transferencia internacional cumple con los más altos estándares de protección.
        </p>
      )
    }
  ];

  return (
    <section className="w-full pb-24 relative z-10 px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Intro Card */}
        <GlassCard className="!bg-[#0A0B10] p-8 border-indigo-500/20 relative overflow-hidden text-center md:text-left">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <h3 className="text-2xl font-bold text-white mb-4 font-manrope">Compromiso HoryCore</h3>
          <p className="text-white/50 leading-relaxed max-w-3xl">
            En HoryCore, la privacidad no es una opción, es un estándar base. Esta política detalla cómo protegemos la integridad y confidencialidad de tus datos empresariales críticos.
          </p>
        </GlassCard>

        {/* Grid de Secciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <GlassCard key={section.id} className="p-8 hover:bg-white/[0.02] transition-colors relative overflow-hidden group border-white/5">
              <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />

              <div className="relative z-10">
                {/* Icon Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1D26] border border-white/10 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white font-manrope group-hover:text-indigo-400 transition-colors">
                    {section.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="pl-0 md:pl-2">
                  {section.content}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Derechos del Usuario - Full Width */}
        <GlassCard className="p-8 border-white/5">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="shrink-0 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-2 font-manrope">Tus Derechos</h3>
              <p className="text-white/50 text-sm max-w-xs">Control total sobre tu información personal.</p>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              {['Acceso', 'Rectificación', 'Eliminación', 'Portabilidad'].map((right) => (
                <div key={right} className="p-3 rounded-lg bg-white/5 text-center text-sm font-medium text-white/80 border border-white/5">
                  {right}
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Contact Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-8 rounded-3xl bg-[#0A0B10] border border-white/10 mt-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-bold">¿Dudas sobre privacidad?</p>
              <p className="text-white/50 text-sm">Contáctanos a javierrojasq.0612@gmail.com</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/30 text-xs bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <RefreshCw className="w-3 h-3" />
            <span>Actualizado: {new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>

      </div>
    </section>
  );
};
