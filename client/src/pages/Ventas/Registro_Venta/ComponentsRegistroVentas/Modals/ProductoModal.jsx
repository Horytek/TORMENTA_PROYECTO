// ModalProducto.jsx

import { FaSearch, FaTshirt } from 'react-icons/fa';
import { IoCloseSharp, IoSearchOutline, IoHome } from 'react-icons/io5';
import { GiUnderwearShorts, GiArmoredPants, GiAmpleDress, GiLabCoat } from 'react-icons/gi';
import PropTypes from 'prop-types';

const ModalProducto = ({ isModalOpen, setIsModalOpen, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, handleProductSelect, filteredProductos }) => {
  return (
    <>
      {isModalOpen && (
        <div className="modal" style={{ zIndex: "1000" }}>
          <div className=" modal-prod p-6 rounded relative" style={{ width: "850px" }}>
            <button className="close-modal-prod absolute top-0 right-0 text-black-500 p-2 " onClick={() => setIsModalOpen(false)}>
              <IoCloseSharp />
            </button>
            <h2 className="text-xl mb-4 flex items-center " style={{ fontWeight: "500" }}>
              <IoSearchOutline className="mr-2" />
              Busque y seleccione el producto
            </h2>

            <div className="flex justify-around mb-5 button-tipo-prendas" style={{ fontSize: "25px" }}>
              <button onClick={() => setSelectedCategory('')} className={`btn  ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}><IoHome /></button>
              <button onClick={() => setSelectedCategory('pantalon')} className={`btn ${selectedCategory === 'pantalon' ? 'btn-primary' : 'btn-secondary'}`}><GiArmoredPants /></button>
              <button onClick={() => setSelectedCategory('vestido')} className={`btn ${selectedCategory === 'vestido' ? 'btn-primary' : 'btn-secondary'}`}><GiAmpleDress /></button>
              <button onClick={() => setSelectedCategory('short')} className={`btn ${selectedCategory === 'short' ? 'btn-primary' : 'btn-secondary'}`}><GiUnderwearShorts /></button>
              <button onClick={() => setSelectedCategory('bolso')} className={`btn  ${selectedCategory === 'bolso' ? 'btn-primary' : 'btn-secondary'}`}><GiLabCoat /></button>
              <button onClick={() => setSelectedCategory('bufanda')} className={`btn  ${selectedCategory === 'bufanda' ? 'btn-primary' : 'btn-secondary'}`}><FaTshirt /></button>
            </div>
            <hr className='mb-5' />
            <div className="flex items-center mb-4 bg-white border rounded-lg shadow-sm overflow-hidden">
              <span className="px-3">
                <FaSearch className="text-gray-400" />
              </span>
              <input
                type="text"
                className="form-input py-3 px-4 w-full text-gray-700 placeholder-gray-400 focus:outline-none"
                placeholder="Realice la búsqueda del producto por el nombre"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">NOMBRE</th>
                  <th className="py-2 px-4 border-b text-center">PRECIO</th>
                  <th className="py-2 px-4 border-b text-center">STOCK</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductos.map((producto) => (
                  <tr key={producto.codigo} className="cursor-pointer" onClick={() => handleProductSelect(producto)} style={{ fontWeight: "600" }}>
                    <td className="py-2 px-4 border-b">{producto.nombre}</td>
                    <td className="py-2 px-4 border-b text-center">S/ {producto.precio}</td>
                    <td className="py-2 px-4 border-b text-center">Stock: {producto.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
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
    filteredProductos: PropTypes.array.isRequired,
  };
  

export default ModalProducto;
