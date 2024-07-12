import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import './ProductosForm.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

const ProductosForm = ({ modalTitle, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
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
                <select id='linea' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
                </select>
              </div>
              <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="Sub-Línea" className='text-sm font-bold text-black'>Sub-Línea:</label>
                <select id='sublinea' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
                </select>
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
                <select id='marca' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
                </select>
              </div>
            </div>

            {/* Quinta Fila */}

            <div className='grid grid-cols-2 gap-6'>
              <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="unidadMedida" className='text-sm font-bold text-black'>Und. Medida::</label>
                <select id='unidadMedida' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
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
  );
};

ProductosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProductosForm;
