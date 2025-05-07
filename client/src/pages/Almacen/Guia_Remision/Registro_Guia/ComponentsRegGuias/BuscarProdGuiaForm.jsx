import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
import { IoMdClose, IoMdAdd } from "react-icons/io";
import { ScrollShadow } from '@nextui-org/react';
import ProductosForm from '../../../../Productos/ProductosForm';
import { toast } from "react-hot-toast";

const ModalBuscarProducto = ({ isOpen, onClose, productos, agregarProducto }) => {
  const [cantidades, setCantidades] = useState({});
  const [activeAdd, setModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [filteredProductos, setFilteredProductos] = useState([]);

  // Inicializar cantidades y productos filtrados cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      const initialCantidades = productos.reduce((acc, producto) => {
        acc[producto.codigo] = 1;
        return acc;
      }, {});
      setCantidades(initialCantidades);
      setFilteredProductos(productos); // Mostrar todos los productos inicialmente
    }
  }, [isOpen, productos]);

  // Actualizar productos filtrados al cambiar los valores de búsqueda
  useEffect(() => {
    const filtered = productos.filter((producto) => {
      const matchesDescripcion = producto.descripcion.toLowerCase().includes(searchInput.toLowerCase());
      const matchesCodigoBarras = producto.codbarras?.toLowerCase().includes(codigoBarras.toLowerCase());
      return matchesDescripcion && (!codigoBarras || matchesCodigoBarras);
    });
    setFilteredProductos(filtered);
  }, [searchInput, codigoBarras, productos]);

  const handleModalAdd = () => setModalOpen(!activeAdd);

  const handleCantidadChange = (codigo, value) => {
    const cantidad = parseInt(value, 10);
    if (!isNaN(cantidad) && cantidad > 0) {
      setCantidades((prev) => ({
        ...prev,
        [codigo]: cantidad,
      }));
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
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalContent>
        <ModalHeader>
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-bold">Buscar producto</h2>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-4 mb-4 items-center">
            <Input
              placeholder="Buscar por descripción"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Input
              placeholder="Buscar por código de barras"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
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
                  <th className="py-3 px-4 text-left">Stock</th>
                  <th className="py-3 px-4 text-left">Cantidad</th>
                  <th className="py-3 px-4 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductos.map((producto) => (
                  <tr
                    key={producto.codigo}
                    className="bg-white hover:bg-gray-50 rounded-md shadow-sm"
                  >
                    <td className="py-2 px-4">{producto.codigo}</td>
                    <td className="py-2 px-4">{producto.descripcion}</td>
                    <td className="py-2 px-4">{producto.marca}</td>
                    <td className="py-2 px-4">{producto.stock}</td>
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
        <ProductosForm modalTitle="Nuevo Producto" onClose={handleModalAdd} />
      )}
    </Modal>
  );
};

ModalBuscarProducto.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productos: PropTypes.array.isRequired,
  agregarProducto: PropTypes.func.isRequired,
};

export default ModalBuscarProducto;