import { useEffect, useState, useRef } from "react";
import { getSales, getSaleDetails } from "@/services/express.services";
import { Button, Chip, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
import { FaReceipt, FaFilePdf, FaPrint, FaHistory, FaSearch } from "react-icons/fa";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import { getBusinessName } from "@/utils/expressStorage";

function ExpressSalesHistory() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleDetails, setSaleDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [businessName, setBusinessName] = useState("");
    const printRef = useRef(null);

    useEffect(() => {
        loadSales();
        getBusinessName().then(setBusinessName);
    }, []);

    const loadSales = async () => {
        setLoading(true);
        try {
            const data = await getSales();
            setSales(data);
        } catch (e) {
            console.error(e);
            toast.error("Error al cargar historial");
        } finally {
            setLoading(false);
        }
    };

    const handleViewSale = async (sale) => {
        setSelectedSale(sale);
        setLoadingDetails(true);
        onOpen();
        try {
            const details = await getSaleDetails(sale.id);
            setSaleDetails(details);
        } catch (e) {
            console.error(e);
            toast.error("Error al cargar detalles");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handlePrintTicket = () => {
        if (!selectedSale || !saleDetails) return;

        const ticketContent = `
==============================
        ${businessName || "Pocket POS"}
==============================
Fecha: ${format(new Date(selectedSale.created_at), "dd/MM/yyyy HH:mm")}
Venta #: ${selectedSale.doc_number || selectedSale.id}
${selectedSale.client_name ? `Cliente: ${selectedSale.client_name}` : ''}
${selectedSale.client_doc ? `Doc: ${selectedSale.client_doc}` : ''}
------------------------------
PRODUCTOS:
${saleDetails.items?.map(item =>
            `${item.quantity}x ${item.product_name}\n   S/. ${Number(item.price).toFixed(2)} c/u = S/. ${(item.quantity * item.price).toFixed(2)}`
        ).join('\n')}
------------------------------
TOTAL: S/. ${Number(selectedSale.total).toFixed(2)}
Pago: ${selectedSale.payment_method || 'Efectivo'}
==============================
     ¡Gracias por su compra!
==============================
        `.trim();

        // Open print window with ticket format
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Ticket de Venta</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 280px; }
                        pre { white-space: pre-wrap; word-wrap: break-word; }
                    </style>
                </head>
                <body>
                    <pre>${ticketContent}</pre>
                    <script>window.onload = () => { window.print(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadPDF = () => {
        if (!selectedSale || !saleDetails) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(businessName || "Pocket POS", pageWidth / 2, 20, { align: "center" });

        doc.setFontSize(14);
        doc.text("NOTA DE VENTA", pageWidth / 2, 30, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Sale Info
        let yPos = 45;
        doc.text(`Fecha: ${format(new Date(selectedSale.created_at), "dd/MM/yyyy HH:mm")}`, 20, yPos);
        yPos += 7;
        doc.text(`N° Documento: ${selectedSale.doc_number || selectedSale.id}`, 20, yPos);
        yPos += 7;

        if (selectedSale.client_name) {
            doc.text(`Cliente: ${selectedSale.client_name}`, 20, yPos);
            yPos += 7;
        }
        if (selectedSale.client_doc) {
            doc.text(`DNI/RUC: ${selectedSale.client_doc}`, 20, yPos);
            yPos += 7;
        }

        // Line
        yPos += 5;
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 10;

        // Table Header
        doc.setFont("helvetica", "bold");
        doc.text("Cant.", 20, yPos);
        doc.text("Descripción", 40, yPos);
        doc.text("P.U.", 130, yPos, { align: "right" });
        doc.text("Total", pageWidth - 20, yPos, { align: "right" });
        yPos += 7;

        doc.setFont("helvetica", "normal");

        // Items
        saleDetails.items?.forEach(item => {
            doc.text(String(item.quantity), 20, yPos);
            doc.text(item.product_name?.substring(0, 40) || "Producto", 40, yPos);
            doc.text(`S/. ${Number(item.price).toFixed(2)}`, 130, yPos, { align: "right" });
            doc.text(`S/. ${(item.quantity * item.price).toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
            yPos += 7;
        });

        // Line
        yPos += 3;
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 10;

        // Total
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`TOTAL: S/. ${Number(selectedSale.total).toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Método de Pago: ${selectedSale.payment_method || 'Efectivo'}`, 20, yPos);

        // Footer
        yPos += 20;
        doc.setFontSize(9);
        doc.text("¡Gracias por su compra!", pageWidth / 2, yPos, { align: "center" });

        // Save
        doc.save(`nota_venta_${selectedSale.doc_number || selectedSale.id}.pdf`);
        toast.success("PDF descargado");
    };

    return (
        <div className="min-h-full bg-zinc-950 pb-24 px-4 pt-2">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-xl py-4 z-20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <FaHistory size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Historial de Ventas</h1>
                        <p className="text-xs text-zinc-500">{sales.length} ventas registradas</p>
                    </div>
                </div>
                <Button
                    isIconOnly
                    className="bg-zinc-800 text-zinc-400 hover:text-white"
                    onPress={loadSales}
                    isLoading={loading}
                >
                    <FaSearch />
                </Button>
            </div>

            {/* Sales List */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" color="success" />
                </div>
            ) : sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                    <FaReceipt size={40} className="opacity-20 mb-4" />
                    <p>No hay ventas registradas.</p>
                </div>
            ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {sales.map(sale => (
                        <div
                            key={sale.id}
                            onClick={() => handleViewSale(sale)}
                            className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 hover:bg-zinc-800/50 hover:border-white/10 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-sm text-zinc-500">
                                        {format(new Date(sale.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                    </p>
                                    <p className="text-xs text-zinc-600">#{sale.doc_number || String(sale.id).substring(0, 8)}</p>
                                </div>
                                <Chip size="sm" color="success" variant="flat" className="font-mono">
                                    S/. {Number(sale.total).toFixed(2)}
                                </Chip>
                            </div>

                            {sale.client_name && (
                                <p className="text-sm text-zinc-400 truncate">
                                    Cliente: {sale.client_name}
                                </p>
                            )}

                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                <Chip size="sm" variant="flat" className="bg-zinc-800 text-zinc-400">
                                    {sale.payment_method || 'Efectivo'}
                                </Chip>
                                <span className="text-emerald-400 text-sm group-hover:text-emerald-300 transition-colors">
                                    Ver detalles →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sale Details Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="lg"
                placement="center"
                backdrop="blur"
                classNames={{
                    base: "bg-zinc-950 border border-white/10",
                    closeButton: "hover:bg-zinc-800 active:bg-zinc-700 text-zinc-400 hover:text-white"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="border-b border-white/5 pb-4">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-xl font-bold text-white">Detalle de Venta</h2>
                                    <p className="text-sm text-zinc-500 font-normal">
                                        #{selectedSale?.doc_number || String(selectedSale?.id || '').substring(0, 8)}
                                    </p>
                                </div>
                            </ModalHeader>
                            <ModalBody className="py-6">
                                {loadingDetails ? (
                                    <div className="flex justify-center py-10">
                                        <Spinner color="success" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Sale Info */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-zinc-500">Fecha:</span>
                                                <p className="text-white">{selectedSale && format(new Date(selectedSale.created_at), "dd/MM/yyyy HH:mm")}</p>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500">Pago:</span>
                                                <p className="text-white">{selectedSale?.payment_method || 'Efectivo'}</p>
                                            </div>
                                            {selectedSale?.client_name && (
                                                <div>
                                                    <span className="text-zinc-500">Cliente:</span>
                                                    <p className="text-white">{selectedSale.client_name}</p>
                                                </div>
                                            )}
                                            {selectedSale?.client_doc && (
                                                <div>
                                                    <span className="text-zinc-500">DNI/RUC:</span>
                                                    <p className="text-white">{selectedSale.client_doc}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Items Table */}
                                        <div className="bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden">
                                            <Table removeWrapper aria-label="Productos de la venta" classNames={{
                                                th: "bg-zinc-800/50 text-zinc-400 text-xs",
                                                td: "text-white text-sm py-3"
                                            }}>
                                                <TableHeader>
                                                    <TableColumn>Producto</TableColumn>
                                                    <TableColumn>Cant.</TableColumn>
                                                    <TableColumn>P.U.</TableColumn>
                                                    <TableColumn className="text-right">Subtotal</TableColumn>
                                                </TableHeader>
                                                <TableBody>
                                                    {saleDetails?.items?.map((item, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{item.product_name}</TableCell>
                                                            <TableCell>{item.quantity}</TableCell>
                                                            <TableCell>S/. {Number(item.price).toFixed(2)}</TableCell>
                                                            <TableCell className="text-right font-mono text-emerald-400">
                                                                S/. {(item.quantity * item.price).toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )) || []}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Total */}
                                        <div className="flex justify-between items-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            <span className="text-lg font-bold text-white">TOTAL</span>
                                            <span className="text-2xl font-bold text-emerald-400 font-mono">
                                                S/. {Number(selectedSale?.total || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter className="border-t border-white/5 pt-4 flex gap-2">
                                <Button
                                    className="flex-1 bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700"
                                    startContent={<FaPrint />}
                                    onPress={handlePrintTicket}
                                    isDisabled={loadingDetails}
                                >
                                    Imprimir Ticket
                                </Button>
                                <Button
                                    className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                                    startContent={<FaFilePdf />}
                                    onPress={handleDownloadPDF}
                                    isDisabled={loadingDetails}
                                >
                                    Descargar PDF
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

export default ExpressSalesHistory;
