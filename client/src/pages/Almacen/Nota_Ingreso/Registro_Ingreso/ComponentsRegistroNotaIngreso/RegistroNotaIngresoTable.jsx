import React from 'react';
import PropTypes from 'prop-types';
import { MdDelete } from "react-icons/md";

const RegistroTablaIngreso = ({ ingresos }) => {

  const renderEntradaRow = (ingreso) => (
    <tr key={ingreso.id} className='tr-tabla-ingreso'>
      <td className="text-center">{ingreso.codigo}</td>
      <td className="text-center">{ingreso.descripcion}</td>
      <td className="text-center">{ingreso.marca}</td>
      <td className="text-center">{ingreso.stockActual}</td>
      <td className="text-center">{ingreso.cantidad}</td>
      <td className="text-center">
        <div className="flex justify-center items-center">
          <MdDelete className="w-4 h-4 text-red-500" />
        </div>
      </td>
    </tr>
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
          {ingresos.map(renderEntradaRow)}
        </tbody>
      </table>
    </div>
  );
};

RegistroTablaIngreso.propTypes = {
  ingresos: PropTypes.array.isRequired,
};

export default RegistroTablaIngreso;
