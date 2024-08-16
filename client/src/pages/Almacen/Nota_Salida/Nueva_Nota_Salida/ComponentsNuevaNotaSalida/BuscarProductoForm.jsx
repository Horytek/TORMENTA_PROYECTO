import React, { useState, useEffect } from 'react';
import { RiCloseLargeLine } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";
import { IoMdAdd } from "react-icons/io";
import { toast } from "react-hot-toast";
import ProductosForm from '../../../../Productos/ProductosForm';

const ModalBuscarProducto = ({ isOpen, onClose, onBuscar, setSearchInput, productos, agregarProducto, setCodigoBarras }) => {
  if (!isOpen) return null;

  const [cantidades, setCantidades] = useState({});
  const [activeAdd, setModalOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [codigoBarrasValue, setCodigoBarrasValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Establece todos los valores iniciales a '1' cuando se abre el modal
      const initialCantidades = productos.reduce((acc, producto) => {
        acc[producto.codigo] = '1';
        return acc;
      }, {});
      setCantidades(initialCantidades);
    }
  }, [isOpen, productos]);

  useEffect(() => {
    onBuscar();
  }, [searchInputValue, codigoBarrasValue]);

  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      setCodigoBarras(e.target.value);
      onBuscar();  // Lógica que se ejecuta después de escanear
    }
  };

  const handleCantidadChange = (codigo, cantidad) => {
    // Permite valores vacíos y números que no comiencen con 0 (a menos que el valor sea '0')
    if (/^\d*$/g.test(cantidad) && (cantidad === '' || !/^0[0-9]/.test(cantidad))) {
      setCantidades({
        ...cantidades,
        [codigo]: cantidad,
      });
    }
  };

  const handleBlur = (codigo) => {
    if (cantidades[codigo] === '') { // Si está vacío, establece 1
      setCantidades({
        ...cantidades,
        [codigo]: '1',
      });
    }
  };

  const handleAgregarProducto = (producto) => {
    const cantidadSolicitada = parseInt(cantidades[producto.codigo] || '1', 10);
    if (cantidadSolicitada > producto.stock) {
      toast.error(`La cantidad solicitada (${cantidadSolicitada}) excede el stock disponible (${producto.stock}).`);
    } else {
      agregarProducto(producto, cantidadSolicitada);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="content-modal max-w-7xl mx-auto" style={{ maxHeight: '90%', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">Buscar producto</h2>
          <button className="modal-close" onClick={onClose}>
            <IoMdClose className='text-3xl' />
          </button>
        </div>
        <div className="modal-body">
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Buscar producto"
              className="border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 flex-grow"
              value={searchInputValue}
              onChange={(e) => {
                setSearchInputValue(e.target.value);
                setSearchInput(e.target.value); // Actualiza el valor del input
              }}
            />
            <input
              type="text"
              placeholder="Buscar por código de barras"
              className="border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 ml-2"
              value={codigoBarrasValue}
              onChange={(e) => {
                setCodigoBarrasValue(e.target.value);
                setCodigoBarras(e.target.value); // Actualiza el valor del input
              }}
              onKeyDown={handleKeyDown} 
            />

            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2 flex items-center"
              onClick={handleModalAdd}
            >
              <IoMdAdd className='w-4 h-4 mr-1' />
              Nuevo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Código</th>
                  <th className="py-2 px-4 border-b w-96">Descripción</th>
                  <th className="py-2 px-4 border-b">Marca</th>
                  <th className="py-2 px-4 border-b">Stock</th>
                  <th className="py-2 px-4 border-b">Cantidad</th>
                  <th className="py-2 px-4 border-b">Acción</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.codigo}>
                    <td className="py-2 px-4 border-b text-center">{producto.codigo}</td>
                    <td className="py-2 px-4 border-b text-center">{producto.descripcion}</td>
                    <td className="py-2 px-4 border-b text-center">{producto.marca}</td>
                    <td className="py-2 px-4 border-b text-center">{producto.stock}</td>
                    <td className="py-2 px-4 border-b text-center">
                      <input
                        type="number"
                        className="border border-gray-300 text-gray-900 text-sm rounded-lg p-2 text-center w-16 mx-auto"
                        value={cantidades[producto.codigo] || ''}
                        min="1"
                        onKeyDown={(e) => {
                          if (e.key === '.' || e.key === '-' || e.key === 'e' || e.key === '+') {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => handleCantidadChange(producto.codigo, e.target.value)}
                        onBlur={() => handleBlur(producto.codigo)}
                      />
                    </td>
                    <td className="py-2 px-4 border-b text-center">
                      <button
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => handleAgregarProducto(producto)}
                      >
                        <IoMdAdd />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-buttons flex justify-end mt-4">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={onClose}
          >
            <RiCloseLargeLine style={{ fontSize: '20px', marginRight: '8px' }} />
            Cerrar
          </button>
        </div>
      </div>
      {activeAdd && (
        <ProductosForm modalTitle={'Nuevo Producto'} onClose={handleModalAdd} />
      )}
    </div>
  );
};

export default ModalBuscarProducto;
