import React, { useState, useEffect } from "react";
import {
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    RadioGroup,
    Radio,
    Select,
    SelectItem
} from "@nextui-org/react";
import { IoIosSearch } from "react-icons/io";
import { toast, Toaster } from "react-hot-toast";
import useUpdateClient from "../data/updateCliente";

const inputStyles = {
    base: "border-none",
    input: "focus:ring-0",
    innerWrapper: "focus:ring-0",
    inputWrapper: "border-1 border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-0"
};

const token_cliente = import.meta.env.VITE_TOKEN_PROOVEDOR || '';

export default function EditClientModal({ open, onClose, client, onClientUpdated }) {
    const [clientType, setClientType] = useState(client?.clientType || "personal");
    const [documentType, setDocumentType] = useState(client?.documentType || "dni");
    const [documentNumber, setDocumentNumber] = useState(client?.documentNumber || "");
    const [clientName, setClientName] = useState(client?.clientName || "");
    const [clientLastName, setClientLastName] = useState(client?.clientLastName || "");
    const [businessName, setBusinessName] = useState(client?.businessName || "");
    const [address, setAddress] = useState(client?.address || "");
    const { updateClient, isLoading } = useUpdateClient();

    useEffect(() => {
        if (client) {
            setClientType(client.clientType);
            setDocumentType(client.documentType);
            setDocumentNumber(client.documentNumber);
            setClientName(client.clientName);
            setClientLastName(client.clientLastName);
            setBusinessName(client.businessName);
            setAddress(client.address);
        }
    }, [client]);

    useEffect(() => {
        if (clientType === "personal") {
            setDocumentType("dni");
            setBusinessName("");
        } else {
            setDocumentType("ruc");
            setClientName("");
            setClientLastName("");
        }
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
            toast.error('Error al consultar el documento. Verifique su conexión y el número ingresado.');
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
            id: client.id, // Se requiere el id para actualizar
            clientType,
            documentNumber: documentNumber.trim(),
            clientName,
            clientLastName,
            businessName,
            address
        };

        const result = await updateClient(clientData);
        if (result.success) {
            toast.success('Cliente actualizado exitosamente');
            if (onClientUpdated) onClientUpdated();
            handleClose();
        } else {
            toast.error('Error al actualizar el cliente: ' + result.error);
        }
    };

    const handleClose = () => {
        if (client) {
            setClientType(client.clientType);
            setDocumentType(client.documentType);
            setDocumentNumber(client.documentNumber);
            setClientName(client.clientName);
            setClientLastName(client.clientLastName);
            setBusinessName(client.businessName);
            setAddress(client.address);
        }
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
                            <ModalHeader>Editar cliente</ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-gray-600">
                                    Actualice los datos del cliente. Los campos obligatorios están marcados con *.
                                </p>

                                <RadioGroup
                                    label="Tipo de Cliente"
                                    orientation="horizontal"
                                    value={clientType}
                                    onValueChange={setClientType}
                                    className="mt-2"
                                >
                                    <Radio value="personal">Personal</Radio>
                                    <Radio value="business">Empresa</Radio>
                                </RadioGroup>

                                <div className="flex flex-col gap-3 mt-2">
                                    <Select
                                        label="Tipo de documento"
                                        selectedKeys={[documentType]}
                                        isRequired
                                        isDisabled
                                        className="max-w-xs"
                                    >
                                        {clientType === "personal" ? (
                                            <SelectItem key="dni" value="dni">
                                                DNI
                                            </SelectItem>
                                        ) : (
                                            <SelectItem key="ruc" value="ruc">
                                                RUC
                                            </SelectItem>
                                        )}
                                    </Select>

                                    <div className="flex gap-2">
                                        <Input
                                            label="Número de documento"
                                            placeholder={`Ingrese ${documentType.toUpperCase()}`}
                                            value={documentNumber}
                                            onChange={(e) => setDocumentNumber(e.target.value)}
                                            isRequired
                                            classNames={inputStyles}
                                        />
                                        <Button
                                            isIconOnly
                                            color="primary"
                                            className="mt-1"
                                            onPress={handleValidate}
                                            title={`Buscar ${documentType.toUpperCase()}`}
                                        >
                                            <div className="flex items-center gap-1">
                                                <IoIosSearch className="h-4 w-4" />
                                            </div>
                                        </Button>
                                    </div>

                                    {clientType === "personal" ? (
                                        <>
                                            <Input
                                                label="Nombres"
                                                placeholder="Ingrese nombres"
                                                value={clientName}
                                                onChange={(e) => setClientName(e.target.value)}
                                                isRequired
                                                classNames={inputStyles}
                                            />
                                            <Input
                                                label="Apellidos"
                                                placeholder="Ingrese apellidos"
                                                value={clientLastName}
                                                onChange={(e) => setClientLastName(e.target.value)}
                                                isRequired
                                                classNames={inputStyles}
                                            />
                                        </>
                                    ) : (
                                        <Input
                                            label="Razón social"
                                            placeholder="Ingrese razón social"
                                            value={businessName}
                                            onChange={(e) => setBusinessName(e.target.value)}
                                            isRequired
                                            classNames={inputStyles}
                                        />
                                    )}

                                    <Input
                                        label="Dirección"
                                        placeholder="Ingrese dirección"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        classNames={inputStyles}
                                    />
                                </div>
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
                                        // Reinicia los campos al valor original recibido en client
                                        if (client) {
                                            setDocumentNumber(client.documentNumber || "");
                                            setClientName(client.clientName || "");
                                            setClientLastName(client.clientLastName || "");
                                            setBusinessName(client.businessName || "");
                                            setAddress(client.address || "");
                                        }
                                    }}
                                >
                                    Limpiar
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleSave}
                                    isLoading={isLoading}
                                >
                                    {isLoading ? "Actualizando..." : "Actualizar cliente"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}