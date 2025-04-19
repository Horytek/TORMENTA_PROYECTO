import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

function Breadcrumb({ paths }) {
  return (
    <nav className="flex m-0 p-0" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {paths.map((path, index) => (
          <li key={path.href} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-2"
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
            {index === 0 && (
              <svg
                className="w-4 h-4 mr-2 text-gray-700"
                fill="currentColor" 
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <Link
              to={path.href}
              className={`text-lg font-bold ${
                index === paths.length - 1
                  ? 'text-gray-500'
                  : 'text-black hover:text-blue-700'
              }`}
            >
              {path.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

Breadcrumb.propTypes = {
  paths: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      href: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Breadcrumb;
