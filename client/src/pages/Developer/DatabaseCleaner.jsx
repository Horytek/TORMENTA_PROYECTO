import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Button, Switch, Input, Divider, Select, SelectItem } from "@heroui/react";
import { AlertTriangle, Trash2, Database, AlertCircle, Building2 } from 'lucide-react';
import axios from '@/api/axios';
import { toast } from 'react-hot-toast';

const DatabaseCleaner = () => {
    const [config, setConfig] = useState({
        clean_sales: false,
        clean_movements: false,
        clean_stock: false,
        clean_products: false,
    });
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");

    // Safety confirm
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await axios.get('/empresa');
                if (response.data.code === 1) {
                    setCompanies(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
                toast.error("No se pudieron cargar las empresas");
            }
        };
        fetchCompanies();
    }, []);

    const handleSwitch = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleClean = async () => {
        if (!selectedCompany) {
            toast.error("Por favor selecciona una empresa objetivo.");
            return;
        }

        if (confirmText !== 'ELIMINAR DATOS') {
            toast.error("Por favor escribe 'ELIMINAR DATOS' para confirmar.");
            return;
        }

        if (!config.clean_sales && !config.clean_movements && !config.clean_stock) {
            toast.error("Selecciona al menos una opción para limpiar.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.delete('/developer/clear-data', {
                data: {
                    ...config,
                    password: 'dev1234',
                    target_tenant_id: selectedCompany
                }
            });

            if (response.data.code === 1) {
                toast.success("Limpieza de datos completada correctamente.");
                setConfirmText('');
                setConfig({
                    clean_sales: false,
                    clean_movements: false,
                    clean_stock: false,
                    clean_products: false
                });
            } else {
                toast.error("Error al limpiar datos: " + response.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/20">
                    <Database className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Limpiador de Base de Datos</h1>
                    <p className="text-muted-foreground text-gray-500">Herramienta para desarrolladores. Elimina datos de prueba de forma recursiva.</p>
                </div>
            </div>

            {/* Company Selection */}
            <Card className="border-blue-200 dark:border-blue-900 shadow-md">
                <CardHeader className="flex gap-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <div className="flex flex-col">
                        <p className="text-md font-bold text-blue-600">Selección de Empresa (Tenant)</p>
                        <p className="text-small text-default-500">Selecciona la empresa donde se ejecutarán las acciones.</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <Select
                        label="Empresa Objetivo"
                        placeholder="Selecciona una empresa"
                        variant="bordered"
                        selectedKeys={selectedCompany ? [selectedCompany] : []}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        startContent={<Building2 className="w-4 h-4 text-default-400" />}
                    >
                        {companies.map((company) => (
                            <SelectItem key={company.id_empresa} textValue={company.nombreComercial || company.razonSocial}>
                                {company.nombreComercial || company.razonSocial} (ID: {company.id_empresa})
                            </SelectItem>
                        ))}
                    </Select>
                </CardBody>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-red-200 dark:border-red-900 shadow-md">
                    <CardHeader className="flex gap-3">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                        <div className="flex flex-col">
                            <p className="text-md font-bold text-red-600">Zona de Peligro</p>
                            <p className="text-small text-default-500">Selecciona los módulos a limpiar. Irreversible.</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-6">

                        {/* Option 1: Sales */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="space-y-1">
                                <p className="text-medium font-semibold">Limpiar Ventas y Caja</p>
                                <p className="text-tiny text-default-500">
                                    Elimina facturas, boletas, notas venta, caja (excepto movimientos iniciales).
                                </p>
                            </div>
                            <Switch
                                isSelected={config.clean_sales}
                                onValueChange={(v) => handleSwitch('clean_sales', v)}
                                color="danger"
                            />
                        </div>

                        {/* Option 2: Movements */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="space-y-1">
                                <p className="text-medium font-semibold">Limpiar Movimientos (Notas)</p>
                                <p className="text-tiny text-default-500">
                                    Elimina notas de entrada/salida y detalles.
                                </p>
                            </div>
                            <Switch
                                isSelected={config.clean_movements}
                                onValueChange={(v) => handleSwitch('clean_movements', v)}
                                color="danger"
                            />
                        </div>

                        {/* Option 3: Stock */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="space-y-1">
                                <p className="text-medium font-semibold">Resetear Stock a Cero</p>
                                <p className="text-tiny text-default-500">
                                    Pone stock en 0 y limpia kárdex/bitácora.
                                </p>
                            </div>
                            <Switch
                                isSelected={config.clean_stock}
                                onValueChange={(v) => handleSwitch('clean_stock', v)}
                                color="danger"
                            />
                        </div>

                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex gap-3">
                        <div className="flex flex-col">
                            <p className="text-md font-bold">Confirmación</p>
                            <p className="text-small text-default-500">Para proceder, confirma tu intención.</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-900 flex gap-3 text-amber-800 dark:text-amber-200 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>Asegúrate de tener un respaldo. Estos cambios afectan reportes y contabilidad.</p>
                        </div>

                        <div className="space-y-4 pt-2">
                            <Input
                                label='Confirma escribiendo "ELIMINAR DATOS"'
                                placeholder="ELIMINAR DATOS"
                                value={confirmText}
                                onValueChange={setConfirmText}
                                variant="bordered"
                                color={confirmText === 'ELIMINAR DATOS' ? "success" : "default"}
                                size="lg"
                                labelPlacement="outside"
                                classNames={{
                                    input: "h-10",
                                    inputWrapper: "h-14 py-2"
                                }}
                            />
                        </div>

                        <Button
                            color="danger"
                            className="w-full mt-2"
                            onPress={handleClean}
                            isDisabled={loading || confirmText !== 'ELIMINAR DATOS' || !selectedCompany}
                            startContent={!loading && <Trash2 className="w-4 h-4" />}
                            isLoading={loading}
                        >
                            {loading ? "Limpiando..." : "Ejecutar Limpieza"}
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default DatabaseCleaner;
