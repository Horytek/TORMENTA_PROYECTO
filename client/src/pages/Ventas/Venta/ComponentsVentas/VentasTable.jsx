import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from "react-icons/io";

const TablaVentas = ({ ventas, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id,estado,venta) => {
    setExpandedRow(expandedRow === id ? null : id);

    if (estado=='En proceso') {
      estado= 2;
    } else if (estado=='Anulada') {
      estado= 1;
    } else if (estado=='Aceptada') {
      estado= 0;
    }

    const datos_venta= {
      id:id,
      serieNum:venta.serieNum,
      num:venta.num,
      tipoComprobante:venta.tipoComprobante,
      estado:estado,
      igv:venta.igv,
      nombre: venta.cliente,
      documento: venta.ruc,
      fechaEmision:venta.fecha_iso,
    }

    localStorage.setItem('ventas', JSON.stringify(datos_venta));

    const saveDetallesToLocalStorage = () => {
      localStorage.setItem('new_detalle', JSON.stringify(venta.detalles));
    };
  
    saveDetallesToLocalStorage();


    const datosClientes = {
      nombre: venta.cliente,
      documento: venta.ruc,
  };

  const saveDetallesToLocalStorage1 = () => {
      localStorage.setItem('datosClientes', JSON.stringify({datosClientes}));
    };
    saveDetallesToLocalStorage1();
  };
/*
  const saveDetallesToLocalStorage = () => {
    localStorage.setItem('ventas', JSON.stringify(ventas));
  };

  saveDetallesToLocalStorage();*/

  const renderVentaRow = (venta) => (
    <React.Fragment key={venta.id}>
      <tr onClick={() => toggleRow(venta.id,venta.estado,venta)} className='tr-tabla-venta'>
        <td className="font-bold text-center">
          <div>{venta.serieNum}</div>
          <div className="text-gray-500">{venta.num}</div>
        </td>
        <td className="text-center">
          <span className={`px-4 py-2 rounded-full ${getTipoComprobanteClass(venta.tipoComprobante)} text-white`}>
            {venta.tipoComprobante}
          </span>
        </td>
        <td className="font-bold whitespace-normal">
          <div className='whitespace-normal'>{venta.cliente}</div>
          <div className="text-gray-500 whitespace-normal">{venta.ruc}</div>
        </td>
        <td className="text-center">{venta.fechaEmision}</td>
        <td className="text-center">{venta.igv}</td>
        <td className="text-center">{venta.total}</td>
        <td className="font-bold">
          <div className="whitespace-normal">
            {venta.cajero}
          </div>
          <div className="text-gray-500 whitespace-normal">
            {venta.cajeroId}
          </div>
        </td>

        <td className="text-center " style={{ color: venta.estado === 'Aceptada' ? '#117B34FF' : venta.estado === 'En proceso' ? '#F5B047' : '#E05858FF', fontWeight: "400" }} >
          <div className='ml-2 px-2.5 py-1.5 rounded-full ' style={{ background: venta.estado === 'Aceptada' ? 'rgb(191, 237, 206)' : venta.estado === 'En proceso' ? '#FDEDD4' : '#F5CBCBFF' }}>
            <span>{venta.estado}</span>
          </div>
        </td>
        <td>
    <IoMdOptions
        className={`ml-2 cursor-pointer ${venta.estado === 'Anulada' ? 'text-gray-300' : venta.estado === 'Aceptada' ? 'text-gray-300' : 'text-gray-500'} ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`}
        style={{ fontSize: '20px' }}
        onClick={() => openModal(venta.id, venta.estado)}
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
            <th className="w-1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">SERIE/NUM</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TIPO.COMP</th>
            <th className="w-1/6 text-start text-sm font-semibold text-gray-500 uppercase tracking-wider">CLIENTE</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">F. EMISIÓN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">IGV</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">TOTAL</th>
            <th className="w-1/6 text-start  text-sm font-semibold text-gray-500 uppercase tracking-wider">CAJERO</th>
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