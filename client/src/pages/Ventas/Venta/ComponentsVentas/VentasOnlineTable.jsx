import React, { useState, useEffect } from 'react';
import { getProductAttributes } from "@/services/productos.services";
import PropTypes from 'prop-types';
import { FaEye, FaCalendarAlt, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShoppingCart, FaCreditCard } from "react-icons/fa";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button,
    Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Tooltip, Pagination, Select, SelectItem, ScrollShadow, Chip, Spinner
} from "@heroui/react";

const ESTADO_STYLES = {
    Aceptada: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    'En proceso': "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    Anulada: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    Default: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
};

const VentasOnlineTable = ({
    ventas,
    loading,
    currentPage,
    totalPages,
    setCurrentPage,
    ventasPerPage,
    setVentasPerPage,
}) => {
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [attrMetadataMap, setAttrMetadataMap] = useState({});

    useEffect(() => {
        if (!selectedVenta?.detalles) return;

        // Extract unique product IDs to fetch metadata
        const uniqueProductIds = [...new Set(selectedVenta.detalles.map(d => d.id_producto).filter(Boolean))];
        const missingIds = uniqueProductIds.filter(id => !attrMetadataMap[id]);

        if (missingIds.length > 0) {
            Promise.all(missingIds.map(id => getProductAttributes(id).catch(() => null)))
                .then(results => {
                    setAttrMetadataMap(prev => {
                        const next = { ...prev };
                        results.forEach((data, index) => {
                            if (data && missingIds[index]) {
                                const pid = missingIds[index];
                                const names = {};
                                const colors = {};
                                // Map attributes and legacy tonalidades for hex codes
                                if (data.attributes) data.attributes.forEach(a => names[a.id_atributo] = a.nombre);
                                if (data.tonalidades) data.tonalidades.forEach(t => colors[t.nombre] = t.hex);
                                next[pid] = { names, colors };
                            }
                        });
                        return next;
                    });
                });
        }
    }, [selectedVenta]);

    const renderVariantBadges = (detalle) => {
        if (!detalle.sku_label && !detalle.attributes_json) return null;

        let attributes = detalle.attributes_json;
        if (typeof attributes === 'string') {
            try { attributes = JSON.parse(attributes); } catch { attributes = null; }
        }

        if (attributes && Object.keys(attributes).length > 0) {
            const metadata = attrMetadataMap[detalle.id_producto] || { names: {}, colors: {} };
            return (
                <div className="flex flex-wrap gap-1 mt-1">
                    {Object.keys(attributes).map(k => {
                        const label = metadata.names[k] || k;
                        const val = attributes[k];
                        const isColor = label.toLowerCase().includes('color');
                        const hex = isColor ? metadata.colors[val] : null;

                        return (
                            <div key={k} className="flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500">{label}:</span>
                                {isColor && hex && <span className="w-2 h-2 rounded-full border border-slate-300" style={{ backgroundColor: hex }} />}
                                <span className="text-[10px] text-slate-700 font-medium">{val}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // Fallback to label if no JSON
        if (detalle.sku_label && detalle.sku_label !== detalle.nombre) {
            return <div className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded inline-block mt-1">{detalle.sku_label}</div>;
        }
        return null;
    };


    const handleViewDetail = (venta) => {
        setSelectedVenta(venta);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedVenta(null);
    };

    const renderVentaRow = (venta) => {
        const estadoStyle = ESTADO_STYLES[venta.estado] || ESTADO_STYLES.Default;
        return (
            <TableRow key={venta.id} className='hover:bg-emerald-50/60 transition-colors'>
                <TableCell className="font-bold text-center text-[13px] p-2">
                    <Chip size="sm" color="success" variant="flat">
                        <FaShoppingCart className="mr-1 inline" /> {venta.id}
                    </Chip>
                </TableCell>
                <TableCell className="font-bold whitespace-normal text-[13px] p-2">
                    <div>{venta.cliente}</div>
                    <div className="text-gray-500 text-xs">{venta.dni}</div>
                </TableCell>
                <TableCell className="text-[13px] p-2">
                    <div className="flex items-center gap-1 text-gray-600">
                        <FaEnvelope size={12} />
                        <span className="text-xs">{venta.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 mt-1">
                        <FaPhone size={12} />
                        <span className="text-xs">{venta.telefono || '-'}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center text-[13px] p-2">
                    <Tooltip
                        content={
                            <div className="text-xs text-gray-800">
                                <p><strong>Verificación:</strong> {venta.fechaVerificacion ? new Date(venta.fechaVerificacion).toLocaleString("es-ES") : "N/A"}</p>
                            </div>
                        }
                        placement="top"
                        className="bg-white shadow-lg rounded-lg p-2 border border-gray-300"
                    >
                        <div className="flex justify-center items-center gap-1">
                            <span>
                                {venta.fechaEmision
                                    ? new Date(venta.fechaEmision + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
                                    : "N/A"}
                            </span>
                            <FaCalendarAlt className="text-emerald-500 cursor-pointer" />
                        </div>
                    </Tooltip>
                </TableCell>
                <TableCell className="text-center font-semibold text-[13px] p-2 text-emerald-600">
                    {venta.total}
                </TableCell>
                <TableCell className="text-center text-[13px] p-2">
                    <div className="flex items-center justify-center gap-1">
                        <FaCreditCard className="text-blue-500" />
                        <span className="text-xs">{venta.metodo_pago}</span>
                    </div>
                </TableCell>
                <TableCell className="text-center text-[13px] p-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoStyle}`}>
                        {venta.estado}
                    </span>
                </TableCell>
                <TableCell className="text-center text-[13px] p-2">
                    <span className="text-xs text-gray-500">{venta.almacen || '-'}</span>
                </TableCell>
                <TableCell className="text-center text-[13px] p-2">
                    <Tooltip content="Ver Detalle" placement="top">
                        <button
                            className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors"
                            onClick={() => handleViewDetail(venta)}
                        >
                            <FaEye size={16} />
                        </button>
                    </Tooltip>
                </TableCell>
            </TableRow>
        );
    };

    return (
        <Card className="bg-white dark:bg-zinc-900 shadow-sm rounded-xl border border-slate-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row justify-between items-center gap-4 p-4 pb-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <FaShoppingCart className="text-emerald-600 dark:text-emerald-400" size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ventas Online</h3>
                        <p className="text-xs text-slate-500">Compras realizadas vía eCommerce</p>
                    </div>
                </div>
                <Chip color="success" variant="flat" size="sm">
                    Solo lectura
                </Chip>
            </CardHeader>

            <CardBody className="px-3 py-2">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Spinner color="success" size="lg" label="Cargando ventas online..." />
                    </div>
                ) : ventas.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <FaShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No hay ventas online registradas</p>
                    </div>
                ) : (
                    <ScrollShadow hideScrollBar className="w-full overflow-x-auto">
                        <Table
                            aria-label="Tabla de ventas online"
                            removeWrapper
                            className="min-w-[800px]"
                            classNames={{
                                th: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider",
                                td: "border-b border-slate-100 dark:border-zinc-800"
                            }}
                        >
                            <TableHeader>
                                <TableColumn className="text-center">ID</TableColumn>
                                <TableColumn className="text-left">CLIENTE</TableColumn>
                                <TableColumn className="text-left">CONTACTO</TableColumn>
                                <TableColumn className="text-center">FECHA</TableColumn>
                                <TableColumn className="text-center">TOTAL</TableColumn>
                                <TableColumn className="text-center">PAGO</TableColumn>
                                <TableColumn className="text-center">ESTADO</TableColumn>
                                <TableColumn className="text-center">ALMACÉN</TableColumn>
                                <TableColumn className="text-center">ACCIONES</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {ventas.map(renderVentaRow)}
                            </TableBody>
                        </Table>
                    </ScrollShadow>
                )}

                {/* Paginación */}
                {!loading && ventas.length > 0 && (
                    <div className="flex justify-between items-center mt-4 px-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Filas:</span>
                            <Select
                                size="sm"
                                selectedKeys={[String(ventasPerPage)]}
                                onChange={(e) => setVentasPerPage(Number(e.target.value))}
                                className="w-28"
                            >
                                <SelectItem key="10" value="10">10 filas</SelectItem>
                                <SelectItem key="20" value="20">20 filas</SelectItem>
                                <SelectItem key="50" value="50">50 filas</SelectItem>
                                <SelectItem key="100" value="100">100 filas</SelectItem>
                            </Select>
                        </div>
                        <Pagination
                            total={totalPages}
                            page={currentPage}
                            onChange={setCurrentPage}
                            color="success"
                            size="sm"
                        />
                    </div>
                )}
            </CardBody>

            {/* Modal de Detalle */}
            <Modal size="2xl" isOpen={showDetailModal} onOpenChange={closeDetailModal}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 bg-emerald-50 dark:bg-emerald-900/20">
                                <div className="flex items-center gap-2">
                                    <FaShoppingCart className="text-emerald-600" />
                                    <span>Detalle de Compra Online #{selectedVenta?.id}</span>
                                </div>
                            </ModalHeader>
                            <ModalBody className="py-4">
                                {selectedVenta && (
                                    <div className="space-y-4">
                                        {/* Info Cliente */}
                                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase">Cliente</p>
                                                <p className="font-semibold">{selectedVenta.cliente}</p>
                                                <p className="text-sm text-slate-600">{selectedVenta.dni}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase">Contacto</p>
                                                <p className="text-sm flex items-center gap-1">
                                                    <FaEnvelope size={12} /> {selectedVenta.email || '-'}
                                                </p>
                                                <p className="text-sm flex items-center gap-1">
                                                    <FaPhone size={12} /> {selectedVenta.telefono || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase">Dirección</p>
                                                <p className="text-sm flex items-center gap-1">
                                                    <FaMapMarkerAlt size={12} /> {selectedVenta.direccion || '-'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase">Transacción</p>
                                                <p className="text-sm font-mono">{selectedVenta.transaccion || '-'}</p>
                                            </div>
                                        </div>

                                        {/* Detalles de productos */}
                                        <div>
                                            <h4 className="font-semibold mb-2 text-sm">Productos</h4>
                                            <Table
                                                removeWrapper
                                                aria-label="Productos de la compra"
                                                classNames={{
                                                    th: "bg-slate-100 dark:bg-zinc-800 text-xs",
                                                    td: "text-sm"
                                                }}
                                            >
                                                <TableHeader>
                                                    <TableColumn>PRODUCTO</TableColumn>
                                                    <TableColumn className="text-center">CANT.</TableColumn>
                                                    <TableColumn className="text-center">PRECIO</TableColumn>
                                                    <TableColumn className="text-center">SUBTOTAL</TableColumn>
                                                </TableHeader>
                                                <TableBody>
                                                    {(selectedVenta.detalles || []).map((det, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                <div className="font-semibold">{det.nombre}</div>
                                                                {renderVariantBadges(det)}
                                                            </TableCell>
                                                            <TableCell className="text-center">{det.cantidad}</TableCell>
                                                            <TableCell className="text-center">{det.precio}</TableCell>
                                                            <TableCell className="text-center font-semibold">{det.subtotal}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Totales */}
                                        <div className="flex justify-end">
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-right">
                                                <p className="text-sm text-slate-600">IGV: {selectedVenta.igv}</p>
                                                <p className="text-xl font-bold text-emerald-600">Total: {selectedVenta.total}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </Card>
    );
};

VentasOnlineTable.propTypes = {
    ventas: PropTypes.array.isRequired,
    loading: PropTypes.bool,
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    setCurrentPage: PropTypes.func.isRequired,
    ventasPerPage: PropTypes.number.isRequired,
    setVentasPerPage: PropTypes.func.isRequired,
};

VentasOnlineTable.defaultProps = {
    loading: false,
};

export default VentasOnlineTable;
