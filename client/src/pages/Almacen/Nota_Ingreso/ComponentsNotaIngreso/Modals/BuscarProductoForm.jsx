import React, { useState } from 'react';
import { RiCloseLargeLine } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";
import { IoMdAdd } from "react-icons/io";
import { IoIosSearch } from "react-icons/io";
const ModalBuscarProducto = ({ isOpen, onClose, onBuscar, setSearchInput, productos }) => {
  if (!isOpen) return null;

  // Agregar un estado para manejar las cantidades de los productos
  const [cantidades, setCantidades] = useState({});

  // Función para manejar el cambio en el valor del spinner
  const handleCantidadChange = (codigo, cantidad) => {
    setCantidades({
      ...cantidades,
      [codigo]: cantidad,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="content-modal">
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
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2 flex items-center"
              onClick={onBuscar}
            >
              <IoIosSearch className='w-4 h-4 mr-1' />
              Buscar
            </button>
            <button 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2 flex items-center" 
              onClick={() => openModalProducto('Agregar Producto')}
            >
              <IoMdAdd className='w-4 h-4 mr-1' />
              Nuevo
            </button>
          </div>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Código</th>
                <th className="py-2 px-4 border-b">Descripción</th>
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
                      value={cantidades[producto.codigo] || 1}
                      min="1"
                      onChange={(e) => handleCantidadChange(producto.codigo, e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                      <IoMdAdd />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
};

export default ModalBuscarProducto;
