import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import insertSucursal from '../../data/add_sucursal';
import useVendedoresData from '../../data/data_vendedores';
import { 
  Input,
  Button,
  Autocomplete,
  AutocompleteItem
} from "@heroui/react";
import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Select,
  SelectItem
} from "@nextui-org/react";

const AgregarSucursal = ({ isOpen, onClose, titulo }) => {
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

  const handleSeleccionVendedor = (key) => {
    const vendedor = vendedores.find(v => v.dni === key);
    if (vendedor) {
      setDniVendedor(vendedor.dni);
      setVendedorSeleccionado(`${vendedor.nombre} (${vendedor.dni})`);
    }
  };

  const handleGuardarAction = async () => {
    if (!handleValidation()) return;

    const data = {
      dni: dniVendedor || null,
      nombre_sucursal: formData.nombre_sucursal,
      ubicacion: formData.ubicacion,
      estado_sucursal: formData.estado_sucursal,
    };

    const result = await insertSucursal(data);

    if (result.success) {
      toast.success('Sucursal añadida correctamente.');
      handleClear();
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      toast.error('Asegúrese que los campos sean correctos o que la sucursal no esté registrada.');
    }
  };

  const handleInputChange = (id, value) => {
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
    setVendedorSeleccionado('');
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
    <>
      <Toaster />
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="md"
        
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {titulo} sucursal
              </ModalHeader>
              <ModalBody>
                <Autocomplete
                  label="Vendedor"
                  placeholder="Buscar vendedor por nombre o DNI..."
                  defaultItems={vendedores}
                  inputValue={vendedorSeleccionado || filtroVendedor}
                  onInputChange={setFiltroVendedor}
                  onSelectionChange={handleSeleccionVendedor}
                  className="mb-4"
                >
                  {(vendedor) => (
                    <AutocompleteItem key={vendedor.dni} textValue={`${vendedor.nombre} (${vendedor.dni})`}>
                      {vendedor.nombre} ({vendedor.dni})
                    </AutocompleteItem>
                  )}
                </Autocomplete>

                <Input
                  label="Nombre de la Sucursal"
                  placeholder="Ej: Sucursal Principal"
                  value={formData.nombre_sucursal}
                  onChange={(e) => handleInputChange("nombre_sucursal", e.target.value)}
                  isInvalid={errors.nombre_sucursal}
                  errorMessage={errors.nombre_sucursal ? "El nombre de la sucursal es requerido" : ""}
                  isRequired
                  variant="bordered"
                  className="mb-4"
                />

                <Input
                  label="Ubicación"
                  placeholder="Ej: Av. Los Olivos 123"
                  value={formData.ubicacion}
                  onChange={(e) => handleInputChange("ubicacion", e.target.value)}
                  isInvalid={errors.ubicacion}
                  errorMessage={errors.ubicacion ? "La ubicación es requerida" : ""}
                  isRequired
                  variant="bordered"
                  className="mb-4"
                />

                <Select
                  label="Estado"
                  selectedKeys={[formData.estado_sucursal]}
                  onChange={(e) => handleInputChange("estado_sucursal", e.target.value)}
                  className="mb-2"
                  variant="bordered"
                >
                  <SelectItem key="1" value="1">Activo</SelectItem>
                  <SelectItem key="0" value="0">Inactivo</SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={onClose}
                >
                  Cancelar
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleGuardarAction}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default AgregarSucursal;