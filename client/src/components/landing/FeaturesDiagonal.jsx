import { motion } from "framer-motion";
import { useState } from "react";

import { InvitationModal } from "./InvitationModal";
import featuresdiagonal from "../../assets/images/featuresdiagonal.jpg";

export const FeaturesDiagonal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Scroll suave a la sección de Precios
  const handleScrollToPricing = () => {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      className="lg:mb-16 w-full flex flex-col justify-center items-center"
      style={{
        backgroundColor: 'rgba(38, 39, 43, 0.5)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className=" 2xl:w-[1150px] xl:w-[1050px]  md:w-4/5 flex justify-center pt-12 lg:pt-24 pb-8 lg:pb-20 mx-auto lg:flex-row flex-col">
          <div className="w-3/4 lg:w-1/2 flex flex-col lg:mx-unset mx-auto">
            <span className="block-subtitle">Acelera tu éxito</span>
            <h2 className="mt-10 mb-8 text-4xl lg:text-5xl block-big-title">
              Construye y lanza sin problemas
            </h2>
            <p className="mb-16 text-secondary-text leading-loose">
              Nuestra plataforma te permite lanzar tus proyectos orientados a datos con facilidad. Aumenta la productividad y logra mejores resultados. Potencia tu toma de decisiones con analítica avanzada
            </p>
            <button
              className="w-[210px] h-12 contained-button mr-10 "
              onClick={handleScrollToPricing}
              aria-label="Comenzar"
            >
              Empezar
            </button>
          </div>
          <div className="w-4/5 lg:w-1/2 lg:pl-16 flex justify-center mx-auto pt-16 lg:pt-0">
            <img
              src={featuresdiagonal}
              alt="Feature image"
              className="rounded-xl  main-border-gray"
            />
          </div>
        </div>
      </motion.div>
      {isModalOpen && (
        <InvitationModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
      )}
    </section>
  );
};
