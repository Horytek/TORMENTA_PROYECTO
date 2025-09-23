import { motion } from "framer-motion";

import { QuoteIcon } from "../../assets/icons/QuoteIcon";
import testimonial1 from "../../assets/images/testimonial1.png";
import testimonial2 from "../../assets/images/testimonial2.png";
import testimonial3 from "../../assets/images/testimonial3.png";

const testimonialsData = [
  {
    customerName: "María González",
    customerTitle: "Directora de Operaciones en Grupo Nova",
    content:
      "HoryCore nos permitió integrar todas las áreas de la empresa en una sola plataforma. Ahora gestionamos inventario, ventas y finanzas de forma mucho más eficiente. ¡Recomendado para cualquier empresa que quiera crecer!",
    image: testimonial1,
  },
  {
    customerName: "Carlos Ramírez",
    customerTitle: "Gerente de Recursos Humanos en Soluciones Delta",
    content:
      "La automatización de tareas y los reportes de HoryCore han transformado nuestra gestión interna. La toma de decisiones es más rápida y precisa gracias a la analítica avanzada.",
    image: testimonial2,
  },
  {
    customerName: "Lucía Fernández",
    customerTitle: "CEO de Innovatech",
    content:
      "Con HoryCore ERP hemos optimizado todos nuestros procesos. La plataforma es intuitiva y el soporte ha sido excelente. Sin duda, una herramienta clave para nuestro crecimiento.",
    image: testimonial3,
  },
];

export const Testimonials = () => (
  <section 
    className="w-full flex justify-center pt-16 pb-20 mb-8 lg:mb-16 relative"
    style={{
      backgroundColor: 'rgba(38, 39, 43, 0.5)',
      backdropFilter: 'blur(16px)'
    }}
  >
    <div className="absolute -top-16" id="feedback" />
    <div className="flex flex-col w-full lg:w-[1150px] justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="block-subtitle text-center mb-6">Testimonios</div>
        <div className="block-big-title text-center mb-20 px-8 sm:px-24 md:px-48">
          Empresas como la tuya confían en HoryCore
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-5 xl:gap-10 px-6 xl:px-0 items-center">
          {testimonialsData.map((testimonial, index) => (
            <div
              className="w-11/12 sm:w-4/5 md:w-[560px] lg:w-1/3 main-border-gray-darker rounded-xl flex flex-col px-6 py-4"
              style={{
                backgroundColor: 'rgba(48, 49, 54, 0.7)',
                backdropFilter: 'blur(4px)'
              }}
              key={`${testimonial.customerName}-${index}`}
            >
              <div className="flex mb-2">
                <QuoteIcon />
              </div>
              <div className="content-text-white">"{testimonial.content}"</div>
              <div className="flex mt-4 mb-2 xl:mt-8 xl:mb-4">
                <div>
                  <img
                    src={testimonial.image}
                    alt="Customer avatar"
                    width="45px"
                    height="5px"
                    aria-label={testimonial.customerName}
                  />
                </div>
                <div className="flex flex-col ml-4">
                  <div className="content-text-white font-medium">
                    {testimonial.customerName}
                  </div>
                  <div className="content-text-gray">
                    {testimonial.customerTitle}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);
