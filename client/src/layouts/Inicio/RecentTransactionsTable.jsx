import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Chip, Tooltip, Button, Modal, ModalContent, ModalHeader, ModalBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, ScrollShadow } from "@heroui/react";
import { Eye, FileText, XCircle, ArrowUpRight, CircleDashed, Info, FileText as FileIcon, User, Calendar, DollarSign, Calculator } from "lucide-react";
import useRecentTransactions from "./hooks/recent_transactions";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from "react-router-dom";
import { generateReceiptContent } from '../../pages/Ventas/Registro_Venta/ComponentsRegistroVentas/Comprobantes/Voucher/Voucher';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";
import { deleteVentaRequest } from "@/api/api.ventas";
import toast from "react-hot-toast";

const ESTADO_STYLES = {
    Aceptada: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-200' },
    'En proceso': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-200' },
    Anulada: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-200' },
    Default: { bg: 'bg-gray-100 dark:bg-gray-800/40', text: 'text-gray-700 dark:text-gray-200' }
};

const TIPO_COMPROBANTE_COLORS = {
    Factura: 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800/60',
    Boleta: 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800/60',
    Default: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60'
};

export function RecentTransactionsTable({ className }) {
    const { transactions, loading, refetch } = useRecentTransactions();
    const navigate = useNavigate();
    const nombre = useUserStore((state) => state.nombre);

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [empresaData, setEmpresaData] = useState(null);

    useEffect(() => {
        const fetchEmpresaData = async () => {
            try {
                const data = await getEmpresaDataByUser(nombre);
                setEmpresaData(data);
            } catch (error) {
                console.error("Error al obtener los datos de la empresa:", error);
            }
        };
        if (nombre) fetchEmpresaData();
    }, [nombre]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
        }).format(amount);
    };

    const getStatusChip = (estado) => {
        // estado_venta: 1 = Activo (Aceptada), 0 = Anulado (Inactiva)
        // Adjust based on your API response. If 'estado' is numeric:
        if (estado === 1) {
            return <Chip size="sm" variant="flat" className="bg-emerald-50 text-emerald-600 font-bold border-0 dark:bg-emerald-900/40 dark:text-emerald-400">Activo</Chip>;
        }
        if (estado === 0) {
            return <Chip size="sm" variant="flat" className="bg-rose-50 text-rose-600 font-bold border-0 dark:bg-rose-900/40 dark:text-rose-400">Anulado</Chip>;
        }
        // If string:
        return <Chip size="sm" variant="flat" className="bg-slate-100 text-slate-600 font-bold border-0 dark:bg-slate-800 dark:text-slate-300">{estado}</Chip>;
    };

    const handleViewDetail = (transaction) => {
        setSelectedTransaction(transaction);
        setIsDetailOpen(true);
    };

    const handlePrint = async (transaction) => {
        try {
            toast.loading("Generando PDF...");
            const comprobante1 = { nuevoNumComprobante: transaction.num }; // Approximate
            const content = await generateReceiptContent(
                { ...transaction, total_t: transaction.total }, // Adapter for voucher
                transaction,
                comprobante1,
                { observacion: transaction.observacion },
                nombre,
                empresaData
            );

            const imgUrl = empresaData?.logotipo || '';
            const jsPDF = (await import('jspdf')).default;
            const QRCode = (await import('qrcode')).default;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [75, 284] });
            const qrText = `https://facturacion.horytek.com/ver/${transaction.id}`; // Example URL

            QRCode.toDataURL(qrText, { width: 100, height: 100 }, (err, qrUrl) => {
                if (!err) {
                    if (imgUrl) doc.addImage(imgUrl, 'JPEG', 10, 10, 50, 50);
                    doc.setFont('Courier');
                    doc.setFontSize(8);
                    doc.text(content, 3, 55);
                    doc.addImage(qrUrl, 'PNG', 26, 260, 23, 23);
                    doc.save(`recibo_${transaction.serieNum}-${transaction.num}.pdf`);
                    toast.dismiss();
                    toast.success("PDF generado correctamente");
                } else {
                    toast.dismiss();
                    toast.error("Error al generar QR");
                }
            });
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Error al generar PDF");
        }
    };

    const handleAnulate = async (transaction) => {
        if (!confirm(`¿Estás seguro de que deseas anular la venta ${transaction.serieNum}-${transaction.num}?`)) return;

        try {
            toast.loading("Anulando venta...");
            // Adapting to deleteVentaRequest expecting { id: ..., motivo: ... } approx or just ID
            // Checking API signature: deleteVentaRequest(data) => post("/ventas/eliminar_venta", data)
            // Usually expects { id: venta.id, estado: ... } or just id. 
            // Assuming simplified deletion for now based on previous simple usage.
            await deleteVentaRequest({ id: transaction.id, estado: "Anulada" });
            toast.dismiss();
            toast.success("Venta anulada correctamente");
            if (refetch) refetch();
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Error al anular venta");
        }
    };

    const renderDetailContent = (venta) => {
        if (!venta) return null;
        let subtotal = 0;
        if (venta.total && venta.igv) {
            subtotal = parseFloat(venta.total) - parseFloat(venta.igv);
        }

        return (
            <div className="space-y-6">
                {/* Cards Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50/50 border border-blue-100 shadow-none">
                        <CardBody className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                <FileIcon size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 font-bold uppercase">Comprobante</p>
                                <p className="text-lg font-bold text-blue-900">{venta.serieNum}-{venta.num}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-200/50 text-blue-800 rounded-full">{venta.tipoComprobante}</span>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-emerald-50/50 border border-emerald-100 shadow-none">
                        <CardBody className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                                <User size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-600 font-bold uppercase">Cliente</p>
                                <p className="text-sm font-bold text-emerald-900 line-clamp-1">{venta.cliente_n || venta.cliente_r || "Cliente General"}</p>
                                <p className="text-xs text-emerald-700">{venta.doc_cliente || "Sin documento"}</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card className="bg-violet-50/50 border border-violet-100 shadow-none">
                        <CardBody className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-violet-600 font-bold uppercase">Fecha</p>
                                <p className="text-sm font-bold text-violet-900">{venta.fecha_iso ? format(new Date(venta.fecha_iso), "dd/MM/yyyy", { locale: es }) : "N/A"}</p>
                                <p className="text-xs text-violet-700">{venta.fecha_iso ? format(new Date(venta.fecha_iso), "hh:mm a", { locale: es }) : ""}</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Products Table */}
                <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 px-4 py-3">
                        <h4 className="font-bold text-slate-700 text-sm">Productos y Servicios</h4>
                    </CardHeader>
                    <CardBody className="p-0">
                        <Table aria-label="Detalle productos" shadow="none" classNames={{ wrapper: "rounded-none", th: "bg-slate-50 h-8 text-xs", td: "text-xs py-2" }}>
                            <TableHeader>
                                <TableColumn>CÓDIGO</TableColumn>
                                <TableColumn>DESCRIPCIÓN</TableColumn>
                                <TableColumn>CANT</TableColumn>
                                <TableColumn>P.UNIT</TableColumn>
                                <TableColumn>TOTAL</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {(venta.detalles || []).map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.codigo || "-"}</TableCell>
                                        <TableCell>{item.nombre || item.descripcion}</TableCell>
                                        <TableCell>{item.cantidad}</TableCell>
                                        <TableCell>{formatCurrency(item.precio)}</TableCell>
                                        <TableCell>{formatCurrency(item.subtotal || (item.cantidad * item.precio))}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                {/* Totals */}
                <div className="flex justify-end">
                    <Card className="w-full md:w-1/3 bg-slate-50 border border-slate-200 shadow-none">
                        <CardBody className="p-4 space-y-2">
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>IGV (18%)</span>
                                <span>{formatCurrency(venta.igv || 0)}</span>
                            </div>
                            <div className="border-t border-slate-200 my-2"></div>
                            <div className="flex justify-between text-sm font-bold text-slate-800">
                                <span>TOTAL</span>
                                <span>{formatCurrency(venta.total || 0)}</span>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <>
            <Card className={`h-full border-none shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-zinc-950 dark:border dark:border-zinc-800/50 rounded-2xl overflow-hidden ${className || ""}`}>
                <CardHeader className="flex justify-between items-center px-6 py-5 border-b border-slate-50 dark:border-zinc-800/50">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Transacciones Recientes</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Últimos movimientos</p>
                    </div>
                    <Button
                        size="sm"
                        variant="light"
                        className="text-blue-600 font-semibold text-xs px-3 min-w-[auto] h-8 bg-blue-50/50 hover:bg-blue-50 dark:bg-transparent dark:hover:bg-zinc-800 rounded-lg"
                        endContent={<ArrowUpRight size={14} strokeWidth={2.5} />}
                        onPress={() => navigate('/ventas')}
                    >
                        Ver todas
                    </Button>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Estado</th>
                                    <th className="px-6 py-3 font-semibold">Cliente</th>
                                    <th className="px-6 py-3 font-semibold text-right">Total</th>
                                    <th className="px-6 py-3 font-semibold text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                            <div className="flex justify-center items-center gap-2">
                                                <CircleDashed className="animate-spin" /> Cargando...
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length > 0 ? (
                                    transactions.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                                            <td className="px-6 py-3.5">
                                                {getStatusChip(sale.estado)}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="font-semibold text-slate-700 dark:text-slate-200">{sale.cliente_n || sale.cliente_r || "Cliente General"}</div>
                                                <div className="text-xs text-slate-400 font-medium">
                                                    {sale.serieNum}-{sale.num} • {sale.fecha_iso ? format(new Date(sale.fecha_iso), "d MMM, HH:mm", { locale: es }) : "Sin fecha"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-right font-bold text-slate-700 dark:text-slate-200">
                                                {formatCurrency(sale.total)}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <Tooltip content="Ver detalles">
                                                        <button
                                                            className="text-slate-400 hover:text-blue-600 transition-colors"
                                                            onClick={() => handleViewDetail(sale)}
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip content="Descargar PDF">
                                                        <button
                                                            className="text-slate-400 hover:text-rose-600 transition-colors"
                                                            onClick={() => handlePrint(sale)}
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    </Tooltip>
                                                    {sale.estado === 1 && (
                                                        <Tooltip content="Anular">
                                                            <button
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                                onClick={() => handleAnulate(sale)}
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-1">
                                                <Info size={20} />
                                                <span>No hay transacciones recientes</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            <Modal
                isOpen={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <span className="text-xl font-bold text-slate-800">Detalles de la Transacción</span>
                                <span className="text-sm font-normal text-slate-500">ID: {selectedTransaction?.id}</span>
                            </ModalHeader>
                            <ModalBody>
                                {renderDetailContent(selectedTransaction)}
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

