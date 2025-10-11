import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from '@heroui/react';
import { toast, Toaster } from 'react-hot-toast';
import { insertDestinatario } from '@/services/destinatario.services';

export default function AgregarProveedorModal({ isOpen, onClose, onProveedorAdded }) {
  const [dniOrRuc, setDniOrRuc] = useState('');
  const [tipoCliente, setTipoCliente] = useState('');
  const [formData, setFormData] = useState({
    provider: '',
    address: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState({
    dniOrRuc: false,
    phone: false,
    email: false,
  });

  // Definir el título del modal
  const titulo = tipoCliente === 'Natural' ? 'Cliente Natural' : 
                 tipoCliente === 'Juridico' ? 'Cliente Jurídico' : 
                 'Destinatario';

  const handleGuardarAction = async () => {
    const data = {
      ruc: tipoCliente === 'Juridico' ? dniOrRuc : null,
      dni: tipoCliente === 'Natural' ? dniOrRuc : null,
      nombres: tipoCliente === 'Natural' ? formData.provider.split(' ').slice(0, -2).join(' ') : null,
      apellidos: tipoCliente === 'Natural' ? formData.provider.split(' ').slice(-2).join(' ') : null,
      razon_social: tipoCliente === 'Juridico' ? formData.provider : null,
      ubicacion: formData.address || null,
      telefono: formData.phone || null,
      correo: formData.email || null,
    };

    const result = await insertDestinatario(data);

    if (result.success) {
      toast.success('Destinatario insertado correctamente.');
      handleClear();
      onClose();
      // Llamar al callback para actualizar la lista local
      if (onProveedorAdded) {
        onProveedorAdded(result.data || data);
      }
    } else {
      toast.error('Asegúrese de que los campos sean correctos o que el destinatario no esté registrado.');
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
          if (data.success === true || data.ruc) {
            if (tipoCliente === 'Natural') {
              setFormData({
                provider: `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`,
                address: '',
                phone: '',
                email: '',
              });
            } else if (tipoCliente === 'Juridico') {
              setFormData({
                provider: data.razonSocial,
                address: data.direccion,
                phone: '',
                email: '',
              });
            }
          } else {
            toast.error('DNI/RUC no válido');
          }
        } catch (error) {
          toast.error('DNI/RUC no válido');
        }
      }
    };

    fetchData();
  }, [dniOrRuc, tipoCliente]);

  const handleInputChange = (event) => {
    const { id, value } = event.target;
    if (id === 'ruc-dni') {
      const filteredValue = value.replace(/[^\d]/g, '').slice(0, 11);
      setDniOrRuc(filteredValue);
      setTipoCliente(filteredValue.length === 8 ? 'Natural' : filteredValue.length === 11 ? 'Juridico' : '');
    } else {
      setFormData((prevState) => ({ ...prevState, [id]: value }));
    }
  };

  const handleValidation = () => {
    const newErrors = { dniOrRuc: false, phone: false, email: false };

    if (dniOrRuc.length === 0 || !/^\d+$/.test(dniOrRuc)) {
      newErrors.dniOrRuc = true;
      toast.error('DNI/RUC no válido');
    }

    if (formData.phone && !/^(\d|-)*$/.test(formData.phone)) {
      newErrors.phone = true;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = true;
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error);
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Toaster />
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-bold">Agregar {titulo}</h2>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <Input
                label="RUC/DNI"
                id="ruc-dni"
                placeholder="Ej: 12345678"
                value={dniOrRuc}
                onChange={handleInputChange}
                isInvalid={errors.dniOrRuc}
                errorMessage="DNI/RUC no válido"
              />
            </div>
            <Input
              label="Proveedor"
              id="provider"
              placeholder="Ej: Jorge Saldarriaga Vignolo"
              value={formData.provider}
              onChange={handleInputChange}
            />
            <Input
              label="Dirección"
              id="address"
              placeholder="Ej: Los Amautas"
              value={formData.address}
              onChange={handleInputChange}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                id="phone"
                placeholder="Ej: 123456789"
                value={formData.phone}
                onChange={handleInputChange}
                isInvalid={errors.phone}
                errorMessage="Teléfono no válido"
              />
              <Input
                label="Email"
                id="email"
                placeholder="Ej: jperez21@gmail.com"
                value={formData.email}
                onChange={handleInputChange}
                isInvalid={errors.email}
                errorMessage="Email no válido"
              />
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" color="default" onPress={handleClear}>
            Limpiar
          </Button>
          <Button variant="light" color="default" onPress={onClose}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};