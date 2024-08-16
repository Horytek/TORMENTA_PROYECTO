import React, { useState, useEffect } from 'react';
import './AgregarProovedor.css';
import { IoMdClose } from "react-icons/io";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { toast, Toaster } from 'react-hot-toast';
import insertDestinatario from './data/insert_destinatario';

const AgregarProovedor = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    const [dniOrRuc, setDniOrRuc] = useState('');
    const [tipoCliente, setTipoCliente] = useState('');
    const [formData, setFormData] = useState({
        provider: '',
        address: '',
        phone: '',
        email: ''
    });
    const [errors, setErrors] = useState({
        dniOrRuc: false,
        phone: false,
        email: false,
    });
    const handleGuardarAction = async () => {
        const provider = document.getElementById('provider').value;
        const DNIruc = document.getElementById('ruc-dni').value;
        const address = document.getElementById('address').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;

        const data = {
            ruc: tipoCliente === 'Juridico' ? DNIruc : null,
            dni: tipoCliente === 'Natural' ? DNIruc : null,
            nombres: tipoCliente === 'Natural' ? provider.split(' ').slice(0, -2).join(' ') : null,
            apellidos: tipoCliente === 'Natural' ? provider.split(' ').slice(-2).join(' ') : null,
            razon_social: tipoCliente === 'Juridico' ?  provider : null,
            ubicacion: address !== '' ? address : null,
            telefono: phone !== '' ? phone : null,
            correo: email !== '' ? email : null,
        };
    console.log(data);
        const result = await insertDestinatario(data);
    
        if (result.success) {
          toast.success('Destinatario insertado correctamente.');
          handleClear()
        } else {
          toast.error('Asegurese que los campos sean correctos o que el destinario no esté registrado.');
        }
      };
    useEffect(() => {
        const fetchData = async () => {
            if (dniOrRuc.length === 8 || dniOrRuc.length === 11) {
                const token_proovedor = import.meta.env.VITE_TOKEN_PROOVEDOR || '';
                const url =
                    tipoCliente === 'Natural'
                        ? `https://dniruc.apisperu.com/api/v1/dni/${dniOrRuc}?token=${token_proovedor}`
                        : `https://dniruc.apisperu.com/api/v1/ruc/${dniOrRuc}?token=${token_proovedor}`;

                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    console.log(data);
                    if (data.success === true || data.ruc ){

                        if (tipoCliente === 'Natural') {
                            setFormData({
                                provider: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`,
                                address: '',
                                phone: '',
                                email: ''
                            });
                        } else if (tipoCliente === 'Juridico') {
                            setFormData({
                                provider: data.razonSocial,
                                address: data.direccion,
                                phone: '',
                                email: ''
                            });
                        }
                    } else {
                        toast.error('DNI/RUC no válido');    
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                    toast.error('DNI/RUC no válido');
                }
            }
        };

        fetchData();
    }, [dniOrRuc, tipoCliente]);

    const handleInputChange = (event) => {
        const { id, value } = event.target;
        if (id === 'ruc-dni') {
            // Filtra los caracteres permitidos para DNI/RUC
            const filteredValue = value.replace(/[^\d]/g, '').slice(0, 11);;
            setDniOrRuc(filteredValue);
            setTipoCliente(filteredValue.length === 8 ? 'Natural' : filteredValue.length === 11 ? 'Juridico' : '');
        } else if (id === 'phone') {
            // Filtra los caracteres permitidos para teléfono
            const filteredValue = value.replace(/[^0-9-]/g, '');
            setFormData(prevState => ({ ...prevState, phone: filteredValue }));
        } else if (id === 'email') {
            setFormData(prevState => ({ ...prevState, email: value }));
        }
    };

    const handleValidation = () => {
        const newErrors = { dniOrRuc: false, phone: false, email: false };

        if (dniOrRuc.length === 0 || !/^\d+$/.test(dniOrRuc)) {
            newErrors.dniOrRuc = true;
            toast.error('DNI/RUC no válido');
        }
        
        if (!/^(\d|-)*$/.test(formData.phone)) {
            newErrors.phone = true;
        }

        if (formData.email & !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = true;
        }

        setErrors(newErrors);

        if (Object.values(newErrors).some(error => error)) {
            toast.error('Por favor, revisa los campos.');
            return false;
        }
        return true;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (handleValidation()) {
            handleGuardarAction();
        }
    };
    const handleClear = () => {
        setDniOrRuc('');
        setFormData({
            provider: '',
            address: '',
            phone: '',
            email: '',
        });
        setErrors({
            dniOrRuc: false,
            phone: false,
            email: false,
        });
    };
    return (
        <div className="modal-overlaywa">
            <Toaster />
            <div className="modalwa">
                <div className="modal-headerwa">
                    <h2 className='modal-titlewa'>Agregar proveedor</h2>
                    <button className="" onClick={onClose}>
                        <IoMdClose className='text-3xl' />
                    </button>
                </div>
                <br />
                <div className="modal-bodywa">
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className='text-sm font-bold text-black' htmlFor="ruc-dni">RUC/DNI:</label>
                                <input
                                    className={`w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border ${errors.dniOrRuc ? 'border-red-500' : ''}`}
                                    type="text"
                                    id="ruc-dni"
                                    placeholder="Ej: 12345678"
                                    value={dniOrRuc}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="items-center justify-center pt-1">
                                <button
                                    type="button"
                                    className="sunat-buttonwa rounded-lg border text-center items-center justify-center"
                                    onClick={handleInputChange}
                                >
                                    SUNAT
                                </button>
                            </div>
                            <div className="items-center justify-center pt-1">
                                <button
                                    type="button"
                                    className="sunat-buttonwa rounded-lg border text-center items-center justify-center"
                                    onClick={handleClear}
                                    style={{backgroundColor:'blue'}}
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className='text-sm font-bold text-black' htmlFor="provider">Proveedor:</label>
                            <input
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border'
                                type="text"
                                id="provider"
                                placeholder="Ej: Jorge Saldarriaga Vignolo"
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className='text-sm font-bold text-black' htmlFor="address">Dirección:</label>
                            <input
                                className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border'
                                type="text"
                                id="address"
                                placeholder="Ej: Los amautas"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className='text-sm font-bold text-black' htmlFor="phone">Teléfono:</label>
                                <input
                                    className={`w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border ${errors.phone ? 'border-red-500' : ''}`}
                                    type="text"
                                    id="phone"
                                    placeholder="Ej: 123456789"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className='text-sm font-bold text-black' htmlFor="email">Email:</label>
                                <input
                                    className={`w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border ${errors.email ? 'border-red-500' : ''}`}
                                    type="email"
                                    id="email"
                                    placeholder="Ej: jperez21@gmail.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        <div className='modal-buttons mt-4'>
                            <ButtonClose onClick={onClose} />
                            <ButtonSave />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AgregarProovedor;

