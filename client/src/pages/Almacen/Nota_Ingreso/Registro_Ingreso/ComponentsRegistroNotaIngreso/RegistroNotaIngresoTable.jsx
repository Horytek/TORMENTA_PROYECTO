import React from 'react';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTrash } from 'react-icons/fa';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
const RegistroTablaIngreso = ({ ingresos, setProductosSeleccionados }) => {
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  
  const openModalEliminar = (producto) => {
    setProductoAEliminar(producto);
    setIsModalOpenEliminar(true);
  };

  const closeModalEliminar = () => {
    setIsModalOpenEliminar(false);
    setProductoAEliminar(null);
  };

  const handleConfirmEliminar = () => {
    if (productoAEliminar) {
      const nuevosProductosSeleccionados = ingresos.filter(p => p.codigo !== productoAEliminar.codigo);
      setProductosSeleccionados(nuevosProductosSeleccionados);
      localStorage.setItem('productosSeleccionados', JSON.stringify(nuevosProductosSeleccionados));
    }
    closeModalEliminar();
  };

  const renderEntradaRow = (ingreso) => (
    <tr key={ingreso.codigo} className='tr-tabla-nuevoingreso'>
      <td className="text-center">{ingreso.codigo}</td>
      <td className="text-center">{ingreso.descripcion}</td>
      <td className="text-center">{ingreso.marca}</td>
      <td className="text-center">{ingreso.cantidad}</td>
      <td className="text-center">
        <button onClick={() => openModalEliminar(ingreso)}>
          <FaTrash className="w-4 h-4 text-red-500" />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CÓDIGO</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</th>
            <th className="w-1/6 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
            <th className="w-1/1 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {ingresos.map(renderEntradaRow)}
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

RegistroTablaIngreso.propTypes = {
  ingresos: PropTypes.array.isRequired,
  setProductosSeleccionados: PropTypes.func.isRequired,
};

export default RegistroTablaIngreso;