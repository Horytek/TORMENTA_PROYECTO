import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from "react-icons/io";
import { TiPrinter } from "react-icons/ti";
import { FaEye } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure,
  RadioGroup, Radio, Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tooltip, Pagination, Select, SelectItem, ScrollShadow,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip
} from "@heroui/react";
import { generateReceiptContent } from '../../../Ventas/Registro_Venta/ComponentsRegistroVentas/Comprobantes/Voucher/Voucher';
import useBoucher from '@/services/data/data_boucher';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import { FaUser, FaCalendarAlt, FaFileInvoice, FaMoneyBillWave, FaCalculator, FaExchangeAlt } from "react-icons/fa";
import IntercambioModal from './Modals/IntercambioModal';
import { exchangeVenta } from '@/services/exchange_venta';
import { toast } from "react-hot-toast";
import { handleSunatUnique } from "@/services/data/add_sunat_unique";
import { handleUpdate } from "@/services/data/update_venta";

const ESTADO_STYLES = {
  Aceptada: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  Activo: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  'En proceso': "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  Anulada: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  Anulado: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  Default: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
};

const TIPO_COMPROBANTE_COLORS = {
  Factura: 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30',
  Boleta: 'bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-900/30',
  Default: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
};

const TablaVentas = ({
  ventas,
  modalOpen,
  deleteOptionSelected,
  openModal,
  currentPage,
  totalPages,
  setCurrentPage,
  ventasPerPage,
  setVentasPerPage,
  refreshVentas
}) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [printOption, setPrintOption] = useState('');
  const [empresaData, setEmpresaData] = useState(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const nombre = useUserStore((state) => state.nombre);

  // Nuevo: Estado para el comprobante por venta
  const [comprobantePorVenta, setComprobantePorVenta] = useState({});
  const [ventaActualId, setVentaActualId] = useState(null);

  // Estado para Intercambio
  const [modalIntercambioOpen, setModalIntercambioOpen] = useState(false);
  const [selectedVentaForIntercambio, setSelectedVentaForIntercambio] = useState(null);
  //const { toast } = useToast();

  // Zustand: setter y selectores
  const setVentaSeleccionada = useVentaSeleccionadaStore((state) => state.setVentaSeleccionada);
  const ventaSeleccionada = useVentaSeleccionadaStore((state) => state.venta);
  const setObservacion = useVentaSeleccionadaStore((state) => state.setObservacion);
  const observacion = useVentaSeleccionadaStore(state => state.observacion);

  useEffect(() => {
    setExpandedRow(null);
    const fetchEmpresaData = async () => {
      try {
        const data = await getEmpresaDataByUser(nombre);
        setEmpresaData(data);
      } catch (error) {
        console.error("Error al obtener los datos de la empresa:", error);
      }
    };
    fetchEmpresaData();
  }, [currentPage, nombre]);

  const handleViewDetail = (venta) => {
    setExpandedRow(venta.id);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setExpandedRow(null);
  };

  // Hook para obtener los datos del boucher
  const { venta_B } = useBoucher(ventaSeleccionada?.id_venta_boucher);

  useEffect(() => {
    if (venta_B?.num_comprobante && ventaSeleccionada?.id) {
      setComprobantePorVenta(prev => ({
        ...prev,
        [ventaSeleccionada.id]: venta_B.num_comprobante
      }));
    }
    if (ventaSeleccionada?.observacion) setObservacion({ observacion: ventaSeleccionada.observacion });
  }, [venta_B?.num_comprobante, ventaSeleccionada?.id, ventaSeleccionada?.observacion, setObservacion]);

  const handlePrintIconClick = (venta) => {
    setVentaSeleccionada(venta);
    setVentaActualId(venta.id);
    onOpen();
  };

  const handleIntercambioClick = (venta) => {
    setSelectedVentaForIntercambio(venta);
    setModalIntercambioOpen(true);
  };


  const handleConfirmIntercambio = async (data) => {
    try {
      const res = await exchangeVenta(data);
      if (res.code === 1) {
        toast.success("Intercambio realizado correctamente.");


        // Si hay datos para sunat, enviar
        if (res.data?.sunatData) {
          handleSunatUnique(res.data.sunatData, nombre);
          // Actualizar estado_sunat en BD local
          handleUpdate({ id: res.data.id_venta_nueva });
        }

        setModalIntercambioOpen(false);
        if (refreshVentas) refreshVentas();
      } else {
        toast.error(res.message || "Error al realizar intercambio");
      }
    } catch (error) {
      toast.error("Error de conexión o servidor");
    }
  };


  const handlePrint = async () => {
    try {
      const numComprobante = comprobantePorVenta[ventaActualId];
      const comprobante1 = { nuevoNumComprobante: numComprobante };
      const content = await generateReceiptContent(
        venta_B,
        ventaSeleccionada,
        comprobante1,
        observacion,
        nombre,
        empresaData
      );
      const imgUrl = empresaData?.logotipo || '';
      if (printOption === 'print') {
        const jsPDF = (await import('jspdf')).default;
        const QRCode = (await import('qrcode')).default;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [75, 284] });
        const qrText = 'https://www.facebook.com/profile.php?id=100055385846115';
        QRCode.toDataURL(qrText, { width: 100, height: 100 }, (err, qrUrl) => {
          if (!err) {
            if (imgUrl) doc.addImage(imgUrl, 'JPEG', 10, 10, 50, 50);
            doc.setFont('Courier');
            doc.setFontSize(8);
            doc.text(content, 3, 55);
            doc.addImage(qrUrl, 'PNG', 26, 260, 23, 23);
            doc.save('recibo.pdf');
          }
        });
      } else if (printOption === 'print-1') {
        const QRCode = (await import('qrcode')).default;
        const printWindow = window.open('', '', 'height=600,width=800');
        const qrText = 'https://www.facebook.com/profile.php?id=100055385846115';
        QRCode.toDataURL(qrText, { width: 100, height: 100 }, (err, qrUrl) => {
          if (!err) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Recibo</title>
                  <style>
                    @page { size: 72mm 297mm; margin: 10px; }
                    body { margin: 0; padding: 0; font-family: Courier, monospace; font-size: 10pt; width: 100%; }
                    pre { margin: 0; font-size: 10pt; white-space: pre-wrap; }
                    .center { text-align: center; }
                    .qr { display: block; margin: 10px auto; }
                    .image-container { display: flex; justify-content: center; }
                  </style>
                </head>
                <body>
                  <div class="image-container">
                    <img src="${imgUrl}" alt="Logo" style="width: 140px; height: 140px;" />
                  </div>
                  <pre>${content}</pre>
                  <div class="image-container">
                    <img src="${qrUrl}" alt="QR Code" class="qr" style="width: 80px; height: 80px;" />
                  </div>
                </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          }
        });
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
    }
  };

  const renderVentaRow = (venta) => {
    const tipoColor = TIPO_COMPROBANTE_COLORS[venta.tipoComprobante] || TIPO_COMPROBANTE_COLORS.Default;
    const estadoStyle = ESTADO_STYLES[venta.estado] || ESTADO_STYLES.Default;
    return (
      <TableRow key={venta.id} className='hover:bg-blue-50/60 transition-colors'>
        <TableCell className="font-bold text-center text-[13px] p-2">{venta.serieNum}<div className="text-gray-500">{venta.num}</div></TableCell>
        <TableCell className="text-center text-[13px] p-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tipoColor}`}>
            {venta.tipoComprobante}
          </span>
        </TableCell>
        <TableCell className="font-bold whitespace-normal text-[13px] p-2">
          <div>{venta.cliente}</div>
          <div className="text-gray-500">{venta.ruc}</div>
        </TableCell>
        <TableCell className="text-center text-[13px] p-2">
          <Tooltip
            content={
              <div className="text-xs text-gray-800">
                <p><strong>Hora de creación:</strong> {venta.hora_creacion ? new Date(`1970-01-01T${venta.hora_creacion}`).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "N/A"}</p>
                <p><strong>Fecha y hora de anulación:</strong> {venta.fecha_anulacion ? new Date(venta.fecha_anulacion).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "N/A"}</p>
                {venta.estado === 'Anulada' && venta.u_modifica && (
                  <p><strong>Anulado por:</strong> {venta.u_modifica}</p>
                )}
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
              <FaCalendarAlt className="text-blue-500 cursor-pointer" />
            </div>
          </Tooltip>
        </TableCell>
        <TableCell className="text-center text-[13px] p-2">{venta.igv}</TableCell>
        <TableCell className="text-center text-[13px] p-2">{venta.total}</TableCell>
        <TableCell className="font-bold text-center text-[13px] p-2">
          <div>{venta.cajero}</div>
        </TableCell>
        <TableCell className="text-center text-[13px] p-2">
          <Chip
            className="gap-1 border-none capitalize mb-0"
            color={
              ['Aceptada', 'Activo'].includes(venta.estado) ? "success" :
                ['En proceso'].includes(venta.estado) ? "warning" :
                  ['Anulada', 'Anulado'].includes(venta.estado) ? "danger" : "default"
            }
            size="sm"
            variant="flat"
            startContent={
              <span className={`w-1 h-1 rounded-full ml-1 ${['Aceptada', 'Activo'].includes(venta.estado) ? 'bg-success-600' :
                ['En proceso'].includes(venta.estado) ? 'bg-warning-600' :
                  ['Anulada', 'Anulado'].includes(venta.estado) ? 'bg-danger-600' : 'bg-slate-600'
                }`}></span>
            }
          >
            {venta.estado}
          </Chip>
        </TableCell>
        <TableCell className="text-[13px] p-2">
          <div className="relative flex justify-center items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <BsThreeDotsVertical className="text-default-500 text-xl" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Opciones de venta" variant="faded">
                <DropdownItem
                  key="detail"
                  startContent={<FaEye className="text-default-500 text-xl" />}
                  onPress={() => handleViewDetail(venta)}
                >
                  Ver Detalles
                </DropdownItem>
                <DropdownItem
                  key="print"
                  startContent={<TiPrinter className="text-default-500 text-xl" />}
                  onPress={() => handlePrintIconClick(venta)}
                >
                  Imprimir
                </DropdownItem>
                <DropdownItem
                  key="options"
                  startContent={<IoMdOptions className="text-default-500 text-xl" />}
                  onPress={() => openModal(venta.id, venta.estado)}
                >
                  Opciones Avanzadas
                </DropdownItem>
                <DropdownItem
                  key="exchange"
                  startContent={<FaExchangeAlt className="text-default-500 text-xl" />}
                  onPress={() => handleIntercambioClick(venta)}
                >
                  Intercambio
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderVentaInfo = (venta) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <Card className="relative overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
        <CardBody className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <FaFileInvoice className="text-lg" />
            </span>
            <div>
              <span className="block text-xs text-slate-500 font-medium uppercase tracking-wider">Comprobante</span>
              <span className="font-bold text-slate-800 dark:text-white text-base">{venta.serieNum}-{venta.num}</span>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${TIPO_COMPROBANTE_COLORS[venta.tipoComprobante] || TIPO_COMPROBANTE_COLORS.Default}`}>
                  {venta.tipoComprobante}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card className="relative overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
        <CardBody className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <FaUser className="text-lg" />
            </span>
            <div>
              <span className="block text-xs text-slate-500 font-medium uppercase tracking-wider">Cliente</span>
              <span className="font-bold text-slate-800 dark:text-white text-base line-clamp-1" title={venta.cliente}>{venta.cliente}</span>
              <div className="text-xs text-slate-400 font-medium">{venta.ruc}</div>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card className="relative overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
        <CardBody className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2.5 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
              <FaCalendarAlt className="text-lg" />
            </span>
            <div>
              <span className="block text-xs text-slate-500 font-medium uppercase tracking-wider">Fecha</span>
              <span className="font-bold text-slate-800 dark:text-white text-base">{venta.fechaEmision}</span>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ESTADO_STYLES[venta.estado]?.bg || "bg-slate-100"} ${ESTADO_STYLES[venta.estado]?.text || "text-slate-600"}`}>
                  {venta.estado}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const renderVentaResumen = (venta) => {
    let metodoPagoLegible = venta.metodo_pago;
    if (metodoPagoLegible && typeof metodoPagoLegible === "string") {
      metodoPagoLegible = metodoPagoLegible
        .replace(/:/g, ": ")
        .replace(/,/g, ", ")
        .replace(/\s+/g, " ")
        .replace(/([A-Z]+)/g, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
    }

    let subtotal = "-";
    if (venta.total && venta.igv) {
      const totalNum = parseFloat((venta.total + "").replace(/[^\d.-]/g, ""));
      const igvNum = parseFloat((venta.igv + "").replace(/[^\d.-]/g, ""));
      if (!isNaN(totalNum) && !isNaN(igvNum)) {
        subtotal = `S/ ${(totalNum - igvNum).toFixed(2)}`;
      }
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm flex flex-col">
          <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 py-3">
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
              <FaMoneyBillWave className="text-yellow-500" /> Información de Pago
            </span>
          </CardHeader>
          <CardBody className="p-4 flex-1 text-slate-600 dark:text-slate-300 text-sm">
            <div className="mb-2 flex justify-between">
              <span className="font-medium text-slate-500">Método:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{metodoPagoLegible}</span>
            </div>
            <div className="mb-2 flex justify-between">
              <span className="font-medium text-slate-500">Cajero:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{venta.cajero}</span>
            </div>
          </CardBody>
        </Card>

        <Card className="relative overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm flex flex-col">
          <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 py-3">
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
              <FaCalculator className="text-emerald-500" /> Resumen de Totales
            </span>
          </CardHeader>
          <CardBody className="p-4 flex-1 text-slate-600 dark:text-slate-300 text-sm">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-medium">{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Descuento:</span>
                <span className="text-rose-500 font-medium">{venta.descuento || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IGV (18%):</span>
                <span className="font-medium">{venta.igv}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 dark:text-white pt-2 border-t border-slate-100 dark:border-zinc-800 mt-1">
                <span>Total:</span>
                <span>{venta.total}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="relative overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm flex flex-col">
          <CardHeader className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 py-3">
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
              <FaFileInvoice className="text-blue-500" /> Observación
            </span>
          </CardHeader>
          <CardBody className="p-4 flex-1 text-sm">
            {venta.observacion ? (
              <span className="text-slate-700 dark:text-slate-300">{venta.observacion}</span>
            ) : (
              <span className="text-slate-400 italic">Sin observación registrada.</span>
            )}
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderVentaTable = (venta) => (
    <div className="w-full mt-4">
      <Card className="relative overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
        <CardHeader className="flex items-center gap-2 bg-slate-50/50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 py-3">
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
            <span className="text-lg">🛒</span> Productos y Servicios
          </span>
        </CardHeader>
        <CardBody className="p-0">
          <ScrollShadow hideScrollBar className="max-h-[250px] min-w-0 overflow-x-auto">
            <Table
              aria-label="Detalles de la Venta"
              removeWrapper
              className="min-w-[800px] text-[13px]"
              classNames={{
                th: "bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] h-9 dark:bg-zinc-800 dark:text-slate-400 border-b border-slate-100 dark:border-zinc-700",
                td: "py-2 border-b border-slate-50 dark:border-zinc-800/50 dark:text-slate-300 group-hover:bg-slate-50/50",
                tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors"
              }}
            >
              <TableHeader>
                <TableColumn className="text-center w-20">CÓDIGO</TableColumn>
                <TableColumn className="text-left">NOMBRE/DESCRIPCIÓN</TableColumn>
                <TableColumn className="text-left w-24">MARCA</TableColumn>
                <TableColumn className="text-center w-20">CANT.</TableColumn>
                <TableColumn className="text-center w-16">UND</TableColumn>
                <TableColumn className="text-right w-24">PRECIO</TableColumn>
                <TableColumn className="text-right w-24">DESC.</TableColumn>
                <TableColumn className="text-right w-24">IGV</TableColumn>
                <TableColumn className="text-right w-28">SUBTOTAL</TableColumn>
              </TableHeader>
              <TableBody>
                {venta.detalles.map((detalle, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-[12px] text-center font-medium text-slate-500">{detalle.codigo || "-"}</TableCell>
                    <TableCell className="text-[12px] text-left">
                      <div className="font-medium text-slate-700 dark:text-slate-200">{detalle.nombre}</div>
                    </TableCell>
                    <TableCell className="text-[12px] text-left text-slate-500">{detalle.nom_marca}</TableCell>
                    <TableCell className="text-[12px] text-center font-bold text-slate-700 dark:text-slate-300">{detalle.cantidad}</TableCell>
                    <TableCell className="text-[12px] text-center text-slate-500">{detalle.undm}</TableCell>
                    <TableCell className="text-[12px] text-right font-medium text-slate-600">{detalle.precio}</TableCell>
                    <TableCell className="text-[12px] text-right text-rose-500">{detalle.descuento === "S/ 0.00" || !detalle.descuento ? "-" : detalle.descuento}</TableCell>
                    <TableCell className="text-[12px] text-right text-slate-500">{detalle.igv}</TableCell>
                    <TableCell className="text-[12px] text-right font-bold text-slate-800 dark:text-white">{detalle.subtotal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollShadow>
        </CardBody>
      </Card>
    </div>
  );

  return (
    <div className="w-full p-0">
      <ScrollShadow hideScrollBar>
        <Table
          aria-label="Tabla de Ventas"
          removeWrapper
          className="min-w-full text-[13px]"
          classNames={{
            th: "bg-slate-50 text-slate-500 font-bold uppercase text-xs h-10 dark:bg-zinc-900 dark:text-slate-400",
            td: "py-3 border-b border-slate-100 dark:border-zinc-800 dark:text-gray-300",
            tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors"
          }}
        >
          <TableHeader>
            <TableColumn className="text-center">SERIE/NUM</TableColumn>
            <TableColumn className="text-center">TIPO.COMP</TableColumn>
            <TableColumn className="text-left">CLIENTE</TableColumn>
            <TableColumn className="text-center">F. EMISIÓN</TableColumn>
            <TableColumn className="text-center">IGV</TableColumn>
            <TableColumn className="text-center">TOTAL</TableColumn>
            <TableColumn className="text-center">CAJERO</TableColumn>
            <TableColumn className="text-center">ESTADO</TableColumn>
            <TableColumn className="text-center">ACCIONES</TableColumn>
          </TableHeader>
          <TableBody>
            {ventas.map(renderVentaRow)}
          </TableBody>
        </Table>
      </ScrollShadow>
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4 pb-4 gap-3">
        <Pagination
          showControls
          color="primary"
          page={currentPage}
          total={totalPages}
          onChange={setCurrentPage}
        />
        <Select
          aria-label="Ventas por página"
          selectedKeys={[String(ventasPerPage)]}
          onSelectionChange={(keys) => setVentasPerPage(Number(Array.from(keys)[0]))}
          className="w-28"
        >
          <SelectItem key="5" value={5}>5</SelectItem>
          <SelectItem key="10" value={10}>10</SelectItem>
          <SelectItem key="20" value={20}>20</SelectItem>
          <SelectItem key="100000" value={100000}>Todos</SelectItem>
        </Select>
      </div>

      {/* Modal Detalle */}
      <Modal
        isOpen={showDetailModal}
        onOpenChange={closeDetailModal}
        hideCloseButton={false}
        size="xl"
        className="z-[9999] max-w-[1600px] w-auto"
        backdrop="blur"
        placement="center"
      >
        <ModalContent>
          {(onClose) => {
            const venta = expandedRow !== null && ventas.find(v => v.id === expandedRow);
            return (
              <>
                <ModalHeader className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-blue-900">Detalles de la Venta</span>
                </ModalHeader>
                <ModalBody className="space-y-4 max-h-[65vh] overflow-y-auto pb-2">
                  {venta && (
                    <>
                      {renderVentaInfo(venta)}
                      {renderVentaTable(venta)}
                      {renderVentaResumen(venta)}
                    </>
                  )}
                </ModalBody>
              </>
            );
          }}
        </ModalContent>
      </Modal>

      {/* Modal Impresión */}
      <Modal backdrop={"opaque"} isOpen={isOpen} onOpenChange={onOpenChange}
        motionProps={{
          variants: {
            enter: { y: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
            exit: { y: -20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
          }
        }}
        classNames={{ backdrop: "bg-[#27272A]/10 backdrop-opacity-4" }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Opciones de impresión</ModalHeader>
              <ModalBody>
                <RadioGroup
                  label="Selecciona la opción para el formato del boucher"
                  value={printOption}
                  onChange={(e) => setPrintOption(e.target.value)}
                >
                  <Radio value="print">Descargar PDF</Radio>
                  <Radio value="print-1">Imprimir boucher de la venta</Radio>
                </RadioGroup>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="shadow" onPress={onClose}>Cerrar</Button>
                <Button color="primary" variant="shadow" onPress={onClose} onClick={handlePrint}>Aceptar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Intercambio */}
      <IntercambioModal
        isOpen={modalIntercambioOpen}
        onClose={() => setModalIntercambioOpen(false)}
        venta={selectedVentaForIntercambio}
        onConfirm={handleConfirmIntercambio}
      />

    </div>
  );
};

TablaVentas.propTypes = {
  ventas: PropTypes.array.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  ventasPerPage: PropTypes.number.isRequired,
  setVentasPerPage: PropTypes.func.isRequired,
  refreshVentas: PropTypes.func
};

export default TablaVentas;