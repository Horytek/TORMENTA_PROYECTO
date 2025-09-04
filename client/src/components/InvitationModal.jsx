import { motion, AnimatePresence } from "framer-motion";
import { CheckArrowIcon } from "../assets/icons/CheckArrowIcon";
import { CloseIcon } from "../assets/icons/CloseIcon";
import { HoryCoreLogo } from "../assets/logos/HoryCoreLogo";

const InvitationModal = ({ setIsOpen }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0, zIndex: 50 }}
      animate={{ opacity: 1, zIndex: 50 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.1 }}
    >
      <div
        className="fixed inset-0 bg-bgDarkTransparentDarker flex justify-center items-center z-50"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="relative w-full h-screen sm:h-auto sm:w-3/4 md:w-3/5 lg:w-[1000px] xl:w-[1100px] sm:rounded-2xl bg-bgDarkTransparentLighter main-border-gray-darker py-12 px-8 sm:px-16 backdrop-blur-xl mx-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex relative">
            {/* Lado izquierdo (solo en desktop) */}
            <div className="w-1/2 hidden lg:flex flex-col">
              <h2 className="mt-6 mb-2 text-5xl font-bold tracking-normal text-primary-text">
                Subscribe Right Now
              </h2>
              <h2 className="text-5xl font-bold tracking-normal text-secondary-color">
                Winter is coming
              </h2>
              <ul className="mb-6 text-primary-text mt-12">
                <li className="mb-4 flex items-center gap-2">
                  <CheckArrowIcon />
                  <span>Vestibulum viverra</span>
                </li>
                <li className="mb-4 flex items-center gap-2">
                  <CheckArrowIcon />
                  <span>Morbi mollis metus pretium</span>
                </li>
                <li className="mb-4 flex items-center gap-2">
                  <CheckArrowIcon />
                  <span>Etiam lectus nunc, commodo</span>
                </li>
              </ul>
            </div>
            {/* Lado derecho */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center pt-24 sm:pt-0">
              {/* Logo solo en mobile */}
              <div className="flex lg:hidden items-center mb-8 pr-6">
                <div className="text-white mr-2 text-8xl">
                  <HoryCoreLogo />
                </div>
                <div className="text-white font-['Inter'] font-bold text-3xl">
                  HoryCore
                </div>
              </div>
              <h3 className="mb-7 text-2xl text-primary-text font-bold leading-snug text-center">
                Join 3,953 other developers
              </h3>
              <div className="flex flex-wrap -m-2 w-full justify-center">
                <div className="w-full sm:w-4/5 p-2 mx-auto">
                  <input
                    className="px-4 py-4 w-full text-gray-500 font-medium text-center placeholder-gray-500 outline-none border bg-gray-300 border-gray-300 rounded-lg focus:ring focus:ring-indigo-300"
                    id="newsletterInput3-1"
                    type="text"
                    placeholder="Your email address"
                  />
                </div>
                <div className="w-full sm:w-4/5 p-2 mt-4 mx-auto">
                  <button
                    className="py-4 px-6 w-full text-primary-text font-semibold rounded-xl shadow-4xl focus:ring focus:ring-indigo-300 bg-primaryColor hover:bg-[#7274f3] transition ease-in-out duration-200"
                    type="button"
                    aria-label="Join now"
                  >
                    Join Now
                  </button>
                </div>
              </div>
            </div>
            {/* Botón cerrar */}
            <button
              className="fixed top-6 right-6 z-50 w-5 h-5 cursor-pointer text-[rgb(255,255,255,0.7)] hover:text-white transition"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar"
              type="button"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  </AnimatePresence>
);

export default InvitationModal;