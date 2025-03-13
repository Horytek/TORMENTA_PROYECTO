import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  useDisclosure,
  Tabs,
  Tab,
} from "@nextui-org/react";
import { IoIosSearch } from "react-icons/io";
import { useAddClient } from '../data/addCliente';
import { toast, Toaster } from "react-hot-toast"; // Updated import

const inputStyles = {
  base: "border-none",
  input: "focus:ring-0",
  innerWrapper: "focus:ring-0",
  inputWrapper: "border-1 border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-0"
};

const token_cliente = import.meta.env.VITE_TOKEN_PROOVEDOR || '';
  
export default function AddClientModal({ open, onClose, onClientCreated, refetch }) {
  const [clientType, setClientType] = useState("personal");
  const [documentType, setDocumentType] = useState("dni");
  const [documentNumber, setDocumentNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const { addClient, isLoading } = useAddClient();

  useEffect(() => {
    if (clientType === "personal") {
      setDocumentType("dni");
      setBusinessName("");
      if (documentNumber.length === 11) { 
        setDocumentNumber("");
      }
    } else {
      setDocumentType("ruc");
      setClientName("");
      setClientLastName("");
      if (documentNumber.length === 8) { 
        setDocumentNumber("");
      }
    }
    setAddress("");
  }, [clientType]);

  const handleValidate = async () => {
    const cleanDocumentNumber = documentNumber.trim().replace(/\s+/g, '');
    
    if (cleanDocumentNumber === '') {
      toast.error('El número de documento es obligatorio');
      return;
    }
  
    const url = documentType === 'dni'
      ? `https://dniruc.apisperu.com/api/v1/dni/${cleanDocumentNumber}?token=${token_cliente}`
      : `https://dniruc.apisperu.com/api/v1/ruc/${cleanDocumentNumber}?token=${token_cliente}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (documentType === 'dni') {
        if (data && data.nombres) {
          setClientName(data.nombres);
          setClientLastName(`${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`);
          setClientType("personal");
        } else {
          toast.error('No se encontraron datos para el DNI proporcionado');
          setClientName('');
          setClientLastName('');
        }
      } else {
        if (data && data.razonSocial) {
          setBusinessName(data.razonSocial);
          setClientType("business");
          setAddress(data.direccion || '');
        } else {
          toast.error('No se encontraron datos para el RUC proporcionado');
          setBusinessName('');
          setAddress('');
        }
      }
    } catch (error) {
      console.error('Error al validar el documento:', error);
      toast.error('Error al consultar el documento. Por favor, verifique su conexión y el número ingresado.');
    }
  };

  const handleSave = async () => {
    if (!documentNumber.trim()) {
      toast.error('El número de documento es obligatorio');
      return;
    }

    if (clientType === 'personal' && (!clientName || !clientLastName)) {
      toast.error('Los nombres y apellidos son obligatorios');
      return;
    }

    if (clientType === 'business' && !businessName) {
      toast.error('La razón social es obligatoria');
      return;
    }

    const clientData = {
      clientType,
      documentNumber: documentNumber.trim(),
      clientName,
      clientLastName,
      businessName,
      address
    };

    const result = await addClient(clientData);

    if (result.success) {
      toast.success('Cliente guardado exitosamente');
      if (refetch) await refetch(); 
      if (onClientCreated) onClientCreated();
      handleClose();
    } else {
      toast.error('Error al guardar el cliente: ' + result.error);
    }
  };

  const handleClose = () => {
    setDocumentNumber('');
    setClientName('');
    setClientLastName('');
    setBusinessName('');
    setAddress('');
    onClose();
  };

  return (
    <>
      <Toaster />
      <Modal
        backdrop="opaque"
        isOpen={open}
        onOpenChange={(value) => {
          if (!value) handleClose();
        }}
      >
        <ModalContent>
          {(closeModal) => (
            <>
              <ModalHeader>Agregar nuevo cliente</ModalHeader>
              <ModalBody>
                <p className="text-sm text-gray-600">
                  Ingrese los datos del cliente. Los campos obligatorios están marcados con *.
                </p>

                <Tabs
                  selectedKey={clientType}
                  onSelectionChange={setClientType}
                  className="mt-2"
                  aria-label="Tipo de Cliente"
                >
                  <Tab key="personal" title="Personal">
                    <div className="mt-4">
                      <div className="flex flex-col gap-3">
                        <Select
                          label="Tipo de documento"
                          selectedKeys={[documentType]}
                          onChange={(e) => setDocumentType(e.target.value)}
                          isRequired
                          isDisabled
                        >
                          <SelectItem key="dni" value="dni">DNI</SelectItem>
                        </Select>

                        <div className="flex gap-2">
                          <Input 
                            label="Número de documento"
                            placeholder="Ingrese DNI"
                            value={documentNumber}
                            onChange={(e) => setDocumentNumber(e.target.value)}
                            isRequired
                            classNames={inputStyles}
                            style={{  border: "none",
                              boxShadow: "none",
                              outline: "none", }}
                          />
                          <Button
                            isIconOnly
                            color="primary"
                            className="mt-1"
                            onPress={handleValidate}
                            title="Buscar DNI"
                          >
                            <div className="flex items-center gap-1">
                              <IoIosSearch className="h-4 w-4" />
                            </div>
                          </Button>
                        </div>

                        <Input
                          label="Nombres"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          isRequired
                          isDisabled
                          classNames={inputStyles}
                          style={{  border: "none",
                            boxShadow: "none",
                            outline: "none", }}
                          
                        />
                        <Input
                          label="Apellidos"
                          value={clientLastName}
                          onChange={(e) => setClientLastName(e.target.value)}
                          isRequired
                          isDisabled
                          classNames={inputStyles}
                          style={{  border: "none",
                            boxShadow: "none",
                            outline: "none", }}
                        />
                        <Input
                          label="Dirección"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          classNames={inputStyles}
                          style={{  border: "none",
                            boxShadow: "none",
                            outline: "none", }}
                        />
                      </div>
                    </div>
                  </Tab>
                  <Tab key="business" title="Empresa">
                    <div className="mt-4">
                      <div className="flex flex-col gap-3">
                        <Select 
                          label="Tipo de documento"
                          selectedKeys={[documentType]}
                          onChange={(e) => setDocumentType(e.target.value)}
                          isRequired
                          isDisabled
                        >
                          <SelectItem key="ruc" value="ruc">RUC</SelectItem>
                        </Select>

                        <div className="flex gap-2">
                          <Input 
                            label="Número de documento"
                            placeholder="Ingrese RUC"
                            value={documentNumber}
                            onChange={(e) => setDocumentNumber(e.target.value)}
                            isRequired
                            classNames={inputStyles}
                            style={{  border: "none",
                              boxShadow: "none",
                              outline: "none", }}
                          />
                          <Button
                            isIconOnly
                            color="primary"
                            className="mt-1"
                            onPress={handleValidate}
                            title="Buscar RUC"
                          >
                            <div className="flex items-center gap-1">
                              <IoIosSearch className="h-4 w-4" />
                            </div>
                          </Button>
                        </div>

                        <Input
                          label="Razón social"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          isRequired
                          isDisabled
                          classNames={inputStyles}
                          style={{  border: "none",
                            boxShadow: "none",
                            outline: "none", }}
                        />
                        <Input
                          label="Dirección"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          classNames={inputStyles}
                          style={{  border: "none",
                            boxShadow: "none",
                            outline: "none", }}
                        />
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    closeModal();
                    handleClose();
                  }}
                >
                  Cerrar
                </Button>
                <Button
                  color="warning"
                  variant="flat"
                  onPress={() => {
                    setDocumentNumber('');
                    setClientName('');
                    setClientLastName('');
                    setBusinessName('');
                    setAddress('');
                  }}
                >
                  Limpiar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar cliente'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}