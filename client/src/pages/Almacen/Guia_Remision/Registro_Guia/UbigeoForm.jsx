import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { FaSearch } from 'react-icons/fa';
import './ModalGuias.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';

const ProductosForm = ({ modalTitle, onClose }) => {
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
            {/* PARTIDA */}
            <div className='modal-content'>
              <h4>Ubigeo de Partida</h4>
              <hr />
              <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="dept" className='text-sm font-bold text-black'>Departamento:</label>
                <input type="search" name='dept' className='input-field border-lg' />
                <FaSearch className='search-icon' />

              </div>
              <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="prov" className='text-sm font-bold text-black'>Provincia:</label>
                <input type="search" name='prov' className='input-field' />
                <FaSearch className='search-icon' />
              </div>
              <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="dist" className='text-sm font-bold text-black'>Distrito:</label>
                <input type="search" name='dist' className='input-field' />
                <FaSearch className='search-icon' />
              </div>
            </div>
            {/* DESTINO */}
            <div className='modal-content'>
              <h4>Ubigeo de Destino</h4>
              <hr />
              <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="dept" className='text-sm font-bold text-black'>Departamento:</label>
                <input type="search" name='dept' className='input-field' />
                <FaSearch className='search-icon' />
              </div>
              <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="prov" className='text-sm font-bold text-black'>Provincia:</label>
                <input type="search" name='prov' className='input-field' />
                <FaSearch className='search-icon' />
              </div>
              <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="dist" className='text-sm font-bold text-black'>Distrito:</label>
                <input type="search" name='dist' className='input-field' />
                <FaSearch className='search-icon' />
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
    </div>
  );
};

ProductosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProductosForm;
