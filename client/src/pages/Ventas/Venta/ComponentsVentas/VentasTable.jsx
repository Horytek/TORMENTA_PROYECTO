import React from 'react';
import PropTypes from 'prop-types';
import { MdDeleteForever } from 'react-icons/md';
import { IoIosCloudDone } from 'react-icons/io';
import { useState } from 'react';

const TablaVentas = ({ ventas, modalOpen, deleteOptionSelected, openModal /*, currentPage */ }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="container-table-venta px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr >
            <th className="w-1/12">SERIE/NUM</th>
            <th className="w-1/6">TIPO.COMP</th>
            <th className="w-1/8" style={{ textAlign: 'start' }}>
              CLIENTE
            </th>
            <th className="w-1/8">F. EMISIÓN</th>
            <th className="w-1/8">IGV</th>
            <th className="w-1/8">TOTAL</th>
            <th className="w-1/8" style={{ textAlign: 'start' }}>
              CAJERO
            </th>
            <th className="w-1/8">ESTADO</th>
            <th className="w-2/8"> </th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => (
            <React.Fragment key={venta.id}>
              <tr onClick={() => toggleRow(venta.id)} className='tr-tabla-venta'>
                <td style={{ textAlign: 'center' }} className="font-bold">
                  <div>{venta.serieNum}</div>
                  <div className="text-gray-500 ">{venta.num}</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span
                    className={`px-4 py-2 rounded-full ${venta.tipoComprobante === 'Factura'
                      ? 'bg-orange-500'
                      : venta.tipoComprobante === 'Boleta'
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                      } text-white`}
                  >
                    {venta.tipoComprobante}
                  </span>
                </td>
                <td className="font-bold">
                  <div>{venta.cliente}</div>
                  <div className="text-gray-500">{venta.ruc}</div>
                </td>
                <td style={{ textAlign: 'center' }}>{venta.fechaEmision}</td>
                <td style={{ textAlign: 'center' }}>{venta.igv}</td>
                <td style={{ textAlign: 'center' }}>{venta.total}</td>
                <td className="font-bold">
                  <div>{venta.cajero}</div>
                  <div className="text-gray-500">{venta.cajeroId}</div>
                </td>
                <td style={{ textAlign: 'center', color: venta.estado === 'Activo' ? '#1DD75BFF' : 'red' }}>
                  <div className="flex items-center justify-around">
                    <IoIosCloudDone className="inline-block items-center" style={{ fontSize: '20px' }} />
                    <span>{venta.estado}</span>
                  </div>
                </td>
                <td>
                  <MdDeleteForever
                    className={`ml-2 cursor-pointer ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    style={{ fontSize: '25px', color: 'red' }}
                    onClick={() => openModal(venta.id)}
                  />
                </td>
              </tr>
              {expandedRow === venta.id && (
                <tr className="bg-gray-100" >
                  <td colSpan="9">
                    <div className="container-table-details px-4">
                      <table className="table-details w-full">
                        <thead>
                          <tr>
                            <th className="w-1/6">CODIGO</th>
                            <th className="w-1/4" style={{ textAlign: 'start' }}>NOMBRE</th>
                            <th className="w-2/12">CANTIDAD</th>
                            <th className="w-1/6">PRECIO</th>
                            <th className="w-1/6">DESCUENTO</th>
                            <th className="w-1/6">IGV</th>
                            <th className="w-1/6">SUBTOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {venta.detalles.map((detalle, index) => (
                            <tr key={index}>
                              <td style={{ textAlign: 'center' }} className="font-bold">{detalle.codigo}</td>
                              <td className="font-bold">{detalle.nombre}</td>
                              <td style={{ textAlign: 'center' }}>{detalle.cantidad}</td>
                              <td >{detalle.precio}</td>
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
              )}
            </React.Fragment>
          ))}
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
