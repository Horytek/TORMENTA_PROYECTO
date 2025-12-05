import React, { useState, useRef } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button
} from "@heroui/react";
import { FaCloudUploadAlt, FaFileExcel, FaCheckCircle, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import { insertDestinatarioNatural, insertDestinatarioJuridico } from '@/services/destinatario.services';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

const ProveedoresImportModal = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (file) => {
        if (!file) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            toast.error("Por favor, sube un archivo Excel válido (.xlsx o .xls)");
            return;
        }

        setFile(file);
        setResult(null);
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                documento: "12345678",
                razon_social: "Juan Perez",
                direccion: "Av. Principal 123",
                email: "juan@example.com",
                telefono: "999888777",
                ubicacion: "Lima"
            },
            {
                documento: "20123456789",
                razon_social: "Empresa SAC",
                direccion: "Calle Industrial 456",
                email: "contacto@empresa.com",
                telefono: "01234567",
                ubicacion: "Arequipa"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla Proveedores");
        XLSX.writeFile(workbook, "plantilla_proveedores.xlsx");
    };

    const handleImport = async () => {
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    setResult({ success: false, message: "El archivo está vacío." });
                    setIsLoading(false);
                    return;
                }

                let successCount = 0;
                let errorCount = 0;
                const errors = [];

                for (const [index, row] of jsonData.entries()) {
                    const documento = String(row.documento || "").trim();
                    const nombre = row.razon_social || row.nombre || "";

                    if (!documento || !nombre) {
                        errorCount++;
                        errors.push(`Fila ${index + 2}: Falta documento o razón social.`);
                        continue;
                    }

                    const destinatarioData = {
                        documento: documento,
                        destinatario: nombre,
                        direccion: row.direccion || "",
                        email: row.email || "",
                        telefono: String(row.telefono || ""),
                        ubicacion: row.ubicacion || ""
                    };

                    let res;
                    if (documento.length === 8) {
                        res = await insertDestinatarioNatural(destinatarioData);
                    } else if (documento.length === 11) {
                        res = await insertDestinatarioJuridico(destinatarioData);
                    } else {
                        errorCount++;
                        errors.push(`Fila ${index + 2}: Documento inválido (${documento}). Debe tener 8 o 11 dígitos.`);
                        continue;
                    }

                    if (res && res[0]) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`Fila ${index + 2}: Error al guardar ${nombre}.`);
                    }
                }

                if (successCount > 0) {
                    setResult({
                        success: true,
                        message: `Se importaron ${successCount} proveedores correctamente. ${errorCount > 0 ? `Fallaron ${errorCount}.` : ''}`,
                        details: { errors }
                    });
                    onSuccess();
                } else {
                    setResult({
                        success: false,
                        message: "No se pudo importar ningún proveedor.",
                        details: { errors }
                    });
                }

            } catch (error) {
                //console.error(error);
                setResult({ success: false, message: "Error al procesar el archivo." });
            } finally {
                setIsLoading(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const resetModal = () => {
        setFile(null);
        setResult(null);
        setIsLoading(false);
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="2xl"
            backdrop="blur"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaFileExcel className="text-green-600" />
                        Importar Proveedores desde Excel
                    </h2>
                    <p className="text-sm text-gray-500 font-normal">
                        Sube un archivo Excel para crear proveedores masivamente.
                    </p>
                </ModalHeader>
                <ModalBody>
                    {!result ? (
                        <div className="space-y-6">
                            {/* Template Download Section */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">¿No tienes el formato?</h3>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                        Descarga la plantilla con las columnas requeridas: documento, razon_social, direccion, email, telefono, ubicacion.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    startContent={<FaDownload />}
                                    onClick={handleDownloadTemplate}
                                >
                                    Descargar Plantilla
                                </Button>
                            </div>

                            {/* Upload Area */}
                            <div
                                className={`
                                    border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                                    ${isDragging
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                    }
                                    ${file ? 'bg-green-50 dark:bg-green-900/10 border-green-300' : ''}
                                `}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileSelect}
                                />

                                {file ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-3xl">
                                            <FaFileExcel />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            color="danger"
                                            variant="light"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                        >
                                            Cambiar archivo
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 py-4">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 text-3xl">
                                            <FaCloudUploadAlt />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                                Arrastra tu archivo aquí o haz clic para buscar
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Soporta archivos .xlsx y .xls
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg border flex items-start gap-3 ${result.success
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                }`}>
                                {result.success ? (
                                    <FaCheckCircle className="text-green-600 text-xl mt-0.5" />
                                ) : (
                                    <FaExclamationTriangle className="text-red-600 text-xl mt-0.5" />
                                )}
                                <div>
                                    <h3 className={`font-bold ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                        {result.success ? 'Importación Completada' : 'Error en la Importación'}
                                    </h3>
                                    <p className="text-sm mt-1 opacity-90">
                                        {result.message}
                                    </p>
                                </div>
                            </div>

                            {result.details && result.details.errors && result.details.errors.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Detalle de errores:</h4>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700">
                                        <ul className="space-y-1">
                                            {result.details.errors.map((err, idx) => (
                                                <li key={idx} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                                                    <span className="mt-0.5">•</span>
                                                    <span>{err}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={handleClose}>
                        {result ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!result && (
                        <Button
                            color="primary"
                            onPress={handleImport}
                            isLoading={isLoading}
                            isDisabled={!file}
                            startContent={!isLoading && <FaCloudUploadAlt />}
                        >
                            Importar Proveedores
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ProveedoresImportModal;
