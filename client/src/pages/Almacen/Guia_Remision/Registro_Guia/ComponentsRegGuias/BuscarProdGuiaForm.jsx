import React, { useState, useEffect } from 'react';
import { RiCloseLargeLine } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";
import { IoMdAdd } from "react-icons/io";
import ProductosForm from '../../../../Productos/ProductosForm';

const ModalBuscarProducto = ({ isOpen, onClose, setSearchInput, productos, agregarProducto }) => {
  if (!isOpen) return null;

  const [cantidades, setCantidades] = useState({});
  const [activeAdd, setModalOpen] = useState(false);
  const [searchInput, setSearchInputState] = useState('');
  const [filteredProductos, setFilteredProductos] = useState(productos);
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    // Filtrar productos por descripción o código de barras
    setFilteredProductos(
      productos.filter((producto) =>
        producto.descripcion.toLowerCase().includes(searchInput.toLowerCase()) ||
        producto.codbarras?.toLowerCase().includes(searchInput.toLowerCase())
      )
    );
  }, [searchInput, productos]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        // Al presionar Enter, se supone que el escáner ha terminado de enviar el código
        const productoEscaneado = productos.find(p => p.codbarras === barcode);
        if (productoEscaneado) {
          setFilteredProductos([productoEscaneado]); // Filtra automáticamente por el producto escaneado
        } else {
          console.warn('Producto no encontrado');
        }
        setBarcode(''); // Limpia el código de barras después de procesar
      } else {
        // Concatenar caracteres ingresados
        setBarcode(prev => prev + event.key);
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [barcode, productos]);

  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  const handleCantidadChange = (codigo, cantidad) => {
    setCantidades({
      ...cantidades,
      [codigo]: parseInt(cantidad, 10),
    });
  };

  const handleAgregarProducto = (producto) => {
    const cantidadSolicitada = cantidades[producto.codigo] || 1;
    agregarProducto(producto, cantidadSolicitada);
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
              value={searchInput}
              onChange={(e) => setSearchInputState(e.target.value)}
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
                  <th className="py-2 px-4 border-b">Cantidad</th>
                  <th className="py-2 px-4 border-b">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductos.map((producto) => (
                  <tr key={producto.codigo}>
                    <td className="py-2 px-4 border-b text-center">{producto.codigo}</td>
                    <td className="py-2 px-4 border-b text-center">{producto.descripcion}</td>
                    <td className="py-2 px-4 border-b text-center">{producto.marca}</td>
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
