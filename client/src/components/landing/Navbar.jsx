import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { HoryCoreLogo } from "../../assets/logos/HoryCoreLogo";
import styles from "../../styles/landing.module.css";

const navbarLinks = [
  { label: "Inicio", href: "#home", ariaLabel: "Inicio" },
  { label: "Características", href: "#features", ariaLabel: "Características" },
  { label: "Precios", href: "#pricing", ariaLabel: "Precios" },
  { label: "Opiniones", href: "#feedback", ariaLabel: "Opiniones de clientes" },
  { label: "Dudas frecuentes", href: "#dudas-frecuentes", ariaLabel: "Dudas frecuentes" },
  { label: "Contacto", href: "/landing/contactanos", ariaLabel: "Contactar con nosotros" },
];

export const Navbar = ({ isPocketMode, setIsPocketMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Función para manejar la navegación a secciones
  const handleSectionNavigation = (href, label) => {
    // Si es un enlace de sección (#)
    if (href.startsWith('#')) {
      // Si no estamos en la página principal de landing, navegar allí primero
      if (location.pathname !== '/landing') {
        navigate('/landing');
        // Usar setTimeout para asegurar que la navegación se complete antes del scroll
        setTimeout(() => {
          const section = document.querySelector(href);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        // Si ya estamos en landing, hacer scroll directo
        const section = document.querySelector(href);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      // Para enlaces normales, usar navegación de React Router
      navigate(href);
    }

    // Cerrar el menú móvil si está abierto
    setIsOpen(false);
  };

  return (
    <nav
      className={`landing-navbar w-full h-20 flex flex-col justify-center items-center fixed ${styles.navbarBackdrop} z-40`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Más transparente
        backdropFilter: 'blur(10px)',
      }}
      aria-label="Main navigation"
    >
      <div className="w-11/12 xl:w-10/12 2xl:w-[1280px] flex justify-between items-center relative h-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          exit={{ opacity: 0 }}
        >
          <Link to="/landing" aria-label="Inicio">
            <div className="flex justify-start items-center grow basis-0">
              <div className="text-white mr-2 text-4xl flex items-center">
                <HoryCoreLogo />
              </div>
              <div className="text-white font-inter font-bold text-xl">
                Horytek
              </div>
            </div>
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          exit={{ opacity: 0 }}
        >
          <div className="hidden lg:flex h-full items-center">
            {navbarLinks.map(({ href, label, ariaLabel }) => (
              <button
                className="text-gray-300 text-sm font-medium mr-6 cursor-pointer hover:text-white transition whitespace-nowrap flex items-center bg-transparent border-none"
                onClick={() => handleSectionNavigation(href, label)}
                aria-label={ariaLabel}
                key={label}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          exit={{ opacity: 0 }}
        >
          <div className="grow basis-0 justify-end hidden lg:flex items-center gap-4 lg:ms-7">
            {/* Pocket Mode Toggle */}
            <button
              onClick={() => setIsPocketMode(!isPocketMode)}
              className={`px-5 py-2 rounded-full text-xs font-bold border transition-all duration-300 tracking-wide ${isPocketMode
                ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-transparent text-white border-white/30 hover:bg-white hover:text-black hover:border-white'}`}
            >
              {isPocketMode ? 'Modo Pocket ACTIVO' : 'Activar Modo Pocket'}
            </button>

            <Link
              to="/login"
              className="text-sm font-medium text-white hover:text-primary-color transition whitespace-nowrap px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5"
              aria-label="Iniciar Sesión"
            >
              Iniciar Sesión
            </Link>
          </div>

        </motion.div>
        <div
          className="lg:hidden flex flex-col px-2 py-3 border-solid border border-gray-600 rounded-md cursor-pointer hover:bg-bg-dark-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-5 h-0.5 bg-gray-500 mb-1"></div>
          <div className="w-5 h-0.5 bg-gray-500 mb-1"></div>
          <div className="w-5 h-0.5 bg-gray-500"></div>
        </div>
      </div>

      {/* Mobile navbar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="flex flex-col mt-16 lg:hidden absolute top-4 left-0 bg-bg-dark-1 z-50 w-full items-center gap-6 pb-10 border-y border-solid border-bg-dark-3 pt-10"
            >
              {navbarLinks.map(({ label, href, ariaLabel }) => (
                <button
                  key={href}
                  className="text-white text-xl font-medium hover:scale-105 transition duration-300 bg-transparent border-none"
                  onClick={() => handleSectionNavigation(href, label)}
                  aria-label={ariaLabel}
                >
                  {label}
                </button>
              ))}

              <button
                onClick={() => { setIsPocketMode(!isPocketMode); setIsOpen(false); }}
                className={`text-white text-lg font-bold transition-all duration-300 ${isPocketMode ? 'text-amber-500' : 'text-gray-400'}`}
              >
                {isPocketMode ? 'Modo Pocket: ON' : 'Modo Pocket: OFF'}
              </button>

              <Link to="/login"
                className="text-white border border-main-border rounded-xl bg-bg-dark-2 hover:bg-bg-dark-3 px-6 py-2 text-lg mt-4 transition"
                aria-label="Iniciar sesión">
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="text-white bg-primary-color hover:bg-primary-color/80 border border-primary-color rounded-xl px-6 py-2 text-lg transition"
                aria-label="Registrarse"
              >
                Registrarse
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};