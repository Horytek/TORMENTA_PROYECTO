import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  NumberInput,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  ScrollShadow,
} from '@heroui/react';
import { RiCloseLargeLine } from "react-icons/ri";
import { IoMdAdd } from "react-icons/io";
import ProductosForm from '../../../../Productos/ProductosForm';
import { toast } from "react-hot-toast";

const ModalBuscarProducto = ({
  isOpen,
  onClose,
  onBuscar,
  setSearchInput,
  productos,
  agregarProducto,
  setCodigoBarras,
  hideStock,
}) => {
  const [cantidades, setCantidades] = useState({});
  const [activeAdd, setModalOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [codigoBarrasValue, setCodigoBarrasValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialCantidades = productos.reduce((acc, producto) => {
        acc[producto.codigo] = 1;
        return acc;
      }, {});
      setCantidades(initialCantidades);
    }
  }, [isOpen, productos]);

  useEffect(() => {
    onBuscar();
  }, [searchInputValue, codigoBarrasValue]);

  const handleModalAdd = () => setModalOpen(!activeAdd);

  // Función para cerrar el modal de ProductosForm
  const handleCloseProductosForm = () => {
    setModalOpen(false);
  };

  const handleCantidadChange = (codigo, value) => {
    const cantidad = parseInt(value, 10);
    if (!isNaN(cantidad) && cantidad > 0) {
      setCantidades({
        ...cantidades,
        [codigo]: cantidad,
      });
    }
  };

  const handleAgregarProducto = (producto) => {
    const cantidadSolicitada = cantidades[producto.codigo] || 1;
    if (cantidadSolicitada > producto.stock) {
      toast.error(`La cantidad solicitada (${cantidadSolicitada}) excede el stock disponible (${producto.stock}).`);
    } else {
      agregarProducto(producto, cantidadSolicitada);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="4xl"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/30 backdrop-blur-sm",
        wrapper: "z-[9999]",
        base: "z-[10000]"
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Buscar producto</h2>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-4 mb-4 items-center">
            <Input
              placeholder="Buscar producto"
              value={searchInputValue}
              onChange={(e) => {
                setSearchInputValue(e.target.value);
                setSearchInput(e.target.value);
              }}
            />
            <Input
              placeholder="Código de barras"
              value={codigoBarrasValue}
              onChange={(e) => {
                setCodigoBarrasValue(e.target.value);
                setCodigoBarras(e.target.value);
              }}
            />
            <Button
              color="success"
              onPress={handleModalAdd}
              startContent={<IoMdAdd />}
              className="w-full md:w-auto whitespace-nowrap"
            >
              Nuevo
            </Button>
          </div>
          <ScrollShadow hideScrollBar className="max-h-[400px] overflow-y-auto">
            <Table aria-label="Tabla de productos" className="w-full">
              <TableHeader>
                <TableColumn>Código</TableColumn>
                <TableColumn>Descripción</TableColumn>
                <TableColumn>Marca</TableColumn>
                {!hideStock && <TableColumn>Stock</TableColumn>}
                <TableColumn>Cantidad</TableColumn>
                <TableColumn>Acción</TableColumn>
              </TableHeader>
              <TableBody>
                {productos.map((producto) => (
                  <TableRow key={producto.codigo}>
                    <TableCell>{producto.codigo}</TableCell>
                    <TableCell>{producto.descripcion}</TableCell>
                    <TableCell>{producto.marca}</TableCell>
                    {!hideStock && <TableCell>{producto.stock}</TableCell>}
                    <TableCell>
                      <NumberInput
                        min={1}
                        value={cantidades[producto.codigo]}
                        onValueChange={(value) => handleCantidadChange(producto.codigo, value)}
                        className="max-w-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        color="success"
                        isIconOnly
                        size="sm"
                        onPress={() => handleAgregarProducto(producto)}
                      >
                        <IoMdAdd />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollShadow>
        </ModalBody>
        <ModalFooter>
          <Button color="default" onPress={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
      {activeAdd && (
        <ProductosForm 
          modalTitle="Nuevo Producto" 
          onClose={handleCloseProductosForm}
        />
      )}
    </Modal>
  );
};

export default ModalBuscarProducto;