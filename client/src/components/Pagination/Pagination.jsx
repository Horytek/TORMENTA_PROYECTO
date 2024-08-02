// Pagination.jsx

import PropTypes from 'prop-types';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Función para manejar el cambio de página
  const handleClick = (page) => {
    onPageChange(page);
  };

  // Crear un array con números de página
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
      <a
        href="#"
        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-200 focus:z-20 focus:outline-offset-0 ${
          currentPage === 1 ? 'pointer-events-none opacity-50' : ''
        }`}
        onClick={() => handleClick(currentPage - 1)}
      >
        <span className="sr-only">Previous</span>
        <FaChevronLeft aria-hidden="true" className="h-5 w-5" />
      </a>
      {pages.map((page) => (
        <a
          key={page}
          href="#"
          className={`relative ${
            page === currentPage
              ? 'z-10 bg-blue-600 text-white focus:outline focus:ring-2 focus:bg-blue-600 focus:ring-opacity-50'
              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-200'
          } inline-flex items-center px-4 py-2 text-sm font-semibold`}
          onClick={() => handleClick(page)}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </a>
      ))}
      <a
        href="#"
        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-200 focus:z-20 focus:outline-offset-0 ${
          currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
        }`}
        onClick={() => handleClick(currentPage + 1)}
      >
        <span className="sr-only">Next</span>
        <FaChevronRight aria-hidden="true" className="h-5 w-5" />
      </a>
    </nav>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
