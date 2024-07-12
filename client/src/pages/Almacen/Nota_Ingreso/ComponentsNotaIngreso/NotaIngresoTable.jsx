import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaCaretDown } from "react-icons/fa";


const TablaIngresos = ({ ingresos, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
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
        <td>
          <select  name="select">
            <option value=""><FaCaretDown /></option>
            <option value="value1">Imprimir</option>
            <option className={`ml-2 cursor-pointer ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => openModal(ingreso.id)}  value="value2" selected>Anular</option>
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
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CODIGO</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">LINEA</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">UM</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">PRECIO</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">ALMACÉN</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">BAR</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  <td>{detalle.codigo}</td>
                  <td>{detalle.linea}</td>
                  <td>{detalle.descripcion}</td>
                  <td>{detalle.cantidad}</td>
                  <td>{detalle.um}</td>
                  <td>{detalle.precio}</td>
                  <td>{detalle.total}</td>
                  <td>{detalle.almacen}</td>
                  <td>{detalle.bar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );



  return (
    <div className="container-table-ingreso px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOCUMENTO</th>
            <th className="w-1/6 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PROVEEDOR</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CONCEPTO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ORDEN COMPRA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FACTURA</th>
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
  modalOpen: PropTypes.bool.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default TablaIngresos;