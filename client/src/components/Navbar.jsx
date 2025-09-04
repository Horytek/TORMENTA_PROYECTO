import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { HoryCoreLogo } from "../assets/logos/HoryCoreLogo";
import { GithubIcon } from "../assets/icons/GithubIcon";

const navbarLinks = [
  { label: "Inicio", href: "/#home", ariaLabel: "Inicio" },
  { label: "Características", href: "/#features", ariaLabel: "Características" },
  { label: "Precios", href: "/#pricing", ariaLabel: "Precios" },
  { label: "Opiniones", href: "/#feedback", ariaLabel: "Opiniones de clientes" },
  { label: "Preguntas frecuentes", href: "/#FAQ", ariaLabel: "Preguntas frecuentes" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav
        className="w-full h-20 flex flex-col justify-center items-center fixed bg-bgDark1 lg:bg-bgDarkTransparent z-40 lg:backdrop-blur-xl"
        aria-label="Main navigation"
      >
        <div className="2xl:w-[1280px] xl:w-10/12 w-11/12 flex justify-between items-center relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: 0 }}
          >
            <a href="/#inicio" aria-label="Inicio">
              <div className="flex justify-start items-center grow basis-0">
                <div className="text-white mr-2 text-6xl">
                  <HoryCoreLogo />
                </div>
                <div className="text-white font-['Inter'] font-bold text-xl">
                  HoryCore
                </div>
              </div>
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            exit={{ opacity: 0 }}
          >
            <div className="hidden lg:flex h-full pl-12 pb-2">
              {navbarLinks.map(({ href, label, ariaLabel }) => (
                <a
                  className="text-white lg:text-base text-2xl  leading-6 mr-4 ml-4   2xl:mr-6 2xl:ml-6 cursor-pointer font-normal lg:font-medium hover:scale-110 transition h-full pt-2"
                  href={href}
                  aria-label={ariaLabel}
                  key={label}
                >
                  {label}
                </a>
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
            <a
              href="#login"
              className="text-white lg:text-base text-2xl cursor-pointer font-normal lg:font-medium" 
              aria-label="Iniciar sesión"
            >
              Iniciar sesión
            </a>

            <a
              href="#registrar"
              className="text-sm text-white bg-primary-color hover:bg-primary-color/80 px-4 py-2 ps-6 rounded-full flex items-center gap-2 transition"
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
            </a>
          </div>

          </motion.div>
          <div
            className="lg:hidden flex flex-col  px-2 py-3 border-solid border border-gray-600 rounded-md cursor-pointer hover:bg-bgDark2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="w-5 h-0.5 bg-gray-500  mb-1"></div>
            <div className="w-5 h-0.5 bg-gray-500  mb-1"></div>
            <div className="w-5 h-0.5 bg-gray-500 "></div>
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
                className="flex flex-col mt-16 lg:hidden absolute top-4 left-0 bg-bgDark1 z-50 w-full 
                items-center gap-6 pb-10 border-y border-solid border-bgDark3 pt-10"
              >
                {navbarLinks.map(({ label, href, ariaLabel }) => (
                  <a
                    key={href}
                    className="text-white text-xl font-medium hover:scale-105 transition duration-300"
                    href={href}
                    onClick={() => setIsOpen(false)}
                    aria-label={ariaLabel}
                  >
                    {label}
                  </a>
                ))}

                <a href="/login"
                  className="text-white outlined-button px-6 py-2 text-lg mt-4"
                  aria-label="Iniciar sesión">
                  Iniciar sesión
                </a>
                <a
                  href="/registro"
                  className="text-white bg-primaryColor hover:bg-primaryColor/80 border border-primaryColor rounded-xl px-6 py-2 text-lg"
                  aria-label="Registrarse"
                >
                  Registrarse
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <style jsx>{`
        .outlined-button {
          color: rgb(255,255,255);
          border: 1px solid rgb(255,255,255,0.15);
          border-radius: 0.75rem;
          background-color: rgb(38, 39, 43);
          font-size: 0.875rem;
          transition: background-color 0.15s ease-in-out;
        }

        .outlined-button:hover {
          background-color: rgb(48, 49, 54);
        }
      `}</style>
    </>
  );
};

export default Navbar;