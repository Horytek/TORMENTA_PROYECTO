import React, { useState, useEffect } from 'react';
import './AgregarSucursal.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { toast, Toaster } from 'react-hot-toast';
import useVendedoresData from '../../data/data_vendedores'; 

const EditarSucursal = ({ isOpen, onClose, titulo, sucursal, onGuardar }) => {
  if (!isOpen) return null;

  const { vendedores } = useVendedoresData();

  const [dniVendedor, setDniVendedor] = useState(sucursal?.dni_vendedor || '');
  const [filtroVendedor, setFiltroVendedor] = useState('');

  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('');

  const [formData, setFormData] = useState({
    nombre_sucursal: sucursal?.nombre_sucursal || '',
    ubicacion: sucursal?.ubicacion || '',
    estado_sucursal: sucursal?.estado_sucursal || '1',
  });

  const [errors, setErrors] = useState({
    nombre_sucursal: false,
    ubicacion: false,
  });

  const vendedoresFiltrados = vendedores.filter((vendedor) =>
    vendedor.nombre.toLowerCase().includes(filtroVendedor.toLowerCase()) ||
    vendedor.dni.includes(filtroVendedor)
  );
  useEffect(() => {
    if (sucursal && sucursal.dni_vendedor) {
      const vendedorAsociado = vendedores.find((v) => v.dni === sucursal.dni_vendedor);
      if (vendedorAsociado) {
        setVendedorSeleccionado(`${vendedorAsociado.nombre} (${vendedorAsociado.dni})`);
        setDniVendedor(vendedorAsociado.dni);
      }
    }
  }, [sucursal, vendedores]);
  
  const handleSeleccionVendedor = (vendedor) => {
    setDniVendedor(vendedor.dni); 
    setVendedorSeleccionado(`${vendedor.nombre} (${vendedor.dni})`); 
    setFiltroVendedor(''); 
  };
  const validarFormulario = () => {
    const nuevosErrores = {
      nombre_sucursal: formData.nombre_sucursal.trim() === '',
      ubicacion: formData.ubicacion.trim() === '',
      dni_vendedor: dniVendedor.trim() === '',
    };
  
    setErrors(nuevosErrores);
  
    if (Object.values(nuevosErrores).some((error) => error)) {
      toast.error('Por favor, complete todos los campos obligatorios.');
      return false; 
    }
  
    return true; 
  };
  const handleGuardar = () => {
    if (!validarFormulario()) {
      return; 
    }
  
    const sucursalActualizada = {
      id: sucursal.id,
      dni: dniVendedor,
      nombre_sucursal: formData.nombre_sucursal,
      ubicacion: formData.ubicacion,
      estado_sucursal: formData.estado_sucursal,
    };
  
    console.log(sucursalActualizada);
    onGuardar(sucursalActualizada); 
  };

  return (
    <div className="modal-overlay-proovedor">
      <Toaster />
      <div className="modal-proovedor">
        <div className="modal-header-proovedor">
          <h2 className='modal-title-proovedor'>{titulo}</h2>
          <button className="" onClick={onClose}>
            <IoMdClose className='text-3xl' />
          </button>
        </div>
        <br />
        <div className="modal-body-proovedor">
          <form onSubmit={(e) => { e.preventDefault(); handleGuardar(); }}>
            <div className="form-group">
              <label className='text-sm font-bold text-black' htmlFor="dniVendedor">Vendedor:</label>
              <div className="combobox-container">
                <input
                  type="text"
                  placeholder="Buscar vendedor por nombre o DNI..."
                  value={vendedorSeleccionado || filtroVendedor}
                  onChange={(e) => {
                    setFiltroVendedor(e.target.value);
                    setVendedorSeleccionado(''); 
                  }}
                  className="combobox-input"
                />
                {filtroVendedor && (
                  <ul className="combobox-list">
                    {vendedoresFiltrados.map((vendedor) => (
                      <li
                        key={vendedor.dni}
                        onClick={() => handleSeleccionVendedor(vendedor)}
                        className="combobox-item"
                      >
                        {vendedor.nombre} ({vendedor.dni})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className='text-sm font-bold text-black' htmlFor="nombre_sucursal">Nombre de la Sucursal:</label>
              <input
                className={`w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border ${errors.nombre_sucursal ? 'border-red-500' : ''}`}
                type="text"
                id="nombre_sucursal"
                placeholder="Ej: Sucursal Principal"
                value={formData.nombre_sucursal}
                onChange={(e) => setFormData({ ...formData, nombre_sucursal: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className='text-sm font-bold text-black' htmlFor="ubicacion">Ubicación:</label>
              <input
                className={`w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border ${errors.ubicacion ? 'border-red-500' : ''}`}
                type="text"
                id="ubicacion"
                placeholder="Ej: Av. Los Olivos 123"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className='text-sm font-bold text-black' htmlFor="estado_sucursal">Estado:</label>
              <select
                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border'
                id="estado_sucursal"
                value={formData.estado_sucursal}
                onChange={(e) => setFormData({ ...formData, estado_sucursal: e.target.value })}
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>

            <div className='modal-buttons mt-4'>
              <ButtonClose onClick={onClose} />
              <ButtonSave onClick={handleGuardar}/>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarSucursal;