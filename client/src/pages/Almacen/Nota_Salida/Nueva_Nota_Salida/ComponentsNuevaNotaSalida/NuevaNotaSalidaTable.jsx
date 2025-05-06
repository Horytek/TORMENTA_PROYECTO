import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FaTrash } from 'react-icons/fa6';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from '@heroui/react';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';

const NuevaTablaSalida = ({ salidas, setProductosSeleccionados }) => {
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
      const nuevosProductosSeleccionados = salidas.filter(p => p.codigo !== productoAEliminar.codigo);
      setProductosSeleccionados(nuevosProductosSeleccionados);
      localStorage.setItem('productosSeleccionados', JSON.stringify(nuevosProductosSeleccionados));
    }
    closeModalEliminar();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <Table aria-label="Tabla de productos seleccionados" className="w-full">
        <TableHeader>
          <TableColumn className="text-center">CÓDIGO</TableColumn>
          <TableColumn className="text-center">DESCRIPCIÓN</TableColumn>
          <TableColumn className="text-center">MARCA</TableColumn>
          <TableColumn className="text-center">CANTIDAD</TableColumn>
          <TableColumn className="text-center">ACCIÓN</TableColumn>
        </TableHeader>
        <TableBody>
          {salidas.map((salida) => (
            <TableRow key={salida.codigo}>
              <TableCell className="text-center">{salida.codigo}</TableCell>
              <TableCell className="text-center">{salida.descripcion}</TableCell>
              <TableCell className="text-center">{salida.marca}</TableCell>
              <TableCell className="text-center">{salida.cantidad}</TableCell>
              <TableCell className="text-center">
                <Button
                  color="danger"
                  isIconOnly
                  size="sm"
                  onPress={() => openModalEliminar(salida)}
                >
                  <FaTrash />
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

NuevaTablaSalida.propTypes = {
  salidas: PropTypes.array.isRequired,
  setProductosSeleccionados: PropTypes.func.isRequired,
};

export default NuevaTablaSalida;