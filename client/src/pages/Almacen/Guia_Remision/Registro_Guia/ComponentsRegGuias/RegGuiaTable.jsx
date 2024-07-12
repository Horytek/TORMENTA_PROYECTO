import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TablaRegGuia = () => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table-custom w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CÓDIGO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</th>
            <th className="w-1/6 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">UM</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PRECIO</th>
            <th className="w-1/6 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {/* Añadimos filas vacías */}
          {[...Array(4)].map((_, index) => (
            <tr key={index}>
              <td className="text-center">&nbsp;</td>
              <td className="text-center">&nbsp;</td>
              <td className="text-center">&nbsp;</td>
              <td className="text-center">&nbsp;</td>
              <td className="text-center">&nbsp;</td>
              <td className="text-center">&nbsp;</td>
              <td className="text-center">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
      <style jsx>{`
        .table-custom {
          width: 100%;
          border-collapse: collapse;
          background-color: #f9f9f9;
        }
        .table-custom th, .table-custom td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        .table-custom th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default TablaRegGuia;
