import PropTypes from 'prop-types';
import Pagination from '@/components/Pagination/Pagination';
import React, { useEffect, useState } from 'react';
import './KardexTable.css';
const TablaKardex = ({ kardex }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const handleSelectClick = () => {
    // Implement the select click handler logic
  };
  // Función para obtener las notas que se deben mostrar en la página actual
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return kardex.slice(startIndex, endIndex);
  };

  const handleDetailClick = (id) => {
    window.open(`/almacen/kardex/historico/${id}`, '_blank');
  };

  // Número total de páginas
  const totalPages = Math.ceil(kardex.length / itemsPerPage);
  const renderEntradaRow = (kardex) => (
    <tr key={kardex.id} onClick={() => handleDetailClick(kardex.codigo)} className='tr-tabla-kardex'>
      <td className="text-center px-2">{kardex.codigo}</td>
      <td
        className={`text-center px-2 ${kardex.stock === 0 ? 'text-red-500' : ''}`}
      >
        {kardex.descripcion}
      </td>
      <td className="text-center px-2">{kardex.marca}</td>
      <td className="text-center px-2">{kardex.stock}</td>
      <td className="text-center px-2">{kardex.um}</td>
    </tr>
  );

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">CÓDIGO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">DESCRIPCIÓN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">MARCA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">STOCK ACTUAL</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">UM</th>
          </tr>
        </thead>
        <tbody>
          {getCurrentPageItems().map(renderEntradaRow)}
        </tbody>
      </table>
      <div className="flex justify-between mt-4">
        <div className="flex">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />

        </div>
        <select
          id="itemsPerPage"
          className="input-c cant-pag-c pr-8 border-gray-300 bg-gray-50 rounded-lg"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={5}>05</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>

      </div>
    </div>
  );
};

TablaKardex.propTypes = {
  kardex: PropTypes.array.isRequired,
};

export default TablaKardex;
