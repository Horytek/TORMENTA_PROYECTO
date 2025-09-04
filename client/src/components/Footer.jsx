import { FacebookIcon } from "../assets/icons/FacebookIcon";
import { InstagramIcon } from "../assets/icons/InstagramIcon";
import { HoryCoreLogo } from "../assets/logos/HoryCoreLogo";
import { TwitterIcon } from "../assets/icons/TwitterIcon";

const footerData = [
  {
    title: "Productos",
    items: ["Servicios", "Sobre nosotros", "Noticias e historias", "Hoja de ruta"],
  },
  {
    title: "Enlaces importantes",
    items: [
      "Equipo de la organización",
      "Nuestros recorridos",
      "Planes de precios",
      "Hoja de ruta",
      "Términos y condiciones",
      "Política de privacidad",
    ],
  },
  {
    title: "Compañía",
    items: ["Sobre nosotros", "Empleos", "Prensa", "Contáctanos"],
  },
];

const Footer = () => {
  return (
    <footer aria-label="Site footer">
      <div className="pt-10  lg:pt-20 lg:pb-16 bg-bgDark1 radius-for-skewed ">
        <div className="container mx-auto px-4 w-4/5 md:w-11/12 lg:w-10/12 xl:w-4/5 2xl:w-2/3">
          <div className="flex flex-wrap">
            <div className="w-full lg:w-1/3 mb-16 lg:mb-0">
              <div className="flex justify-center lg:justify-start items-center grow basis-0">
                <div className="text-white mr-2 text-6xl">
                  <HoryCoreLogo />
                </div>
                <div className="text-white font-['Inter'] font-bold text-xl">
                  HoryCore
                </div>
              </div>
              <p className="mb-10 mt-4 sm:w-[22rem] lg:w-[20rem] xl:w-[24rem] content-text-gray leading-loose text-center lg:text-left mx-auto lg:mx-0 lg:pe-4">
                En HoryTek creemos que la tecnología debe ser una aliada en el crecimiento de las empresas. Con HoryCore, nuestro ERP empresarial, ayudamos a las organizaciones a gestionar mejor sus recursos y avanzar hacia el horizonte de la transformación digital.
              </p>
              <div className="w-36 mx-auto lg:mx-0">
                <a
                  className="inline-block w-10  h-10 mr-2 p-2 pt-[0.55rem] outlined-button"
                  href="#"
                  aria-label="Facebook"
                >
                  <FacebookIcon />
                </a>
                <a
                  className="inline-block w-10  h-10 mr-2 p-2 pt-[0.55rem] pl-[0.55rem] outlined-button"
                  href="#"
                  aria-label="Twitter"
                >
                  <TwitterIcon />
                </a>
                <a
                  className="inline-block w-10  h-10 mr-2 p-2 pt-[0.55rem] pl-[0.55rem] outlined-button"
                  href="#"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
              </div>
            </div>
            <div className="w-full lg:w-2/3  lg:pl-16 hidden lg:flex flex-wrap justify-between">
              <div className="w-full md:w-1/3 lg:w-auto mb-16 md:mb-0">
                <h3 className="mb-6 text-2xl font-bold text-primaryText">Productos</h3>
                <ul>
                  {footerData[0].items.map((item, index) => (
                    <li key={`${item}-${index}`} className="mb-4">
                      <a
                        className="content-text-gray hover:content-text-white"
                        href="#"
                        aria-label={item}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full md:w-1/3 lg:w-auto mb-16 md:mb-0">
                <h3 className="mb-6 text-2xl font-bold text-primaryText">
                  Enlaces importantes
                </h3>
                <ul>
                  {footerData[1].items.map((item, index) => (
                    <li key={`${item}-${index}`} className="mb-4">
                      <a
                        className="content-text-gray hover:content-text-white"
                        href="#"
                        aria-label={item}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full md:w-1/3 lg:w-auto">
                <h3 className="mb-6 text-2xl font-bold text-primaryText">Compañía</h3>
                <ul>
                  {footerData[2].items.map((item, index) => (
                    <li key={`${item}-${index}`} className="mb-4">
                      <a
                        className="content-text-gray hover:content-text-white"
                        href="#"
                        aria-label={item}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .block-title {
          color: rgb(255,255,255);
          font-size: 1.875rem;
          font-weight: 700;
          letter-spacing: normal;
        }
        .content-text-gray {
          color: rgb(156, 163, 175);
          font-size: 1rem;
        }
        .content-text-white {
          color: rgb(255,255,255);
          font-size: 1rem;
          line-height: 1.625;
        }
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
    </footer>
  );
};

export default Footer;