import React from 'react';
import PropTypes from 'prop-types';

const TablaKardex = ({ ingresos }) => {

  const handleSelectClick = () => {
    // Implement the select click handler logic
  };

  const renderEntradaRow = (ingreso) => (
    <tr key={ingreso.id} className='tr-tabla-kardex'>
      <td className="text-center px-2">{ingreso.codigo}</td>
      <td className="text-center px-2">{ingreso.descripcion}</td>
      <td className="text-center px-2">{ingreso.marca}</td>
      <td className="text-center px-2">{ingreso.stockActual}</td>
      <td className="text-center px-2">{ingreso.cantidad}</td>
      <td className="text-center px-2">{ingreso.um}</td>
      <td className="text-center px-2">{ingreso.smin}</td>
      <td className="text-center px-2">{ingreso.transito}</td>
      <td className="text-center px-2">NOT</td>
      <td className='text-center px-2'>
        <select className='b text-center custom-select border border-gray-300 rounded-lg p-1.5 text-gray-900 text-sm rounded-lg' name="select" onClick={handleSelectClick} defaultValue="">
          <option value="">Seleccione...</option>
          <option value="value1">Imprimir</option>
          <option value="value2">Anular</option>
          <option value="value3">Clonar</option>
        </select>
      </td>
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
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">CANTIDAD</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">UM</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">S.MIN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">TRÁNSITO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">BARRA</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider px-2">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {ingresos.map(renderEntradaRow)}
        </tbody>
      </table>
    </div>
  );
};

TablaKardex.propTypes = {
  ingresos: PropTypes.array.isRequired,
};

export default TablaKardex;
