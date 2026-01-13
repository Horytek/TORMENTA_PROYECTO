import { FacebookIcon } from "../../assets/icons/FacebookIcon";
import { InstagramIcon } from "../../assets/icons/InstagramIcon";
import { HoryCoreLogo } from "../../assets/logos/HoryCoreLogo";
import { TwitterIcon } from "../../assets/icons/TwitterIcon";

const footerData = [
  {
    title: "Productos",
    items: [
      { label: "Servicios", href: "/landing/servicios" },
      { label: "Sobre nosotros", href: "/landing/about" }
    ],
  },
  {
    title: "Enlaces importantes",
    items: [
      { label: "Equipo de la organización", href: "/landing/team" },
      { label: "Actualizaciones", href: "/landing/actualizaciones" },
      { label: "Términos y condiciones", href: "/landing/terminos-y-condiciones" },
      { label: "Política de privacidad", href: "/landing/politica-de-privacidad" }
    ],
  },
  {
    title: "Compañía",
    items: [
      { label: "Contáctanos", href: "/landing/contactanos" }
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="bg-[#02040a] text-slate-400 py-16 font-manrope relative border-t border-white/5">
      {/* Seamless transition glow */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="text-white w-8 h-8">
                <HoryCoreLogo />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">HoryCore</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-sm">
              Tecnología ERP que transforma la gestión empresarial.
              Diseñada para empresas que buscan control, velocidad y crecimiento sin límites.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors"><FacebookIcon /></a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors"><TwitterIcon /></a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-colors"><InstagramIcon /></a>
            </div>
          </div>

          {/* Links Columns - Dynamic Rendering */}
          {footerData.map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold mb-6">{section.title}</h4>
              <ul className="space-y-3 text-sm">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="group flex items-center gap-2 text-slate-400 hover:text-landing-accent transition-colors duration-300">
                      {/* Micro-interaction: Arrow Reveal */}
                      <span className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-landing-accent">
                        ›
                      </span>
                      {/* Micro-interaction: Text Slide */}
                      <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                        {item.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} HoryTek Inc. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
            <span>Diseñado con precisión en Perú.</span>
            <span className="w-1 h-1 rounded-full bg-slate-700 my-auto" />
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};