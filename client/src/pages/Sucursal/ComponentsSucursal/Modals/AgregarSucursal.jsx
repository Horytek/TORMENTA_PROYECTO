import React, { useState, useEffect } from 'react';
import './AgregarSucursal.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { toast, Toaster } from 'react-hot-toast';
import insertSucursal from '../../data/add_sucursal';
import useVendedoresData from '../../data/data_vendedores';

const AgregarSucursal = ({ isOpen, onClose, titulo }) => {
    if (!isOpen) return null;

    const { vendedores } = useVendedoresData();
    const [dniVendedor, setDniVendedor] = useState('');
    const [filtroVendedor, setFiltroVendedor] = useState(''); 
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState('');

    const [formData, setFormData] = useState({
        nombre_sucursal: '',
        ubicacion: '',
        estado_sucursal: '1',
    });

    const [errors, setErrors] = useState({
        nombre_sucursal: false,
        ubicacion: false,
    });

    const vendedoresFiltrados = vendedores.filter((vendedor) =>
        vendedor.nombre.toLowerCase().includes(filtroVendedor.toLowerCase()) ||
        vendedor.dni.includes(filtroVendedor)
    );
    const handleSeleccionVendedor = (vendedor) => {
        setDniVendedor(vendedor.dni);
        setVendedorSeleccionado(`${vendedor.nombre} (${vendedor.dni})`); 
        setFiltroVendedor('');
    };
    const handleGuardarAction = async () => {
        const data = {
            dni: dniVendedor || null,
            nombre_sucursal: formData.nombre_sucursal,
            ubicacion: formData.ubicacion,
            estado_sucursal: formData.estado_sucursal,
        };

        console.log(data);

        const result = await insertSucursal(data);

        if (result.success) {
            toast.success('Sucursal añadida correctamente.');
            handleClear();
            onClose();
            setTimeout(() => {
                window.location.reload();
            }, 100); // 100 milisegundos de retraso
        } else {
            toast.error('Asegúrese que los campos sean correctos o que la sucursal no esté registrada.');
        }
    };

    const handleInputChange = (event) => {
        const { id, value } = event.target;
        setFormData(prevState => ({ ...prevState, [id]: value }));
    };

    const handleValidation = () => {
        const newErrors = {
            nombre_sucursal: formData.nombre_sucursal.trim() === '',
            ubicacion: formData.ubicacion.trim() === '',
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(error => error)) {
            toast.error('Por favor, complete los campos obligatorios.');
            return false;
        }
        return true;
    };

    const handleClear = () => {
        setDniVendedor('');
        setFiltroVendedor('');
        setFormData({
            nombre_sucursal: '',
            ubicacion: '',
            estado_sucursal: '1',
        });
        setErrors({
            nombre_sucursal: false,
            ubicacion: false,
        });
    };

    return (
            <div className="modal-overlay-proovedor">
                <Toaster />
                <div className="modal-proovedor">
                    <div className="modal-header-proovedor">
                        <h2 className='modal-title-proovedor'>{titulo} sucursal</h2>
                        <button className="" onClick={onClose}>
                            <IoMdClose className='text-3xl' />
                        </button>
                    </div>
                    <br />
                    <div className="modal-body-proovedor">
                        <form onSubmit={(e) => { e.preventDefault(); handleValidation() && handleGuardarAction(); }}>
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label className='text-sm font-bold text-black' htmlFor="estado_sucursal">Estado:</label>
                            <select
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border'
                                id="estado_sucursal"
                                value={formData.estado_sucursal}
                                onChange={handleInputChange}
                            >
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>

                        <div className='modal-buttons mt-4'>
                            <ButtonClose onClick={onClose} />
                            <ButtonSave onClick={handleGuardarAction}/>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AgregarSucursal;