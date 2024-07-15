import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TablaIngresos = ({ ingresos }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleSelectClick = (event) => {
    event.stopPropagation(); // Evita la propagación del clic al tr de la tabla
  };

  const getEstadoClassName = (estado) => {
    switch (estado.toLowerCase()) {
      case 'activo':
        return 'estado-activo';
      case 'inactivo':
        return 'estado-inactivo';
      default:
        return '';
    }
  };

  const renderIngresoRow = (ingreso) => (
    <React.Fragment key={ingreso.id}>
      <tr onClick={() => toggleRow(ingreso.id)} className='tr-tabla-ingreso'>
        <td className="text-center">{ingreso.fecha}</td>
        <td className="text-center">{ingreso.documento}</td>
        <td className="text-center">{ingreso.proveedor}</td>
        <td className="text-center">{ingreso.concepto}</td>
        <td className="text-center">{ingreso.oCompra}</td>
        <td className="text-center">{ingreso.factura}</td>
        <td className="text-center">
          <p className={getEstadoClassName(ingreso.estado)}>
            {ingreso.estado}
          </p>
        </td>
        <td className='text-center'>
          <select className='b text-center custom-select border border-gray-300 rounded-lg p-1.5 text-gray-900 text-sm rounded-lg' name="select" onClick={handleSelectClick}>
            <option value="" selected>Seleccione...</option>
            <option value="value1">Imprimir</option>
            <option value="value2">Anular</option>
            <option value="value3">Clonar</option>
          </select>
        </td>
      </tr>
      {expandedRow === ingreso.id && renderVentaDetails(ingreso.detalles)}
    </React.Fragment>
  );

  const renderVentaDetails = (detalles) => (
    <tr className="bg-gray-100">
      <td colSpan="9">
        <div className="container-table-details px-4">
          <table className="table-details w-full">
            <thead>
              <tr>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Línea</th>
                <th className="w-3/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">UM</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Almacén</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">Bar</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  <td className="text-center py-2 px-4">{detalle.codigo}</td>
                  <td className="text-center py-2 px-4">{detalle.linea}</td>
                  <td className="text-center py-2 px-4">{detalle.descripcion}</td>
                  <td className="text-center py-2 px-4">{detalle.cantidad}</td>
                  <td className="text-center py-2 px-4">{detalle.um}</td>
                  <td className="text-center py-2 px-4">{detalle.precio}</td>
                  <td className="text-center py-2 px-4">{detalle.total}</td>
                  <td className="text-center py-2 px-4">{detalle.almacen}</td>
                  <td className="text-center py-2 px-4">{detalle.bar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOCUMENTO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PROVEEDOR</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CONCEPTO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ORDEN COMPRA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FACTURA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {ingresos.map(renderIngresoRow)}
        </tbody>
      </table>
    </div>
  );
};

TablaIngresos.propTypes = {
  ingresos: PropTypes.array.isRequired,
};

export default TablaIngresos;
