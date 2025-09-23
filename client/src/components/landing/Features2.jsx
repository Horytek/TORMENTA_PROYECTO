import { motion } from "framer-motion";

import feature5 from "../../assets/images/feature8.svg";
import feature6 from "../../assets/images/feature9.svg";

import { CheckArrowIcon } from "../../assets/icons/CheckArrowIcon";

export const Features2 = () => (
  <section 
    className="w-full mt-12 sm:mt-24 mb-12 lg:my-20 lg:mb-24 pt-4"
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
      <div className="flex flex-wrap items-center 2xl:w-[1450px] xl:w-[1300px] w-11/12 mx-auto md:pl-4 xl:pr-16 xl:pl-16">
        <div className="w-11/12 sm:w-3/4 mx-auto lg:w-1/2 flex flex-wrap lg:-mx-4 sm:pr-8 justify-center order-last lg:order-first">
          <div className="mb-8 lg:mb-0 w-full px-2 lg:pl-40 flex flex-col justify-center md:pl-8">
            {/* Imagen superior - desplazada solo en pantallas grandes */}
            <div className="mb-4 py-10 md:pl-3 md:pr-40 lg:pr-12 rounded lg:transform lg:-translate-x-20">
              <img
                src={feature6}
                alt="Feature image 5"
                className="w-80 h-auto rounded-xl mx-auto lg:mx-0"
              />
            </div>

            {/* Imagen inferior - desplazada solo en pantallas grandes */}
            <div className="py-3 md:pl-20 lg:pl-12 md:pr-2 rounded lg:transform lg:translate-x-20">
              <img
                src={feature5}
                alt="Feature image 6"
                className="w-3/4 max-w-sm mx-auto lg:mx-0 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 mb-12 lg:mb-0 xl:pl-8">
          <div className="mx-auto lg:mx-auto w-11/12 sm:w-4/5 md:w-3/4 lg:w-unset">
            <span className="block-subtitle">Gestión inteligente para empresas</span>
            <h2 className="mt-6 mb-8 text-4xl lg:text-5xl block-big-title">
              Módulos ERP adaptados a tu negocio
            </h2>
            <p className="mb-10 text-secondary-text leading-loose">
              HoryCore te ofrece un conjunto de sistemas empresariales integrados, como ventas, almacén, compras y más!. 
              Diseñado para empresas que buscan eficiencia, escalabilidad y control en tiempo real.
            </p>
            <ul className="mb-6 text-primary-text">
              <li className="mb-4 flex">
                <CheckArrowIcon />
                <span>Licenciamiento flexible por módulo</span>
              </li>
              <li className="mb-4 flex">
                <CheckArrowIcon />
                <span>Control total sobre ventas, almacén y más</span>
              </li>
              <li className="mb-4 flex">
                <CheckArrowIcon />
                <span>Paneles con datos en tiempo real</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  </section>
);
