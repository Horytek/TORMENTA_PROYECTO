import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTrash } from 'react-icons/fa';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from "@heroui/react";
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
    <div className="container-table-reg px-4 rounded-lg">
      <Table aria-label="Tabla de ingresos" className="w-full">
        <TableHeader>
          <TableColumn className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CÓDIGO</TableColumn>
          <TableColumn className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">DESCRIPCIÓN</TableColumn>
          <TableColumn className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">MARCA</TableColumn>
          <TableColumn className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">CANTIDAD</TableColumn>
          <TableColumn className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">ACCIÓN</TableColumn>
        </TableHeader>
        <TableBody>
          {ingresos.map((ingreso) => (
            <TableRow key={ingreso.codigo}>
              <TableCell className="text-center">{ingreso.codigo}</TableCell>
              <TableCell className="text-center">{ingreso.descripcion}</TableCell>
              <TableCell className="text-center">{ingreso.marca}</TableCell>
              <TableCell className="text-center">{ingreso.cantidad}</TableCell>
              <TableCell className="text-center">
                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  onPress={() => openModalEliminar(ingreso)}
                >
                  <FaTrash className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isModalOpenEliminar && (
        <ConfirmationModal
          message="¿Desea eliminar este producto?"
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