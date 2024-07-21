import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MdEdit, MdDeleteForever } from 'react-icons/md';
import { IoIosCloudDone } from 'react-icons/io';
import { FaTrash } from 'react-icons/fa';

const TablaGuias = ({ guias, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleOpenConfirmationModal = (row) => {
    // Lógica para manejar la apertura del modal de confirmación
    openModal(row.id); // Por ejemplo
  };

  const renderActions = (row) => (
    <div className="flex justify-center items-center">
      <button className="px-2 py-1 text-yellow-400 text-xl" onClick={() => openModal('Editar Producto')}>
        <MdEdit />
      </button>
      <button className="px-2 py-1 text-red-500" onClick={() => handleOpenConfirmationModal(row)}>
        <FaTrash />
      </button>
    </div>
  );

  const renderGuiaRow = (guia) => (
    <React.Fragment key={guia.id}>
      <tr onClick={() => toggleRow(guia.id)} className='tr-tabla-guia'>
        <td className="text-center">{guia.fecha}</td>
        <td className="text-center">{guia.num_guia}</td>
        <td className="text-center">{guia.cliente}</td>
        <td className="text-center">{guia.vendedor}</td>
        <td className="text-center">{guia.docventa}</td>
        <td className="text-center">{guia.total}</td>
        <td className="text-center">{guia.concepto}</td>
        <td className="text-center " style={{ color: guia.estadosun === 'Activo' ? '#117B34FF' : '#E05858FF', fontWeight: "400" }} >
          <div className='ml-2 px-2.5 py-1.5 rounded-full ' style={{ background: guia.estadosun === 'Activo' ? 'rgb(191, 237, 206)' : '#F5CBCBFF' }}>
            <span>{guia.estadosun}</span>
          </div>
        </td>


        <td className="text-center">
          {renderActions(guia)}
        </td>
      </tr>
      {expandedRow === guia.id && renderGuiaDetails(guia.detalles)}
    </React.Fragment>
  );

  const renderGuiaDetails = (detalles) => (
    <tr className="bg-gray-100">
      <td colSpan="10">
        <div className="container-table-details px-4">
          <table className="table-details w-full">
            <thead>
              <tr>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CÓDIGO</th>
                <th className="w-1/12 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">UM</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PRECIO</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ALMACÉN</th>
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
                  <td className="text-center">{detalle.almacen}</td>
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
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CLIENTE</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">VENDEDOR</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOC VENTA</th>
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
