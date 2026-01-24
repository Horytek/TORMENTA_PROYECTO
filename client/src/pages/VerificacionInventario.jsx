import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Tabs, Tab, Button, Chip, Spacer, useDisclosure, Select, SelectItem } from "@heroui/react";
import { toast } from "react-hot-toast";
import axios from "@/api/axios";
import { CheckCircle, Eye, FileText, AlertCircle } from "lucide-react";
import Loader from "@/components/Loader";
import moment from "moment";

// Import hook for warehouses
import { useAlmacenesKardex } from '@/hooks/useKardex';

// Componente para tabla de lotes (Reutilizable)
const LotesTable = ({ status, refreshTrigger, onAction }) => {
    const [lotes, setLotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLotes();
    }, [status, refreshTrigger]);

    const fetchLotes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/lote?estado=${status}`);
            if (res.data.code === 1) {
                setLotes(res.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error cargando solicitudes");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    if (lotes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-full mb-3">
                    <AlertCircle size={40} className="text-slate-300 dark:text-slate-500" />
                </div>
                <p className="font-medium text-slate-500 dark:text-slate-400">No hay solicitudes pendientes en esta etapa</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-zinc-900/50 font-semibold">
                    <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Descripción</th>
                        <th className="px-6 py-3">Creado Por</th>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {lotes.map((lote) => (
                        <tr key={lote.id_lote} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td className="px-6 py-4 font-medium">#{lote.id_lote}</td>
                            <td className="px-6 py-4">{lote.descripcion}</td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span>{lote.creador || 'N/A'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">{moment(lote.fecha_creacion).format('DD/MM/YYYY HH:mm')}</td>
                            <td className="px-6 py-4">
                                <Button
                                    size="sm"
                                    color={status === 0 ? "warning" : "success"}
                                    startContent={status === 0 ? <Eye size={16} /> : <CheckCircle size={16} />}
                                    onPress={() => onAction(lote)}
                                >
                                    {status === 0 ? "Verificar" : "Aprobar"}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Detalle y Confirmación
const DetalleLote = ({ lote, onClose, onConfirm, isApproval, almacenes }) => {
    const [detalles, setDetalles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlmacen, setSelectedAlmacen] = useState("");

    useEffect(() => {
        if (lote) fetchDetalles();
    }, [lote]);

    // Pre-select first warehouse if available
    useEffect(() => {
        if (isApproval && almacenes && almacenes.length > 0 && !selectedAlmacen) {
            setSelectedAlmacen(almacenes[0].id.toString());
        }
    }, [isApproval, almacenes]);

    const fetchDetalles = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/lote/${lote.id_lote}`);
            if (res.data.code === 1) {
                setDetalles(res.data.data);
            }
        } catch (error) {
            toast.error("Error cargando detalles");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (isApproval && !selectedAlmacen) {
            toast.error("Seleccione un almacén de destino");
            return;
        }
        onConfirm(lote, selectedAlmacen);
    };

    return (
        <Card className="mt-4 border border-gray-200 dark:border-gray-700 shadow-none">
            <CardHeader className="flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50 px-4 py-3">
                <div className="flex gap-2 items-center">
                    <FileText size={18} />
                    <span className="font-semibold">Detalle Lote #{lote.id_lote}</span>
                </div>
                <Button size="sm" variant="flat" onPress={onClose}>Cerrar</Button>
            </CardHeader>
            <CardBody>
                {loading ? <Loader /> : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                            <div><span className="font-bold">Descripción:</span> {lote.descripcion}</div>
                            <div><span className="font-bold">Creado por:</span> {lote.creador}</div>
                        </div>
                        <table className="w-full text-sm text-left mb-4">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="p-2">Producto</th>
                                    <th className="p-2">Marca</th>
                                    <th className="p-2">Tonalidad</th>
                                    <th className="p-2">Talla</th>
                                    <th className="p-2 text-right">Cant.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detalles.map((d, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700">
                                        <td className="p-2">{d.producto}</td>
                                        <td className="p-2">{d.marca}</td>
                                        <td className="p-2">{d.tonalidad || '-'}</td>
                                        <td className="p-2">{d.talla || '-'}</td>
                                        <td className="p-2 text-right font-bold">{d.cantidad}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {isApproval && (
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2">Destino de Mercadería</h4>
                                <Select
                                    label="Almacén de Destino"
                                    placeholder="Seleccione dónde ingresará el stock"
                                    selectedKeys={selectedAlmacen ? [selectedAlmacen] : []}
                                    onChange={(e) => setSelectedAlmacen(e.target.value)}
                                    className="max-w-xs"
                                >
                                    {almacenes.map((a) => (
                                        <SelectItem key={a.id} value={a.id.toString()}>
                                            {a.almacen}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="light" onPress={onClose}>Cancelar</Button>
                            <Button color={isApproval ? "success" : "warning"} onPress={handleConfirm}>
                                {isApproval ? "Aprobar e Ingresar Stock" : "Confirmar Verificación"}
                            </Button>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default function VerificacionInventario() {
    const [selectedLote, setSelectedLote] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [tab, setTab] = useState("verificar"); // 'verificar' | 'aprobar'

    // Hook for warehouses
    const { almacenes } = useAlmacenesKardex();

    const confirmAction = async (lote, almacenD) => {
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (tab === "verificar") {
                const res = await axios.post('/lote/verify', { id_lote: lote.id_lote, id_usuario: user.id_usuario });
                if (res.data.code === 1) {
                    toast.success("Lote verificado");
                    setSelectedLote(null);
                    setRefresh(prev => prev + 1);
                }
            } else {
                // Aprobar
                const res = await axios.post('/lote/approve', {
                    id_lote: lote.id_lote,
                    id_usuario: user.id_usuario,
                    almacenD: almacenD,
                    glosa: `Ingreso Lote #${lote.id_lote}`
                });
                if (res.data.code === 1) {
                    toast.success("Lote aprobado e inventario actualizado");
                    setSelectedLote(null);
                    setRefresh(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error al procesar");
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-200">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Verificación de Inventario
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Gestione la verificación y aprobación de ingresos de mercancía.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setRefresh(prev => prev + 1)}
                        className="bg-white text-slate-600 shadow-sm dark:bg-zinc-800 dark:text-slate-200 font-semibold"
                    >
                        Actualizar
                    </Button>
                </div>
            </div>

            {!selectedLote ? (
                <div className="space-y-4">
                    <Tabs
                        aria-label="Estados"
                        selectedKey={tab}
                        onSelectionChange={setTab}
                        color="primary"
                        variant="underlined"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-primary font-semibold"
                        }}
                    >
                        <Tab key="verificar" title="Por Verificar (Paso 1)" />
                        <Tab key="aprobar" title="Por Aprobar (Paso 2)" />
                    </Tabs>

                    <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl min-h-[400px]">
                        <CardBody className="p-0">
                            <LotesTable status={tab === 'verificar' ? 0 : 1} refreshTrigger={refresh} onAction={setSelectedLote} />
                        </CardBody>
                    </Card>
                </div>
            ) : (
                <DetalleLote
                    lote={selectedLote}
                    onClose={() => setSelectedLote(null)}
                    onConfirm={confirmAction}
                    isApproval={tab === "aprobar"}
                    almacenes={almacenes}
                />
            )}
        </div>
    );
}

function ClipboardCheckIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
        </svg>
    )
}
