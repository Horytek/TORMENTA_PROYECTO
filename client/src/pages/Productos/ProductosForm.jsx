import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { FaRegPlusSquare } from "react-icons/fa";
import './ProductosForm.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { ModalMarca } from './Modal Form/ModalMarca';
import { ModalLinea } from './Modal Form/ModalLinea';
import { ModalSublinea } from './Modal Form/ModalSubLinea';

const ProductosForm = ({ modalTitle, onClose }) => {

    const [isModalOpenMarca, setIsModalOpenMarca] = useState(false);
    const [isModalOpenLinea, setIsModalOpenLinea] = useState(false);
    const [isModalOpenSubLinea, setIsModalOpenSubLinea] = useState(false);

    // Logica Modal Marca
    const handleModalMarca = () => {
      setIsModalOpenMarca(!isModalOpenMarca);
    };

    const handleModalLinea = () => {
      setIsModalOpenLinea(!isModalOpenLinea);
    };

    // Logica Modal Sublinea
    const handleModalSubLinea = () => {
      setIsModalOpenSubLinea(!isModalOpenSubLinea);
    };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className='content-modal'>
          <div className="modal-header">
            <h3 className="modal-title">{modalTitle}</h3>
            <button className="modal-close" onClick={onClose}>
              <IoMdClose className='text-3xl'/>
            </button>
          </div>
          <div className='modal-body'>
              {/* Primera Fila */}
  
              <div className='w-full text-start mb-5'>
                <label htmlFor="descripcion" className='text-sm font-bold text-black'>Descripción:</label>
                <textarea name="descripcion" id="descripcion" rows={4} className='block w-full text-sm bg-gray-50 text-gray-900 rounded-lg border'></textarea>
              </div>
  
              {/* Segunda Fila */}
  
              <div className='grid grid-cols-2 gap-6'>
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="linea" className='text-sm font-bold text-black'>Línea:</label>
                  <div className='flex justify-center items-center gap-2'>
                    <select id='linea' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                      <option>Seleccione...</option>
                    </select>
                    <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500' onClick={handleModalLinea} />
                  </div>
                  
                </div>
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="Sub-Línea" className='text-sm font-bold text-black'>Sub-Línea:</label>
                  <div className='flex justify-center items-center gap-2'>
                    <select id='sublinea' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                      <option>Seleccione...</option>
                    </select>
                    <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500' onClick={handleModalSubLinea} />
                  </div>
                </div>
              </div>
  
              {/* Tercera Fila */}
  
              <div className='grid grid-cols-2 gap-6'>
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="moneda" className='text-sm font-bold text-black'>Moneda:</label>
                  <select id='moneda' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                    <option>Seleccione...</option>
                  </select>
                </div>
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="precio" className='text-sm font-bold text-black'>Precio:</label>
                  <input type="number" min={0} name='subLinea' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
                </div>
              </div>
  
              {/* Cuarta Fila */}
  
              <div className='grid grid-cols-2 gap-6'>
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="linea" className='text-sm font-bold text-black'>Stock:</label>
                  <select id='stock' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                    <option>Seleccione...</option>
                  </select>
                </div>
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="Sub-Línea" className='text-sm font-bold text-black'>Marca:</label>
                  <div className='flex justify-center items-center gap-2'>
                    <select id='marca' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                      <option>Seleccione...</option>
                    </select>
                    <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500' onClick={handleModalMarca} />
                  </div>
                </div>
              </div>
  
              {/* Quinta Fila */}
  
              <div className='grid grid-cols-2 gap-6'>
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="unidadMedida" className='text-sm font-bold text-black'>Und. Medida::</label>
                  <select id='unidadMedida' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                      <option>Seleccione...</option>
                      <option>KGM</option>
                      <option>NIU</option>
                  </select>
                </div>
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="estado" className='text-sm font-bold text-black'>Estado:</label>
                  <select id='estado' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                    <option>Seleccione...</option>
                  </select>
                </div>
              </div>
  
              {/* Final de Fila */}
  
              <div className='modal-buttons'>
                <ButtonClose onClick={onClose}/>
                <ButtonSave/>
              </div>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Marca */}
      {isModalOpenMarca && (
        <ModalMarca modalTitle={'Marca'} closeModel={handleModalMarca} />
      )}

      {/* Modal de Nueva Linea */}
      {isModalOpenLinea && (
        <ModalLinea modalTitle={'Linea'} closeModel={handleModalLinea} />
      )}

      {/* Modal de Nueva SubLinea */}
      {isModalOpenSubLinea && (
        <ModalSublinea modalTitle={'Sub-Línea'} closeModel={handleModalSubLinea} />
      )}

    </div>
  );
};

ProductosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProductosForm;
