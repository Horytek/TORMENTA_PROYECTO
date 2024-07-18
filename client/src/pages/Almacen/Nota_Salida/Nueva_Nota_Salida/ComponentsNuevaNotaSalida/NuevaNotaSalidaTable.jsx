import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTrash } from 'react-icons/fa6';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
const NuevaTablaSalida = ({ salidas, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  
  const openModalEliminar = () => {
    setIsModalOpenEliminar(true);
  };

  const closeModalEliminar = () => {
    setIsModalOpenEliminar(false);
  };
  const handleConfirmEliminar = () => {
    setIsModalOpenEliminar(false);
  };
  const renderSalidaRow = (salida) => (
    <React.Fragment key={salida.id}>
      <tr className='tr-tabla-salida'>
        <td className="text-center">{salida.codigo}</td>
        <td className="text-center">{salida.descripcion}</td>
        <td className="text-center">{salida.marca}</td>
        <td className="text-center">{salida.stockActual}</td>
        <td className="text-center">{salida.cantidad}</td>
        <td className="flex text-center justify-center items-center align-center">
        <button className="flex justify-center items-center" onClick={openModalEliminar}>
          <FaTrash className="w-4 h-4 text-red-500" />
        </button>
      </td>

      </tr>
      {expandedRow === salida.id && renderVentaDetails(salida.detalles)}
    </React.Fragment>
  );

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CÓDIGO</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">STOCK ACTUAL</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {salidas.map(renderSalidaRow)}
        </tbody>
      </table>
      {isModalOpenEliminar && (
        <ConfirmationModal 
          message='¿Desea eliminar este producto?' 
          onClose={closeModalEliminar} 
          isOpen={isModalOpenEliminar}
          onConfirm={handleConfirmEliminar}
        />
      )}
    </div>
  );
};

NuevaTablaSalida.propTypes = {
  salidas: PropTypes.array.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default NuevaTablaSalida;