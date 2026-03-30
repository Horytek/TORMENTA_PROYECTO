import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Button, Switch, Divider, Select, SelectItem } from "@heroui/react";
import { AlertTriangle, Trash2, Database, AlertCircle, Building2 } from 'lucide-react';
import axios from '@/api/axios';
import { toast } from 'react-hot-toast';

const DatabaseCleaner = () => {

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

    const handleClean = async () => {
        if (!selectedCompany) {
            toast.error("Por favor selecciona una empresa objetivo.");
            return;
        }

        if (confirmText !== 'CONFIRMADO') {
            toast.error("Por favor confirma que deseas continuar.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.delete('/developer/clear-data', {
                data: {
                    password: 'dev1234',
                    target_tenant_id: selectedCompany
                }
            });

            if (response.data.code === 1) {
                toast.success("Todos los datos transaccionales fueron limpiados correctamente.");
                setConfirmText('');
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
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                        <Database size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Limpiador de Base de Datos
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            Herramienta para desarrolladores. Elimina datos de prueba de forma recursiva.
                        </p>
                    </div>
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

            <div className="max-w-xl mx-auto">
                <Card className="border-red-200 dark:border-red-900 shadow-md">
                    <CardHeader className="flex gap-3">
                        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                        <div className="flex flex-col">
                            <p className="text-lg font-bold text-red-600">Peligro: Borrado de Datos</p>
                            <p className="text-small text-default-500">Esta acción limpiará permanentemente el historial.</p>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="space-y-6">
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
                            <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-200 space-y-2">
                                <li><strong>Elimina todas las ventas</strong> (facturas, boletas, notas de venta).</li>
                                <li><strong>Elimina movimientos</strong> (notas de entrada/salida y caja).</li>
                                <li><strong>Resetea el stock a cero</strong> y limpia la bitácora/kárdex.</li>
                            </ul>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-900 flex gap-3 text-amber-800 dark:text-amber-200 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>Asegúrate de tener un respaldo. Estos cambios afectan reportes y contabilidad de forma irreversible.</p>
                        </div>

                        <Switch
                            isSelected={confirmText === 'CONFIRMADO'}
                            onValueChange={(v) => setConfirmText(v ? 'CONFIRMADO' : '')}
                            color="danger"
                            size="sm"
                        >
                            <span className="text-sm font-medium">Entiendo las consecuencias y deseo proceder</span>
                        </Switch>

                        <Button
                            color="danger"
                            className="w-full mt-2 font-medium"
                            size="lg"
                            onPress={handleClean}
                            isDisabled={loading || confirmText !== 'CONFIRMADO' || !selectedCompany}
                            startContent={!loading && <Trash2 className="w-5 h-5" />}
                            isLoading={loading}
                        >
                            {loading ? "Ejecutando Limpieza..." : "Limpiar Todos los Datos"}
                        </Button>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default DatabaseCleaner;
