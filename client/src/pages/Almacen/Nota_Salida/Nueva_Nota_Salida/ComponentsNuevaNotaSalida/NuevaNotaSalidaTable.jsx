import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoIosArrowDropdown } from "react-icons/io";
import { MdDelete } from "react-icons/md";

const NuevaTablaSalida = ({ salidas, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  const handleSelectClick = (event) => {
    event.stopPropagation(); // Evita la propagación del clic al tr de la tabla
  };

  const renderSalidaRow = (salida) => (
    <React.Fragment key={salida.id}>
      <tr className='tr-tabla-salida'>
        <td className="text-center">{salida.codigo}</td>
        <td className="text-center">{salida.descripcion}</td>
        <td className="text-center">{salida.marca}</td>
        <td className="text-center">{salida.stockActual}</td>
        <td className="text-center">{salida.cantidad}</td>
        <td className="text-center">
          <div className="flex justify-center items-center">
            <MdDelete className="w-4 h-4 text-red-500" />
          </div>
        </td>

      </tr>
      {expandedRow === salida.id && renderVentaDetails(salida.detalles)}
    </React.Fragment>
  );





  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CÓDIGO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">STOCK ACTUAL</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {salidas.map(renderSalidaRow)}
        </tbody>
      </table>
    </div>
  );
};

NuevaTablaSalida.propTypes = {
  salidas: PropTypes.array.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default NuevaTablaSalida;