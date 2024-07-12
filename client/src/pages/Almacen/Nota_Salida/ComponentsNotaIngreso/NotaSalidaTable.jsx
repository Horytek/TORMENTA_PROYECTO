import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaCaretDown } from "react-icons/fa";


const TablaSalida = ({ salidas, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
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
  const renderSalidaRow = (salida) => (
    <React.Fragment key={salida.id}>
      <tr onClick={() => toggleRow(salida.id)} className='tr-tabla-salida'>
        <td className="text-center">{salida.fecha}</td>
        <td className="text-center">{salida.documento}</td>
        <td className="text-center">{salida.proveedor}</td>
        <td className="text-center">{salida.total}</td>
        <td className="text-center">{salida.concepto}</td>
        <td className="text-center"><p className='estado-activo'> {salida.estado}</p></td>
        <td>
          <select className='b custom-select' name="select">
            <option value=""><FaCaretDown /></option>
            <option value="value1">Imprimir</option>
            <option className={`ml-2 cursor-pointer ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => openModal(salida.id)}  value="value2" selected>Anular</option>
            <option value="value3">Clonar</option>
            </select>
        </td>
      </tr>
      {expandedRow === salida.id && renderVentaDetails(salida.detalles)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );



  return (
    <div className="container-table-salida px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOCUMENTO</th>
            <th className="w-1/6 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PROVEEDOR</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CONCEPTO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
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

TablaSalida.propTypes = {
  salidas: PropTypes.array.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default TablaSalida;