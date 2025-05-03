import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Pagination, Tooltip, Select, SelectItem } from '@heroui/react';
import { Toaster, toast } from "react-hot-toast";
import EditarSucursal from './Modals/EditarSucursal';
import { MdEdit } from "react-icons/md";
import editarSucursal from '../data/edit_sucursal';
import { usePermisos } from '@/routes';

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

  const { hasEditPermission } = usePermisos();

  const renderSucursalRow = (sucursal) => (
    <TableRow key={sucursal.id} className="border-none">
      <TableCell className="text-center">{sucursal.nombre_vendedor}</TableCell>
      <TableCell className="text-center">{sucursal.nombre_sucursal}</TableCell>
      <TableCell className="text-center">{sucursal.ubicacion}</TableCell>
      <TableCell className="text-center">
        <span
          className={
            sucursal.estado_sucursal === 0
              ? "inline-flex justify-center items-center py-1 px-2 text-sm font-semibold rounded-full text-red-600 bg-red-100"
              : "inline-flex justify-center items-center py-1 px-2 text-sm font-semibold rounded-full text-green-700 bg-green-200"
          }
        >
          {sucursal.estado_sucursal === 0 ? 'Inactivo' : 'Activo'}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
          <Button
            isIconOnly
            variant="light"
            color={hasEditPermission ? "warning" : "default"}
            onClick={() => hasEditPermission ? handleEditarClick(sucursal) : null}
            className={hasEditPermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
          >
            <MdEdit className="w-4 h-4" />
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
    <div className="px-4 bg-white rounded-lg shadow">
      <Toaster />
      <Table isStriped aria-label="Sucursales" className="w-full">
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