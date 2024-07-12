import PropTypes from 'prop-types';

function Breadcrumb({ paths }) {
  return (
    // Contenedor nav para el breadcrumb con etiqueta aria-label para accesibilidad
    <nav className="flex m-0 p-0" aria-label="Breadcrumb">
      {/* Lista ordenada para los elementos del breadcrumb */}
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {paths.map((path, index) => (
          // Cada elemento del breadcrumb
          <li key={path.href} className="inline-flex items-center" style={{margin: '0px'}}>
            {/* Renderiza el separador (icono) solo si no es el primer elemento */}
            {index > 0 && (
              <svg
                className="w-3 h-3 text-gray-400 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 14.707a1 1 0 010-1.414L13.586 10 10.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {/* Enlace para cada elemento del breadcrumb */}
            <a
              href={path.href}
              // Determina las clases basadas en la posición del elemento en el arreglo
              className={`text-lg font-bold ${index === paths.length - 1 ? 'text-gray-500' : 'text-black hover:text-blue-700'}`}
            >
              {path.name}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Definición de los tipos de propiedades esperadas para paths
Breadcrumb.propTypes = {
  paths: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Breadcrumb;
