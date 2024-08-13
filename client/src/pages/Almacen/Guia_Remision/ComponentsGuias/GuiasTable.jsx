import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import ReactToPrint from 'react-to-print';
import anularGuia from '../../data/anular_guia'; // Asegúrate de ajustar la ruta
import { Toaster, toast } from "react-hot-toast";

const TablaGuias = ({ guias }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [guiaIdToAnular, setGuiaIdToAnular] = useState(null);

  const handleSelectChange = (event, id) => {
    const value = event.target.value;
    switch (value) {
      case 'imprimir':
        setIsModalOpenImprimir(true);
        break;
      case 'anular':
        setGuiaIdToAnular(id);
        setIsModalOpenAnular(true);
        break;
      default:
        break;
    }
    event.target.value = '';
  };

  const closeModalImprimir = () => {
    setIsModalOpenImprimir(false);
  };

  const closeModalAnular = () => {
    setIsModalOpenAnular(false);
  };

  const handleConfirmImprimir = () => {
    setIsModalOpenImprimir(false);
    // Lógica de impresión aquí si es necesario
  };

  const handleConfirmAnular = async () => {
    if (guiaIdToAnular) {
      const result = await anularGuia(guiaIdToAnular); // Llamada a la función para anular la guía
      if (result.success) {
        toast.success('Guía de remisión anulada');
        window.location.reload();
      } else {
        toast.error(result.message);
        console.error(result.message);
      }
    }
    setIsModalOpenAnular(false);
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderGuiaRow = (guia) => (
    <React.Fragment key={guia.id}>
      <tr onClick={() => toggleRow(guia.id)} className="tr-tabla-guia">
        <td className="text-center">{guia.fecha}</td>
        <td className="text-center">{guia.numGuia}</td>
        <td className="font-bold text-center">
          <div className="whitespace-normal">{guia.cliente}</div>
          <div className="text-gray-500 whitespace-normal">{guia.documento}</div>
        </td>
        <td className="font-bold text-center">
          <div className="whitespace-normal">{guia.vendedor}</div>
          <div className="text-gray-500 whitespace-normal">{guia.dni}</div>
        </td>
        <td className="font-bold text-center">
          <div>{guia.serieNum}</div>
          <div className="text-gray-500">{guia.num}</div>
        </td>
        <td className="text-center">{guia.concepto}</td>
        <td className="text-center" style={{ color: guia.estado === 'Activo' ? '#117B34FF' : '#E05858FF', fontWeight: "400" }}>
          <div className="ml-2 px-2.5 py-1.5 rounded-full" style={{ background: guia.estado === 'Activo' ? 'rgb(191, 237, 206)' : '#F5CBCBFF' }}>
            <span>{guia.estado}</span>
          </div>
        </td>
        <td className='text-center'>
          <select className='b text-center custom-select border border-gray-300 rounded-lg p-1.5 text-gray-900 text-sm' name="select" onChange={(e) => handleSelectChange(e, guia.id)}>
            <option value="">...</option>
            <option value="imprimir">Imprimir</option>
            <option value="anular">Anular</option>
          </select>
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
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">UM</th>
                <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">PRECIO</th>
                
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  <td className="font-bold text-center">{detalle.codigo}</td>
                  <td className="font-bold text-center">{detalle.marca}</td>
                  <td className="text-center">{detalle.descripcion}</td>
                  <td className="text-center">{detalle.cantidad}</td>
                  <td className="text-center">{detalle.um}</td>
                  <td className="text-center">{detalle.precio}</td>
                  
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
      <Toaster />
      <table className="tabla-guia table-auto w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">NUM GUIA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CLIENTE</th>
            <th className="w-1/5 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">VENDEDOR</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DOC VENTA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CONCEPTO</th>
            <th className="w-1/7 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {guias.length > 0 ? (
            guias.map((guia) => renderGuiaRow(guia))
          ) : (
            <tr>
              <td colSpan="10" className="text-center py-4">No se encontraron resultados</td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpenImprimir && (
        <ConfirmationModal
          message="¿Desea imprimir esta guía?"
          onClose={closeModalImprimir}
          isOpen={isModalOpenImprimir}
          onConfirm={handleConfirmImprimir}
        />
      )}

      {isModalOpenAnular && (
        <ConfirmationModal
          message="¿Desea anular esta guía?"
          onClose={closeModalAnular}
          isOpen={isModalOpenAnular}
          onConfirm={handleConfirmAnular}
        />
      )}
    </div>
  );
};

TablaGuias.propTypes = {
  guias: PropTypes.array.isRequired,
};

export default TablaGuias;
