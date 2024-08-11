import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import './ModalGuias.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import useDestNatural from '../../data/add_dest_natural';
import useDestJuridica from '../../data/add_dest_juridico';
import { Toaster, toast } from 'react-hot-toast';

function ClienteForm({ modalTitle, onClose }) {
  const [tab, setTab] = useState('registro');
  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();  // Previene la recarga de la página

    if (tab === 'registro') {
      if (dni.length !== 8 || isNaN(dni)) {
        toast.error('El DNI debe tener 8 dígitos y solo contener números.');
        return;
      }
      if (!nombres || !apellidos || !direccion) {
        toast.error('Todos los campos son obligatorios.');
        return;
      }

      const dataNatural = { dni, nombres, apellidos, ubicacion: direccion };
      const result = await useDestNatural(dataNatural, onClose);
      if (!result.success) {
        toast.error(result.message); // Muestra un mensaje de error si algo sale mal
      } else {
        toast.success('Destinatario natural añadido exitosamente');
        onClose();
      }
    } else if (tab === 'otros') {
      if (ruc.length !== 11 || isNaN(ruc)) {
        toast.error('El RUC debe tener 11 dígitos y solo contener números.');
        return;
      }
      if (!razonSocial || !direccion) {
        toast.error('Todos los campos son obligatorios.');
        return;
      }

      const dataJuridica = { ruc, razon_social: razonSocial, ubicacion: direccion };
      const result = await useDestJuridica(dataJuridica, onClose);
      if (!result.success) {
        toast.error(result.message); // Muestra un mensaje de error si algo sale mal
      } else {
        toast.success('Destinatario jurídico añadido exitosamente');
        onClose();
      }
    }
  };

  return (
    <div className="modal3-overlay">
      <Toaster />
      <div className="modal3">
        <div className='content-modal3'>
          <div className="modal3-header">
            <h2 className="modal3-title">{modalTitle}</h2>
            <button className="close-button" onClick={onClose}>
              <IoMdClose className='text-3xl'/>
            </button>
          </div>
          <div className="modal-bodywa">
            <div className="tabs flex justify-center mt-2">
              <div className='w-full'>
                <button 
                  className={`p-4 ${tab === 'registro' ? 'active' : ''} w-full`}
                  onClick={() => setTab('registro')}
                >
                  Persona Natural
                </button>
              </div>
              <div className='w-full'>
                <button 
                  className={`p-4 ${tab === 'otros' ? 'active' : ''} w-full`}
                  onClick={() => setTab('otros')}
                >
                  Persona Jurídica
                </button>
              </div>
            </div>
            <form onSubmit={handleSave}>
              {tab === 'registro' && (
                <div className='modal2-content'>
                  <div className="form-row">
                    <div className="form-group">
                      <label className='text-sm font-bold text-black' htmlFor="dni">DNI:</label>
                      <input
                        className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5 wider2-input'
                        type="text"
                        id="ruc-dni"
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                      />
                    </div>
                    <div className="items-center justify-center pt-5">
                      <button className="sunat-button rounded-lg border p-2.5">SUNAT</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="nombres">Nombres:</label>
                    <input
                      className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                      type="text"
                      id="nombre"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="apellidos">Apellidos:</label>
                    <input
                      className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                      type="text"
                      id="apellidos"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                    />
                  </div>
                  <div className="w-full text-start mb-5">
                    <label className='text-sm font-bold text-black' htmlFor="direccion">Dirección:</label>
                    <div className="flex items-center">
                      <input
                        className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                        type="text"
                        id="direccion"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              {tab === 'otros' && (
                <div className='modal2-content'>
                  <div className="form-row">
                    <div className="form-group">
                      <label className='text-sm font-bold text-black' htmlFor="ruc">RUC:</label>
                      <input
                        className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5 wider2-input'
                        type="text"
                        id="ruc-dni"
                        value={ruc}
                        onChange={(e) => setRuc(e.target.value)}
                      />
                    </div>
                    <div className="items-center justify-center pt-5">
                      <button className="sunat-button rounded-lg border p-2.5">SUNAT</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className='text-sm font-bold text-black' htmlFor="razonsocial">Razón Social:</label>
                    <input
                      className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                      type="text"
                      id="razonsocial"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                    />
                  </div>
                  <div className="w-full text-start mb-5">
                    <label className='text-sm font-bold text-black' htmlFor="direccion">Dirección:</label>
                    <div className="flex items-center">
                      <input
                        className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5'
                        type="text"
                        id="direccion"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="modal-buttons">
                <ButtonClose onClick={onClose} />
                <ButtonSave type="submit" />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

ClienteForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ClienteForm;
