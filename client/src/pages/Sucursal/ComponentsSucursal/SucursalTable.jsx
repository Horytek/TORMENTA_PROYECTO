import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Pagination from '@/components/Pagination/Pagination';
import { Toaster, toast } from "react-hot-toast";
import EditarSucursal from './Modals/EditarSucursal';
import editarSucursal from '../data/edit_sucursal';

const TablaSucursal = forwardRef(({ sucursales }, ref) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sucursalEditando, setSucursalEditando] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditarClick = (sucursal) => {
    setSucursalEditando(sucursal);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSucursalEditando(null);
  };

  const handleActualizarSucursal = async (sucursalActualizada) => {
    try {
      const resultado = await editarSucursal(sucursalActualizada);
      if (resultado.success) {
        toast.success('Sucursal actualizada correctamente.');
      } else {
        toast.error('Error al actualizar la sucursal.');
      }
      handleCloseEditModal();
      setTimeout(() => {
        window.location.reload();
      }, 100); // 100 milisegundos de retraso
    } catch (error) {
      console.error('Error al actualizar la sucursal:', error);
      toast.error('Error al actualizar la sucursal.');
    }
  };

  const getEstadoClassName = (estado) => {
    switch (estado) {
      case 1:
        return 'estado-activo';
      case 0:
        return 'estado-inactivo';
      default:
        return '';
    }
  };

  const renderSucursalRow = (sucursal) => (
    <React.Fragment key={sucursal.id}>
      <tr className='tr-tabla-ingreso'>
        <td className="text-center">{sucursal.nombre_vendedor}</td>
        <td className="text-center">{sucursal.nombre_sucursal}</td>
        <td className="text-center">{sucursal.ubicacion}</td>
        <td className="text-center">
          <p className={getEstadoClassName(sucursal.estado_sucursal)}>
            {sucursal.estado_sucursal === 0 ? 'Inactivo' : 'Activo'}
          </p>
        </td>
        <td className="text-center">
          <button
            onClick={() => handleEditarClick(sucursal)}
            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
          >
            Editar
          </button>
        </td>
      </tr>
    </React.Fragment>
  );

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sucursales.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(sucursales.length / itemsPerPage);

  return (
    <div className="container-table-reg px-4 bg-white rounded-lg">
      <Toaster />
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">VENDEDOR</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">NOMBRE</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DIRECCIÓN</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">EDITAR</th>
          </tr>
        </thead>
        <tbody>
          {getCurrentPageItems().map(renderSucursalRow)}
        </tbody>
      </table>

      <div className="flex justify-between mt-4">
        <div className="flex">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
        <select
          id="itemsPerPage"
          className="input-c cant-pag-c pr-8 border-gray-300 bg-gray-50 rounded-lg"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={5}>05</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      {isEditModalOpen && (
        <EditarSucursal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          titulo="Editar Sucursal"
          sucursal={sucursalEditando}
          onGuardar={handleActualizarSucursal}
        />
      )}
    </div>
  );
});

TablaSucursal.propTypes = {
  sucursales: PropTypes.array.isRequired,
};

export default TablaSucursal;