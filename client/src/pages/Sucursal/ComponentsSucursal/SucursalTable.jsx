import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Pagination, Tooltip, Select, SelectItem } from '@nextui-org/react';
import { Toaster, toast } from "react-hot-toast";
import EditarSucursal from './Modals/EditarSucursal';
import { FaEdit } from "react-icons/fa";
import editarSucursal from '../data/edit_sucursal';
import './SucursalTable.css';

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
    <TableRow key={sucursal.id} className="border-none">
      <TableCell className="text-center">{sucursal.nombre_vendedor}</TableCell>
      <TableCell className="text-center">{sucursal.nombre_sucursal}</TableCell>
      <TableCell className="text-center">{sucursal.ubicacion}</TableCell>
      <TableCell className="text-center">
      <span className={
  sucursal.estado_sucursal === 0
    ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
    : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
}>
  {sucursal.estado_sucursal === 0 ? 'Inactivo' : 'Activo'}
</span>

      </TableCell>
      <TableCell className="text-center">
        <Tooltip content="Editar">
          <Button isIconOnly variant="light" color="primary" onClick={() => handleEditarClick(sucursal)}>
                    <FaEdit className="w-4 h-4" />
          </Button>
        </Tooltip>
      </TableCell>
    </TableRow>
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
      <Table aria-label="Sucursales" className="table w-full">
        <TableHeader>
          <TableColumn className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">VENDEDOR</TableColumn>
          <TableColumn className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">NOMBRE</TableColumn>
          <TableColumn className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DIRECCIÓN</TableColumn>
          <TableColumn className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ESTADO</TableColumn>
          <TableColumn className="w-1/12 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">EDITAR</TableColumn>
        </TableHeader>
        <TableBody>
          {getCurrentPageItems().map(renderSucursalRow)}
        </TableBody>
      </Table>

      <div className="flex justify-between mt-4">
        <Pagination
          showControls
          total={totalPages}
          initialPage={currentPage}
          onChange={(page) => setCurrentPage(page)}
        />
<Select
  id="itemsPerPage"
  aria-label="Items per page"
  selectedKeys={[String(itemsPerPage)]}
  onSelectionChange={(keys) => {
    const value = Number(Array.from(keys)[0]);
    setItemsPerPage(value);
    setCurrentPage(1);
  }}
  className="w-20"
>
  <SelectItem key="5" value={5}>05</SelectItem>
  <SelectItem key="10" value={10}>10</SelectItem>
  <SelectItem key="20" value={20}>20</SelectItem>
</Select>
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