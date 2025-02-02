import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaSearch, FaTshirt } from 'react-icons/fa';
import { IoCloseSharp, IoSearchOutline, IoHome } from 'react-icons/io5';
import { ScrollShadow } from "@nextui-org/react";
import { GiUnderwearShorts, GiArmoredPants, GiAmpleDress, GiShorts, GiPoloShirt, GiMonclerJacket, GiPassport, GiSkirt, GiShirt, GiTankTop } from 'react-icons/gi';

const categoryButtons = [
  { category: '', icon: IoHome },
  { category: 'Pantalon', icon: GiArmoredPants },
  { category: 'Vestidos Jeans', icon: GiAmpleDress },
  { category: 'Shorts', icon: GiUnderwearShorts },
  { category: 'Torero', icon: GiShorts },
  { category: 'Polos', icon: GiPoloShirt },
  { category: 'Blusas Jeans', icon: FaTshirt },
  { category: 'Casacas Jeans', icon: GiMonclerJacket },
  { category: 'Conjunto Deportivos', icon: GiPassport },
  { category: 'Minifaldas', icon: GiSkirt },
  { category: 'Overoles', icon: GiTankTop },
  { category: 'Poleras Franeladas', icon: GiShirt }
];

const ModalProducto = ({ isModalOpen, setIsModalOpen, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, handleProductSelect, filteredProductos, searchTerm2 }) => {
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        // Al presionar Enter, se supone que el escáner ha terminado de enviar el código
        console.log('Scanned barcode:', barcode);
        var productoEscaneado = '';
        productoEscaneado = filteredProductos.find(p => p.codigo_barras === barcode);
        if (searchTerm2) {
          productoEscaneado = filteredProductos.find(p => p.codigo_barras === searchTerm2);
        }

        if (productoEscaneado) {
          handleProductSelect(productoEscaneado);
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
  }, [barcode, filteredProductos, handleProductSelect, searchTerm2]);

  if (!isModalOpen) return null;

  return (
    <div className="modal-container fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="modal-prod p-6 bg-white rounded-xl relative w-[950px] max-h-[85vh] shadow-lg">
        <button
          className="close-modal-prod absolute top-4 right-4 text-black text-2xl p-2"
          onClick={() => setIsModalOpen(false)}
        >
          <IoCloseSharp />
        </button>
        <h2 className="text-xl mb-6 flex items-center font-semibold text-gray-800">
          <IoSearchOutline className="mr-2" />
          Busque y seleccione el producto
        </h2>
        <div className="flex justify-around mb-5 button-tipo-prendas text-2xl">
          {categoryButtons.map(({ category, icon: Icon }) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`btn ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-700"
              } rounded-full p-2 transition-colors`}
            >
              <Icon />
            </button>
          ))}
        </div>
        <hr className="mb-5" />
        <div className="flex items-center mb-4 bg-gray-100 border rounded-lg shadow-sm overflow-hidden">
          <span className="px-3">
            <FaSearch className="text-gray-400" />
          </span>
          <input
            type="text"
            className="py-2 px-4 w-full text-gray-700 border-none focus:ring-0 placeholder-gray-400 focus:outline-none"
            placeholder="Buscar por nombre"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Envolvemos el contenido con ScrollShadow para ocultar el scroll */}
        <ScrollShadow hideScrollBar className="max-h-[50vh] w-full">
          <table className="min-w-full">
            <thead>
              <tr>
                {["NOMBRE", "PRECIO", "STOCK"].map((heading, index) => (
                  <th
                    key={heading}
                    className={`w-${
                      index === 0 ? "1/3" : "1/12"
                    } text-start text-xs font-semibold text-gray-500 uppercase tracking-wider py-2`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProductos.map((producto) => (
                <tr
                  key={producto.codigo}
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleProductSelect(producto)}
                  style={{ fontWeight: "600" }}
                >
                  <td>{producto.nombre}</td>
                  <td className="text-start">S/ {producto.precio}</td>
                  <td className="text-start">Stock: {producto.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollShadow>
      </div>
    </div>
  );
};

ModalProducto.propTypes = {
  isModalOpen: PropTypes.bool.isRequired,
  setIsModalOpen: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string.isRequired,
  setSelectedCategory: PropTypes.func.isRequired,
  handleProductSelect: PropTypes.func.isRequired,
  filteredProductos: PropTypes.arrayOf(
    PropTypes.shape({
      codigo: PropTypes.number.isRequired,
      nombre: PropTypes.string.isRequired,
      precio: PropTypes.number.isRequired,
      stock: PropTypes.number.isRequired
    })
  ).isRequired,
  searchTerm2: PropTypes.string.isRequired,
};

export default ModalProducto;
