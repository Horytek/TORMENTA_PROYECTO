import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

import { InvitationModal } from "./InvitationModal";
import { CheckArrowIcon } from "../../assets/icons/CheckArrowIcon";

export const Pricing = () => {
  const [isMonthly, setIsMonthly] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = () => {
    setIsMonthly(!isMonthly);
  };

  const handlePlanSelection = (planName, period) => {
    // Redirigir a la nueva página de registro solo con el plan y período
    // El precio se calculará de forma segura en el componente de destino
    const searchParams = new URLSearchParams({
      plan: planName,
      period: period
    });
    navigate(`/landing/registro?${searchParams.toString()}`);
  };

  return (
    <section
      className="w-screen flex justify-center relative"
      style={{
        backgroundColor: 'rgba(38, 39, 43, 0.5)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="absolute -top-16" id="pricing" />
      <div className="pb-20 pt-12 2xl:w-[1150px] lg:w-[1050px] md:w-4/5">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <span className="block-subtitle">Encuentra tu ajuste perfecto</span>
              <h2 className="mt-6 mb-6 text-4xl lg:text-5xl font-bold font-heading text-primary-text">
                Elige tu mejor plan
              </h2>
              <p className="mb-6 text-secondary-text">
                Selecciona el plan que se adapte a tus necesidades y benefíciate de nuestras
                herramientas de análisis.
              </p>
              <label className="mx-auto bg-bgDark3 relative flex justify-between items-center group text-xl w-44 h-12 rounded-lg pr-36 pl-1 cursor-pointer pricing-toggle">
                <input
                  type="checkbox"
                  className="peer appearance-none pricing-toggle-checkbox"
                  checked={!isMonthly}
                  onChange={handleChange}
                />
                <span className="h-8 w-[5.5rem] flex items-center pr-2 bg-bgDark3 after:rounded-lg duration-300 ease-in-out  after:w-[30rem] after:h-10  after:bg-primary-color   after:shadow-md after:duration-300 peer-checked:after:translate-x-[5.5rem] cursor-pointer"></span>
                <div className="flex absolute text-primary-text text-sm font-bold">
                  <div
                    className={
                      isMonthly ? "mr-9 ml-3" : "mr-9 ml-3 text-gray-400"
                    }
                  >
                    Mensual
                  </div>
                  <div className={isMonthly ? "text-gray-400" : ""}>Anual</div>
                </div>
              </label>
            </div>
            <div className="flex flex-wrap flex-col lg:flex-row -mx-4 items-stretch mt-20">
              <div className="w-[350px] sm:w-[380px] lg:w-1/3 px-4 mb-8 lg:mb-0 flex">
                <div
                  className="p-8 rounded-3xl flex flex-col w-full"
                  style={{
                    backgroundColor: 'rgba(48, 49, 54, 0.7)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <h3 className="mb-2 text-xl font-bold font-heading text-primary-text text-left">
                    Básico
                  </h3>
                  <div className="flex justify-start items-end">
                    <div className="text-4xl sm:text-5xl font-bold text-primary-text text-left mt-4 mr-2">
                      {isMonthly ? "S/ 85" : "S/ 850"}
                    </div>
                    <div className="text-gray-500">
                      {isMonthly ? "/ mes" : "/ año"}
                    </div>
                  </div>
                  <p className="mt-4 mb-6 text-gray-500 leading-loose text-left">
                    Comienza a digitalizar tu negocio con acceso al innovador módulo de ventas.
                  </p>
                  <ul className="mb-6 text-primary-text flex-grow">
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Acceso al módulo de Ventas</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Reportes básicos (Análisis de ventas, Libro de ventas)</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Gestión de clientes</span></li>
                  </ul>
                  <button
                    className="inline-block text-center py-2 px-4 w-full rounded-xl text-white bg-primary-color hover:bg-primary-color/80 font-bold leading-loose transition"
                    onClick={() => handlePlanSelection('Básico', isMonthly ? 'mes' : 'año')}
                    aria-label="Comenzar"
                  >
                    Comenzar
                  </button>
                </div>
              </div>
              <div className="w-[350px] sm:w-[380px] lg:w-1/3 px-4 mb-8 lg:mb-0 relative flex">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-semibold px-4 py-1 rounded-full shadow z-10">
                  Popular
                </div>
                <div
                  className="px-8 py-8 rounded-3xl border border-orange-500 flex flex-col w-full"
                  style={{
                    backgroundColor: 'rgba(48, 49, 54, 0.7)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <h3 className="mb-2 2xl:mb-4 text-2xl font-bold font-heading text-primary-text text-left">
                    Pro
                  </h3>
                  <div className="flex justify-start items-end">
                    <div className="text-4xl sm:text-5xl font-bold text-primary-text text-left mt-4 mr-2">
                      {isMonthly ? "S/ 135" : "S/ 1,350"}
                    </div>
                    <div className="text-gray-500">
                      {isMonthly ? "/ mes" : "/ año"}
                    </div>
                  </div>
                  <p className="mt-8 mb-8 text-gray-500 leading-loose text-left">
                    Para negocios que necesitan control total de ventas, almacén y compras.
                  </p>
                  <ul className="mb-6 text-primary-text flex-grow">
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Acceso a todos los módulos</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Usuarios ilimitados</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Múltiples sucursales</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Uso de Chatbot</span></li>
                  </ul>
                  <button
                    className="inline-block text-center py-2 px-4 w-full rounded-xl text-white bg-primary-color hover:bg-primary-color/80 font-bold leading-loose transition"
                    onClick={() => handlePlanSelection('Pro', isMonthly ? 'mes' : 'año')}
                    aria-label="Comenzar"
                  >
                    Comenzar
                  </button>
                </div>
              </div>

              <div className="w-[350px] sm:w-[380px] lg:w-1/3 px-4 mb-8 lg:mb-0 flex">
                <div
                  className="p-8 rounded-3xl flex flex-col w-full"
                  style={{
                    backgroundColor: 'rgba(48, 49, 54, 0.7)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <h3 className="mb-2 text-xl font-bold font-heading text-primary-text text-left">
                    Enterprise
                  </h3>
                  <div className="flex justify-start items-end">
                    <div className="text-4xl sm:text-5xl font-bold text-primary-text text-left mt-4 mr-2">
                      {isMonthly ? "S/ 240" : "S/ 2,400"}
                    </div>
                    <div className="text-gray-500">
                      {isMonthly ? "/ mes" : "/ año"}
                    </div>
                  </div>
                  <p className="mt-4 mb-6 text-gray-500 leading-loose text-left">
                    La solución completa para empresas que requieren personalización y escalabilidad.
                  </p>
                  <ul className="mb-6 text-primary-text flex-grow">
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Usuarios ilimitados</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Múltiples sucursales</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Uso de Chatbot y Atajo de funciones</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Uso del log, mensajería y videollamadas internas</span></li>
                    <li className="mb-4 flex"><CheckArrowIcon /><span>Sucursales ilimitadas</span></li>
                  </ul>
                  <button
                    className="inline-block text-center py-2 px-4 w-full rounded-xl text-white bg-primary-color hover:bg-primary-color/80 font-bold leading-loose transition"
                    onClick={() => handlePlanSelection('Enterprise', isMonthly ? 'mes' : 'año')}
                    aria-label="Comenzar"
                  >
                    Comenzar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      {isModalOpen && (
        <InvitationModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
      )}
    </section>
  );
};
