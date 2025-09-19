import { useState } from "react";
import { motion } from "framer-motion";

const FAQData = [
  {
    question: "¿Qué es HoryCore y qué soluciones ofrece?",
    answer:
      "HoryCore es una plataforma integral que digitaliza la gestión empresarial. Ofrece módulos como control de inventario en tiempo real, gestión de ventas, generación automática de reportes, seguimiento de clientes y facturación electrónica validada por SUNAT.",
  },
  {
    question: "¿HoryCore cumple con los requisitos de facturación electrónica SUNAT?",
    answer:
      "Sí, nuestra plataforma está integrada con SUNAT para emitir comprobantes electrónicos válidos como boletas, facturas y notas de crédito, evitando errores y cumpliendo con la normativa vigente.",
  },
  {
    question: "¿Puedo controlar mis almacenes en tiempo real?",
    answer:
      "Claro. Con HoryCore puedes monitorear tu stock en tiempo real, configurar alertas de quiebre de stock y visualizar entradas y salidas desde cualquier dispositivo con conexión a internet.",
  },
  {
    question: "¿La plataforma es fácil de usar para mi equipo?",
    answer:
      "Sí. Hemos diseñado HoryCore con una interfaz moderna, intuitiva y responsive, ideal tanto para usuarios con experiencia como para quienes recién comienzan a digitalizar su negocio.",
  },
  {
    question: "¿Cómo accedo al soporte técnico si tengo dudas?",
    answer:
      "Nuestro equipo de soporte está disponible por WhatsApp, correo electrónico y desde la propia plataforma. Además, contamos con guías paso a paso y capacitaciones gratuitas.",
  },
];

export const FAQ = () => (
  <section className="relative -mt-8 sm:mt-0 pt-12 sm:pt-16 pb-16 bg-blueGray-50 overflow-hidden">
    <div className="absolute -top-10" id="FAQ" />
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="relative z-10 container px-2 sm:px-8 lg:px-4 mx-auto w-11/12 sm:w-full">
        <div className="md:max-w-4xl mx-auto">
          <p className="mb-7 block-subtitle text-center">¿Tienes alguna pregunta?</p>
          <h2 className="mb-16 block-big-title text-center">
            Preguntas Frecuentes
          </h2>
          <div className="mb-11 flex flex-wrap -m-1">
            {FAQData.map((item, index) => (
              <div className="w-full p-1" key={`${item.question}-${index}`}>
                <FAQBox
                  title={item.question}
                  content={item.answer}
                  key={`${item.question}-${item.answer}`}
                  defaultOpen={index === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  </section>
);

const FAQBox = ({ defaultOpen, title, content }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="pt-2 sm:pt-6 pb-2 px-3 sm:px-8  rounded-3xl bg-bgDark3 main-border-gray-darker mb-4 relative hover:bg-bgDark3Hover cursor-pointer transition"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex flex-col p-2  justify-center items-start">
        <h3 className=" content-title pt-3 sm:pt-0 pr-8 sm:pr-0">{title}</h3>
        <p
          className={`text-secondary-text pt-4 transition-height duration-300 overflow-hidden ${
            isOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          {content}
        </p>
      </div>
      <div className="absolute top-6 right-4 sm:top-8 sm:right-8">
        <svg
          width="28px"
          height="30px"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-all duration-500  ${
            isOpen ? "rotate-[180deg]" : "rotate-[270deg]"
          }`}
        >
          <path
            d="M4.16732 12.5L10.0007 6.66667L15.834 12.5"
            stroke="#4F46E5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </div>
    </div>
  );
};
