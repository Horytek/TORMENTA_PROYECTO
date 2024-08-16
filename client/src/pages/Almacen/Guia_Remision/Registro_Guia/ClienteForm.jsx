import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import './ModalGuias.css';
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import useDestNatural from '../../data/add_dest_natural';
import useDestJuridica from '../../data/add_dest_juridico';
import { Toaster, toast } from 'react-hot-toast';

function ClienteForm({ modalTitle, onClose }) {
  const [tab, setTab] = useState('registro');
  const [dniOrRuc, setDniOrRuc] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [direccion, setDireccion] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [tipoCliente, setTipoCliente] = useState('');

  useEffect(() => {
    const fetchSunatData = async () => {
      if (dniOrRuc.length === 8 || dniOrRuc.length === 11) {
        const url = tipoCliente === 'Natural'
          ? `https://dniruc.apisperu.com/api/v1/dni/${dniOrRuc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImJ1c3RhbWFudGU3NzdhQGdtYWlsLmNvbSJ9.0tadscJV_zWQqZeRMDM4XEQ9_t0f7yph4WJWNoyDHyw`
          : `https://dniruc.apisperu.com/api/v1/ruc/${dniOrRuc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImJ1c3RhbWFudGU3NzdhQGdtYWlsLmNvbSJ9.0tadscJV_zWQqZeRMDM4XEQ9_t0f7yph4WJWNoyDHyw`;

        try {
          console.log(`Consultando RUC: ${dniOrRuc}`);
          const response = await fetch(url);
          const data = await response.json();
          console.log(data);

          if (data.success === true) {
            if (tipoCliente === 'Natural') {
              setNombres(data.nombres || '');
              setApellidos(`${data.apellidoPaterno} ${data.apellidoMaterno}` || '');
              setDireccion(data.direccion || '');
            } else if (tipoCliente === 'Juridico') { // Add this check
              setRazonSocial(data.razonSocial || ''); // Set provider to razonSocial
              setDireccion(data.direccion || '');
            }
          } else {
            toast.error('DNI/RUC no válido');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Error al conectarse a SUNAT');
        }
      }
    };

    fetchSunatData();
  }, [dniOrRuc, tipoCliente]);

  const handleInputChange = (event) => {
    const { id, value } = event.target;
    if (id === 'ruc-dni') {
      const filteredValue = value.replace(/[^\d]/g, '').slice(0, tab === 'registro' ? 8 : 11);
      setDniOrRuc(filteredValue);
      setTipoCliente(filteredValue.length === 8 ? 'Natural' : filteredValue.length === 11 ? 'Juridico' : '');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (tab === 'registro') {
      if (dniOrRuc.length !== 8 || isNaN(dniOrRuc)) {
        toast.error('El DNI debe tener 8 dígitos y solo contener números.');
        return;
      }
      if (!nombres || !apellidos || !direccion) {
        toast.error('Todos los campos son obligatorios.');
        return;
      }

      const dataNatural = { dni: dniOrRuc, nombres, apellidos, ubicacion: direccion };
      const result = await useDestNatural(dataNatural, onClose);
      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success('Destinatario natural añadido exitosamente');
        onClose();
      }
    } else if (tab === 'otros') {
      if (dniOrRuc.length !== 11 || isNaN(dniOrRuc)) {
        toast.error('El RUC debe tener 11 dígitos y solo contener números.');
        return;
      }
      if (!razonSocial || !direccion) {
        toast.error('Todos los campos son obligatorios.');
        return;
      }

      const dataJuridica = { ruc: dniOrRuc, razon_social: razonSocial, ubicacion: direccion };
      const result = await useDestJuridica(dataJuridica, onClose);
      if (!result.success) {
        toast.error(result.message);
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
              <IoMdClose className='text-3xl' />
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
                      <label className='text-sm font-bold text-black' htmlFor="ruc-dni">DNI:</label>
                      <input
                        className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5 wider2-input'
                        type="text"
                        id="ruc-dni"
                        value={dniOrRuc}
                        onChange={handleInputChange}
                      />
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
                        value={dniOrRuc}
                        onChange={handleInputChange}
                      />
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
