import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ConfirmationModal from './Modals/ConfirmationModal';

const TablaSalida = ({ salidas, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpenImprimir2, setIsModalOpenImprimir2] = useState(false);
  const [isModalOpenAnular, setIsModalOpenAnular] = useState(false);
  const [isModalOpenClonar, setIsModalOpenClonar] = useState(false);

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
  const handleSelectChange2 = (event, id) => {
    const value = event.target.value;
    switch (value) {
      case 'imprimir2':
        setIsModalOpenImprimir2(true);
        break;
      case 'anular':
        setIsModalOpenAnular(true);
        break;
      case 'clonar':
        setIsModalOpenClonar(true);
        break;
      default:
        break;
    }
    event.target.value = ''; 
  };

  const closeModalImprimir2 = () => {
    setIsModalOpenImprimir2(false);
  };

  const closeModalAnular = () => {
    setIsModalOpenAnular(false);
  };

  const closeModalClonar = () => {
    setIsModalOpenClonar(false);
  };
  const handleConfirmImprimir2 = () => {
    console.log('Nota de salida impresa.');
    setIsModalOpenImprimir2(false);
  };

  const handleConfirmAnular = () => {
    console.log('Exportar a Excel.');
    setIsModalOpenAnular(false);
  };

  const handleConfirmClonar = () => {
    console.log('Exportar a Excel Detalle.');
    setIsModalOpenClonar(false);
  };
  const renderSalidaRow = (salida) => (
    <React.Fragment key={salida.id}>
      <tr onClick={() => toggleRow(salida.id)} className='tr-tabla-salida'>
        <td className="text-center">{salida.fecha}</td>
        <td className="text-center">{salida.documento}</td>
        <td className="text-center">{salida.proveedor}</td>
        <td className="text-center">{salida.total}</td>
        <td className="text-center">{salida.concepto}</td>
        <td className="text-center">
        <p className={getEstadoClassName(salida.estado)}> 
          {salida.estado}
        </p>
        </td>
        <td className='text-center'>
          <select className='b text-center custom-select border border-gray-300 rounded-lg p-1.5 text-gray-900 text-sm rounded-lg' name="select" onClick={handleSelectClick}  onChange={handleSelectChange2}>
            <option value="" selected>Seleccione...</option>
            <option value="imprimir2">Imprimir</option>
            <option className={`ml-2 rounded-lg cursor-pointer ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => openModal(salida.id)}  value="anular">Anular</option>
            <option value="clonar">Clonar</option>
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
                <th className="w-3/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
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
                  <td className="text-center py-2 px-4">{detalle.codigo}</td>
                  <td className="text-center py-2 px-4">{detalle.linea}</td>
                  <td className="text-center py-2 px-4">{detalle.descripcion}</td>
                  <td className="text-center py-2 px-4">{detalle.cantidad}</td>
                  <td className="text-center py-2 px-4">{detalle.um}</td>
                  <td className="text-center py-2 px-4">{detalle.precio}</td>
                  <td className="text-center py-2 px-4">{detalle.total}</td>
                  <td className="text-center py-2 px-4">{detalle.almacen}</td>
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
      {isModalOpenImprimir2 && (
        <ConfirmationModal message="¿Desea imprimir esta nota de salida?" onClose={closeModalImprimir2} isOpen={isModalOpenImprimir2} onConfirm={handleConfirmImprimir2} />
      )}

      {isModalOpenAnular && (
        <ConfirmationModal message="¿Desea anular esta nota de salida?" onClose={closeModalAnular} isOpen={isModalOpenAnular} onConfirm={handleConfirmAnular} />
      )}

      {isModalOpenClonar && (
        <ConfirmationModal message="¿Desea clonar esta nota de salida?" onClose={closeModalClonar} isOpen={isModalOpenClonar} onConfirm={handleConfirmClonar} />
      )}
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