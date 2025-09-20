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
  { label: "Preguntas frecuentes", href: "#FAQ", ariaLabel: "Preguntas frecuentes" },
  { label: "Contacto", href: "/landing/contactanos", ariaLabel: "Contactar con nosotros" },
];

export const Navbar = () => {
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
        className={`landing-navbar w-full h-20 flex flex-col justify-center items-center fixed bg-bg-dark-1 lg:bg-bg-dark-transparent ${styles.navbarBackdrop} z-40`}
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
                <div className="text-white mr-2 text-6xl flex items-center">
                  <HoryCoreLogo />
                </div>
                <div className="text-white font-inter font-bold text-xl">
                  HoryCore
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
                  className="text-white lg:text-base text-2xl leading-6 mr-4 ml-4 2xl:mr-6 2xl:ml-6 cursor-pointer font-normal lg:font-medium hover:scale-110 transition whitespace-nowrap flex items-center bg-transparent border-none"
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
            <Link
              to="/login"
              className="text-white lg:text-base text-2xl cursor-pointer font-normal lg:font-medium whitespace-nowrap flex items-center"
              aria-label="Iniciar sesión"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/register"
              className="text-sm text-white bg-primary-color hover:bg-primary-color/80 px-4 py-2 ps-6 rounded-full flex items-center gap-2 transition whitespace-nowrap"
              aria-label="Registrarse"
            >
              Registrarse
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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