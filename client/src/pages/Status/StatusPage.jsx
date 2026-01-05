import React, { useEffect, useState } from 'react';
import { Card, CardBody, Chip, Spinner, Button, Link } from "@heroui/react";
import { FaCheckCircle, FaExclamationTriangle, FaServer, FaDatabase } from "react-icons/fa";
import { getSystemStatus } from '@/services/health.services';

const StatusPage = () => {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastChecked, setLastChecked] = useState(null);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const data = await getSystemStatus();
            setStatusData(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No se pudo conectar con el servidor.");
            setStatusData(null);
        } finally {
            setLoading(false);
            setLastChecked(new Date());
        }
    };

    useEffect(() => {
        fetchStatus();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        if (status === 'operational' || status === 'up') return "success";
        if (status === 'degraded') return "warning";
        return "danger";
    };

    const getStatusIcon = (status) => {
        if (status === 'operational' || status === 'up') return <FaCheckCircle size={20} />;
        return <FaExclamationTriangle size={20} />;
    };

    const ServiceCard = ({ name, icon, service }) => {
        const isUp = service?.status === 'up';
        return (
            <Card className="shadow-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <CardBody className="flex flex-row items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isUp ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isUp ? 'Operativo' : 'Problemas detectados'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <Chip
                            color={isUp ? "success" : "danger"}
                            variant="flat"
                            size="sm"
                            startContent={getStatusIcon(service?.status)}
                        >
                            <span className="capitalize">{service?.status || 'Unknown'}</span>
                        </Chip>
                        {service?.latency && (
                            <span className="text-[10px] text-slate-400 font-mono">
                                {service.latency}
                            </span>
                        )}
                    </div>
                </CardBody>
            </Card>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-black font-inter flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-2xl space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        {/* Logo Placeholder - You might want to import your actual logo */}
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
                            T
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Estado del Sistema</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Monitor de salud de los servicios de Tormenta Proyecto
                    </p>
                </div>

                {/* Main Status Banner */}
                <Card className={`border-l-4 shadow-md ${!error && (statusData?.status === 'operational') ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardBody className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {loading && !statusData ? (
                                <Spinner size="lg" color="primary" />
                            ) : (
                                <div className={`text-4xl ${!error && statusData?.status === 'operational' ? 'text-green-500' : 'text-red-500'}`}>
                                    {!error && statusData?.status === 'operational' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                                </div>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {loading && !statusData ? "Comprobando..." :
                                        error ? "Error de Conexión" :
                                            statusData?.status === 'operational' ? "Todos los sistemas operativos" : "Interrupción del servicio"}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {lastChecked ? `Última comprobación: ${lastChecked.toLocaleTimeString()}` : 'Iniciando comprobación...'}
                                </p>
                            </div>
                        </div>
                        <Button size="sm" variant="light" color="primary" isLoading={loading} onPress={fetchStatus}>
                            Actualizar
                        </Button>
                    </CardBody>
                </Card>

                {/* Services Grid */}
                {statusData && (
                    <div className="grid gap-4">
                        <ServiceCard
                            name="Base de Datos"
                            icon={<FaDatabase size={18} />}
                            service={statusData.services.database}
                        />
                        <ServiceCard
                            name="Servidor API"
                            icon={<FaServer size={18} />}
                            service={statusData.services.server}
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="text-center pt-8 border-t border-slate-200 dark:border-zinc-800">
                    <Link href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        &larr; Volver al inicio
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default StatusPage;
