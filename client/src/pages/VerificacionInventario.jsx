import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Tabs, Tab, Button, Chip, Spacer, useDisclosure, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox, Spinner, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { toast } from "react-hot-toast";
import axios from "@/api/axios";
import { CheckCircle, Eye, FileText, AlertCircle, Settings } from "lucide-react";
import Loader from "@/components/Loader";
import moment from "moment";
import { useAuth } from "@/context/Auth/AuthProvider";

// Import hook for warehouses
import { useAlmacenesKardex } from '@/hooks/useKardex';

// Componente para tabla de lotes (Reutilizable)
const LotesTable = ({ status, refreshTrigger, onAction, isDisabled }) => {
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

    return (
        <Table aria-label="Tabla de solicitudes" shadow="none" selectionMode="none">
            <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>DESCRIPCIÓN</TableColumn>
                <TableColumn>CREADO POR</TableColumn>
                <TableColumn>FECHA</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"No hay solicitudes pendientes en esta etapa"}>
                {lotes.map((lote) => (
                    <TableRow key={lote.id_lote}>
                        <TableCell>#{lote.id_lote}</TableCell>
                        <TableCell>{lote.descripcion}</TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span>{lote.creador || 'N/A'}</span>
                            </div>
                        </TableCell>
                        <TableCell>{moment(lote.fecha_creacion).format('DD/MM/YYYY HH:mm')}</TableCell>
                        <TableCell>
                            <Button
                                size="sm"
                                color={status === 0 ? "warning" : "success"}
                                startContent={status === 0 ? <Eye size={16} /> : <CheckCircle size={16} />}
                                onPress={() => onAction(lote)}
                                isDisabled={isDisabled}
                            >
                                {status === 0 ? "Verificar" : "Aprobar"}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// Detalle y Confirmación
// Detalle y Confirmación (Modal)
// Detalle y Confirmación (Modal)
const DetalleLote = ({ lote, onClose, onConfirm, isApproval, almacenes, isDisabled }) => {
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

    if (!lote) return null;

    return (
        <Modal isOpen={!!lote} onOpenChange={onClose} size="3xl" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex gap-2 items-center">
                                <FileText size={18} />
                                <span className="font-semibold">Detalle Lote #{lote.id_lote}</span>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            {loading ? <Loader /> : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg">
                                        <div><span className="font-bold">Descripción:</span> {lote.descripcion}</div>
                                        <div><span className="font-bold">Creado por:</span> {lote.creador}</div>
                                    </div>
                                    <Table aria-label="Detalle de productos" removeWrapper shadow="none">
                                        <TableHeader>
                                            <TableColumn>PRODUCTO</TableColumn>
                                            <TableColumn>MARCA</TableColumn>
                                            <TableColumn>TONALIDAD</TableColumn>
                                            <TableColumn>TALLA</TableColumn>
                                            <TableColumn align="end">CANT.</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {detalles.map((d, idx) => {
                                                // Parse attributes if available
                                                let color = d.tonalidad;
                                                let talla = d.talla;

                                                if (!color && !talla && d.attributes_json) {
                                                    try {
                                                        const attrs = typeof d.attributes_json === 'string'
                                                            ? JSON.parse(d.attributes_json)
                                                            : d.attributes_json;

                                                        // Try to find keys case-insensitive
                                                        const keys = Object.keys(attrs);
                                                        const colorKey = keys.find(k => k.toLowerCase() === 'color');
                                                        const tallaKey = keys.find(k => k.toLowerCase() === 'talla');

                                                        if (colorKey) color = attrs[colorKey];
                                                        if (tallaKey) talla = attrs[tallaKey];

                                                        // Formatting: If object (id, label) or just string
                                                        if (typeof color === 'object' && color?.label) color = color.label;
                                                        if (typeof talla === 'object' && talla?.label) talla = talla.label;

                                                    } catch (e) {
                                                        console.error("Error parsing attributes", e);
                                                    }
                                                }

                                                // Fallback to SKU code info if still empty (e.g. "Name - Color - Size")
                                                if ((!color || !talla) && d.sku_code) {
                                                    // This is a naive heuristic, better to rely on attributes
                                                    // But visually presenting the full SKU might be better than empty
                                                }

                                                return (
                                                    <TableRow key={idx}>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span>{d.producto}</span>
                                                                {d.sku_code && d.sku_code !== d.producto && (
                                                                    <span className="text-[10px] text-slate-400">{d.sku_code}</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{d.marca}</TableCell>
                                                        <TableCell>{color || '-'}</TableCell>
                                                        <TableCell>{talla || '-'}</TableCell>
                                                        <TableCell>{d.cantidad}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>

                                    {isApproval && (
                                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2">Destino de Mercadería</h4>
                                            <Select
                                                label="Almacén de Destino"
                                                placeholder="Seleccione dónde ingresará el stock"
                                                selectedKeys={selectedAlmacen ? [selectedAlmacen] : []}
                                                onChange={(e) => setSelectedAlmacen(e.target.value)}
                                                className="max-w-xs"
                                                isDisabled={isDisabled}
                                            >
                                                {almacenes.map((a) => (
                                                    <SelectItem key={a.id} value={a.id.toString()}>
                                                        {a.almacen}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                    )}
                                </>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>Cancelar</Button>
                            {!loading && (
                                <Button
                                    color={isApproval ? "success" : "warning"}
                                    onPress={handleConfirm}
                                    isDisabled={isDisabled}
                                >
                                    {isApproval ? "Aprobar e Ingresar Stock" : "Confirmar Verificación"}
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};


// Modal de Configuración de Roles
const ConfigRolesModal = ({ isOpen, onOpenChange }) => {
    const [roles, setRoles] = useState([]);
    const [verifyRoles, setVerifyRoles] = useState([]); // IDs allowed for step 1
    const [approveRoles, setApproveRoles] = useState([]); // IDs allowed for step 2
    const [loading, setLoading] = useState(true);
    const [configTab, setConfigTab] = useState("paso1");

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesRes, configRes] = await Promise.all([
                axios.get("/rol"),
                axios.get("/config-verification")
            ]);

            setRoles(rolesRes.data.data || []);
            const config = configRes.data.data || {};
            setVerifyRoles(config.verify || []);
            setApproveRoles(config.approve || []);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (onClose) => {
        try {
            await axios.post("/config-verification", {
                verify: verifyRoles,
                approve: approveRoles
            });
            toast.success("Configuración guardada");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error guardando cambios");
        }
    };

    const toggleVerify = (id) => {
        if (verifyRoles.includes(id)) {
            setVerifyRoles(verifyRoles.filter(r => r !== id));
        } else {
            setVerifyRoles([...verifyRoles, id]);
        }
    };

    const toggleApprove = (id) => {
        if (approveRoles.includes(id)) {
            setApproveRoles(approveRoles.filter(r => r !== id));
        } else {
            setApproveRoles([...approveRoles, id]);
        }
    };

    const renderRoleList = (selectedIds, toggleFn) => (
        <div className="space-y-2 max-h-[300px] overflow-y-auto p-1">
            {roles.map(rol => (
                <div key={rol.id_rol} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 transition-colors">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{rol.nom_rol}</span>
                    <Checkbox
                        isSelected={selectedIds.includes(rol.id_rol)}
                        onValueChange={() => toggleFn(rol.id_rol)}
                    >
                        Permitir
                    </Checkbox>
                </div>
            ))}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Configurar Roles por Etapa</ModalHeader>
                        <ModalBody>
                            <Tabs
                                aria-label="Etapas"
                                selectedKey={configTab}
                                onSelectionChange={setConfigTab}
                                fullWidth
                                color="secondary"
                            >
                                <Tab key="paso1" title="1. Verificación">
                                    <p className="text-sm text-slate-500 mb-2 mt-2">
                                        Roles que pueden <strong>verificar</strong> el ingreso inicial (conteo físico).
                                    </p>
                                    {loading ? <Spinner className="mx-auto my-4" /> : renderRoleList(verifyRoles, toggleVerify)}
                                </Tab>
                                <Tab key="paso2" title="2. Aprobación">
                                    <p className="text-sm text-slate-500 mb-2 mt-2">
                                        Roles que pueden <strong>aprobar</strong> el ingreso final y mover stock a almacén.
                                    </p>
                                    {loading ? <Spinner className="mx-auto my-4" /> : renderRoleList(approveRoles, toggleApprove)}
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onPress={onClose}>Cancelar</Button>
                            <Button color="primary" onPress={() => handleSave(onClose)}>Guardar Cambios</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default function VerificacionInventario() {
    const { isOpen: isConfigOpen, onOpen: onOpenConfig, onOpenChange: onConfigOpenChange } = useDisclosure();
    const [selectedLote, setSelectedLote] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [tab, setTab] = useState("verificar"); // 'verificar' | 'aprobar'

    // Auth
    const { user, loading: authLoading } = useAuth();

    // Hook for warehouses
    const { almacenes } = useAlmacenesKardex();

    // Permissions State
    const [permissions, setPermissions] = useState({ verify: false, approve: false });
    const [configLoading, setConfigLoading] = useState(true);

    useEffect(() => {
        const fetchPermissions = async () => {
            if (!user) return;
            try {
                const res = await axios.get("/config-verification");
                const config = res.data.data || {};
                // Handle different user object structures (login vs verify response)
                const userRoleId = user.id_rol || user.rol;

                // Admin check (id_rol === 1) or explicit permission from config
                // Ensure type safety by checking both raw and parsed ID just in case
                const canVerify = userRoleId === 1 ||
                    (config.verify || []).includes(userRoleId) ||
                    (config.verify || []).includes(parseInt(userRoleId));

                const canApprove = userRoleId === 1 ||
                    (config.approve || []).includes(userRoleId) ||
                    (config.approve || []).includes(parseInt(userRoleId));

                setPermissions({ verify: canVerify, approve: canApprove });

                // Adjust selected tab based on permissions
                if (!canVerify && canApprove) {
                    setTab("aprobar");
                }
            } catch (error) {
                console.error("Error checking permissions", error);
            } finally {
                setConfigLoading(false);
            }
        };
        fetchPermissions();
    }, [user]);

    if (authLoading || configLoading) return <Loader />;

    const confirmAction = async (lote, almacenD) => {
        try {
            const userId = user?.id || user?.id_usuario;
            if (!userId) {
                toast.error("Error: Usuario no identificado");
                return;
            }

            if (tab === "verificar") {
                const res = await axios.post('/lote/verify', { id_lote: lote.id_lote, id_usuario: userId });
                if (res.data.code === 1) {
                    toast.success("Lote verificado");
                    setSelectedLote(null);
                    setRefresh(prev => prev + 1);
                }
            } else {
                // Aprobar
                const res = await axios.post('/lote/approve', {
                    id_lote: lote.id_lote,
                    id_usuario: userId,
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
                    {user?.id_rol === 1 && (
                        <Button
                            variant="flat"
                            color="secondary"
                            startContent={<Settings size={18} />}
                            onPress={onOpenConfig}
                        >
                            Configurar Roles
                        </Button>
                    )}
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
                        {tab === 'verificar' && (
                            <LotesTable
                                status={0}
                                refreshTrigger={refresh}
                                onAction={setSelectedLote}
                                isDisabled={!permissions.verify}
                            />
                        )}
                        {tab === 'aprobar' && (
                            <LotesTable
                                status={1}
                                refreshTrigger={refresh}
                                onAction={setSelectedLote}
                                isDisabled={!permissions.approve}
                            />
                        )}
                    </CardBody>
                </Card>
            </div>

            {selectedLote && (
                <DetalleLote
                    lote={selectedLote}
                    onClose={() => setSelectedLote(null)}
                    onConfirm={confirmAction}
                    isApproval={tab === "aprobar"}
                    almacenes={almacenes}
                    isDisabled={tab === 'verificar' ? !permissions.verify : !permissions.approve}
                />
            )}
            <ConfigRolesModal isOpen={isConfigOpen} onOpenChange={onConfigOpenChange} />
        </div >
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
