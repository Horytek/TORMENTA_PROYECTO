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
} from '@heroui/react';
import { RiCloseLargeLine } from "react-icons/ri";
import { ScrollShadow } from '@nextui-org/react';
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
  hideStock
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
          <div className="flex justify-between items-center w-full">
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


  <ScrollShadow hideScrollBar className="max-h-[400px] overflow-y-auto rounded-lg shadow-sm">
  <table className="min-w-full bg-white border-separate border-spacing-y-2">
    <thead className="bg-gray-50 sticky top-0 z-10 text-gray-600 text-sm">
      <tr>
        <th className="py-3 px-4 text-left">Código</th>
        <th className="py-3 px-4 text-left">Descripción</th>
        <th className="py-3 px-4 text-left">Marca</th>
        {!hideStock && <th className="py-3 px-4 text-left">Stock</th>}
        <th className="py-3 px-4 text-left">Cantidad</th>
        <th className="py-3 px-4 text-left">Acción</th>
      </tr>
    </thead>
    <tbody>
      {productos.map((producto) => (
        <tr
          key={producto.codigo}
          className="bg-white hover:bg-gray-50 rounded-md shadow-sm"
        >
          <td className="py-2 px-4">{producto.codigo}</td>
          <td className="py-2 px-4">{producto.descripcion}</td>
          <td className="py-2 px-4">{producto.marca}</td>
          {!hideStock && <td className="py-2 px-4">{producto.stock}</td>}
          <td className="py-2 px-4">
            <NumberInput
              min={1}
              value={cantidades[producto.codigo]}
              onValueChange={(value) => handleCantidadChange(producto.codigo, value)}
              className="max-w-xs"
            />
          </td>
          <td className="py-2 px-4">
            <Button
              color="success"
              isIconOnly
              size="sm"
              onPress={() => handleAgregarProducto(producto)}
            >
              <IoMdAdd />
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
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
