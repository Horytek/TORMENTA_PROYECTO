import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { MdDeleteForever } from 'react-icons/md';
import { IoIosCloudDone } from 'react-icons/io';

const TablaVentas = ({ ventas, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderVentaRow = (venta) => (
    <React.Fragment key={venta.id}>
      <tr onClick={() => toggleRow(venta.id)} className='tr-tabla-venta'>
        <td className="font-bold text-center">
          <div>{venta.serieNum}</div>
          <div className="text-gray-500">{venta.num}</div>
        </td>
        <td className="text-center">
          <span className={`px-4 py-2 rounded-full ${getTipoComprobanteClass(venta.tipoComprobante)} text-white`}>
            {venta.tipoComprobante}
          </span>
        </td>
        <td className="font-bold">
          <div>{venta.cliente}</div>
          <div className="text-gray-500">{venta.ruc}</div>
        </td>
        <td className="text-center">{venta.fechaEmision}</td>
        <td className="text-center">{venta.igv}</td>
        <td className="text-center">{venta.total}</td>
        <td className="font-bold">
          <div>{venta.cajero}</div>
          <div className="text-gray-500">{venta.cajeroId}</div>
        </td>
        <td className="text-center" style={{ color: venta.estado === 'Activo' ? '#1DD75BFF' : 'red' }}>
          <div className="flex items-center justify-around">
            <IoIosCloudDone className="inline-block" style={{ fontSize: '20px' }} />
            <span>{venta.estado}</span>
          </div>
        </td>
        <td>
          <MdDeleteForever
            className={`ml-2 cursor-pointer ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ fontSize: '25px', color: 'red' }}
            onClick={() => openModal(venta.id)}
          />
        </td>
      </tr>
      {expandedRow === venta.id && renderVentaDetails(venta.detalles)}
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
                <th className="w-1/3 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">NOMBRE</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">PRECIO</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCUENTO</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">IGV</th>
                <th className="w-1/12 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  <td className="font-bold text-center">{detalle.codigo}</td>
                  <td className="font-bold">{detalle.nombre}</td>
                  <td className="text-center">{detalle.cantidad}</td>
                  <td>{detalle.precio}</td>
                  <td>{detalle.descuento}</td>
                  <td>{detalle.igv}</td>
                  <td>{detalle.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );

  const getTipoComprobanteClass = (tipoComprobante) => {
    switch (tipoComprobante) {
      case 'Factura':
        return 'bg-orange-500';
      case 'Boleta':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="container-table-venta px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">SERIE/NUM</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TIPO.COMP</th>
            <th className="w-1/6 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CLIENTE</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">F. EMISIÓN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">IGV</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
            <th className="w-1/6 text-start text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CAJERO</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody>
          {ventas.map(renderVentaRow)}
        </tbody>
      </table>
    </div>
  );
};

TablaVentas.propTypes = {
  ventas: PropTypes.array.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default TablaVentas;