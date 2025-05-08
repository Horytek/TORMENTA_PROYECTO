import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
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

const EditarSucursal = ({ isOpen, onClose, titulo, sucursal, onGuardar }) => {
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

  useEffect(() => {
    if (sucursal && sucursal.dni_vendedor) {
      const vendedorAsociado = vendedores.find((v) => v.dni === sucursal.dni_vendedor);
      if (vendedorAsociado) {
        setVendedorSeleccionado(`${vendedorAsociado.nombre} (${vendedorAsociado.dni})`);
        setDniVendedor(vendedorAsociado.dni);
      }
    }

    // Update form data when sucursal changes
    if (sucursal) {
      setFormData({
        nombre_sucursal: sucursal.nombre_sucursal || '',
        ubicacion: sucursal.ubicacion || '',
        estado_sucursal: sucursal.estado_sucursal || '1',
      });
    }
  }, [sucursal, vendedores]);
  
  const handleSeleccionVendedor = (key) => {
    const vendedor = vendedores.find(v => v.dni === key);
    if (vendedor) {
      setDniVendedor(vendedor.dni);
      setVendedorSeleccionado(`${vendedor.nombre} (${vendedor.dni})`);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validarFormulario = () => {
    const nuevosErrores = {
      nombre_sucursal: formData.nombre_sucursal.trim() === '',
      ubicacion: formData.ubicacion.trim() === '',
    };
  
    setErrors(nuevosErrores);
  
    if (Object.values(nuevosErrores).some((error) => error)) {
      toast.error('Por favor, complete los campos obligatorios.');
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
  
    onGuardar(sucursalActualizada); 
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
                {titulo}
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
                  onPress={handleGuardar}
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

export default EditarSucursal;