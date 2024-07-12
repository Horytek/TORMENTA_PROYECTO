import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MdDeleteForever } from 'react-icons/md';
import { IoIosCloudDone } from 'react-icons/io';

const TablaGuias = ({ guias, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderGuiaRow = (guia) => (
    <React.Fragment key={guia.id}>
      <tr onClick={() => toggleRow(guia.id)} className='tr-tabla-guia'>
        <td className="text-center">{guia.fecha}</td>
        <td className="text-center">{guia.num_guia}</td>
        <td className="text-center">{guia.cliente}</td>
        <td className="text-center">{guia.vendedor}</td>
        <td className="text-center">{guia.docventa}</td>
        <td className="text-center">{guia.moneda}</td>
        <td className="text-center">{guia.total}</td>
        <td className="text-center">{guia.concepto}</td>
        <td className="text-center" style={{ color: guia.estadosun === 'Activo' ? '#1DD75BFF' : 'red' }}>
          <div className="items-center justify-around">
            <IoIosCloudDone className="inline-block" style={{ fontSize: '20px' }} />
            <span>{guia.estadosun}</span>
          </div>
        </td>
        <td className="text-center">
          <MdDeleteForever
            className={`ml-2 cursor-pointer ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ fontSize: '25px', color: 'red' }}
            onClick={() => openModal(guia.id)}
          />
        </td>
      </tr>
      {expandedRow === guia.id && renderGuiaDetails(guia.detalles)}
    </React.Fragment>
  );

  const renderGuiaDetails = (detalles) => (
    <tr className="bg-gray-100">
      <td colSpan="9">
        <div className="container-table-details px-4">
          <table className="table-details w-full">
            <thead>
              <tr>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CODIGO</th>
                <th className="w-1/12 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCION</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">UM</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PRECIO</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ALMACEN</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  <td className="font-bold text-center">{detalle.codigo}</td>
                  <td className="font-bold">{detalle.marca}</td>
                  <td className="text-center">{detalle.descripcion}</td>
                  <td className="text-center">{detalle.cantidad}</td>
                  <td className="text-center">{detalle.um}</td>
                  <td className="text-center">{detalle.precio}</td>
                  <td className="text-center">{detalle.total}</td>
                  <td className="text-center"> {detalle.almacen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="container-table-guia px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">NUM GUIA</th>
            <th className="w-1/7 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CLIENTE</th>
            <th className="w-1/7 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">VENDEDOR</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOC VENTA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MONEDA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CONCEPTO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {guias.map(renderGuiaRow)}
        </tbody>
      </table>
    </div>
  );
};

TablaGuias.propTypes = {
  guias: PropTypes.array.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default TablaGuias;