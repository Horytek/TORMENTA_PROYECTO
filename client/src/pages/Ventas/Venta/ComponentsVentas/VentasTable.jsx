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
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
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
  Aceptada: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-200', icon: 'fa-check-circle' },
  'En proceso': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-200', icon: 'fa-hourglass-half' },
  Anulada: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-200', icon: 'fa-times-circle' },
  Default: { bg: 'bg-gray-100 dark:bg-gray-800/40', text: 'text-gray-700 dark:text-gray-200', icon: 'fa-info-circle' }
};

const TIPO_COMPROBANTE_COLORS = {
  Factura: 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800/60',
  Boleta: 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800/60',
  Default: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60'
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
          <span
            className={`
                  inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                  ${estadoStyle.bg} ${estadoStyle.text} border
                  ${venta.estado === 'Aceptada' ? 'border-green-200 dark:border-green-800/60' : venta.estado === 'En proceso' ? 'border-yellow-200 dark:border-yellow-800/60' : venta.estado === 'Anulada' ? 'border-rose-200 dark:border-rose-800/60' : 'border-gray-200 dark:border-gray-700/60'}
                  min-w-[90px] justify-center
                `}
          >
            {venta.estado}
          </span>
        </TableCell>
        <TableCell className="text-[13px] p-2">
          <div className="relative flex justify-center items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <BsThreeDotsVertical className="text-default-500 text-xl" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Opciones de venta">
                <DropdownItem
                  startContent={<FaEye className="text-blue-500" />}
                  onPress={() => handleViewDetail(venta)}
                >
                  Ver Detalles
                </DropdownItem>
                <DropdownItem
                  startContent={<TiPrinter className="text-gray-500 text-lg" />}
                  onPress={() => handlePrintIconClick(venta)}
                >
                  Imprimir
                </DropdownItem>
                <DropdownItem
                  startContent={<IoMdOptions className="text-red-500 text-lg" />}
                  onPress={() => openModal(venta.id, venta.estado)}
                  className="text-danger"
                  color="danger"
                >
                  Opciones Avanzadas
                </DropdownItem>
                <DropdownItem
                  startContent={<FaExchangeAlt className="text-orange-500 text-lg" />}
                  onPress={() => handleIntercambioClick(venta)}
                  className="text-warning"
                  color="warning"
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
      <Card className="relative overflow-hidden border border-blue-200/40 bg-white/90 rounded-2xl shadow-none">
        <CardBody className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-100 shadow">
              <FaFileInvoice className="text-xl text-blue-500" />
            </span>
            <div>
              <span className="block text-xs text-blue-700 font-semibold">Comprobante</span>
              <span className="font-bold text-blue-900 text-lg">{venta.serieNum}-{venta.num}</span>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIPO_COMPROBANTE_COLORS[venta.tipoComprobante] || TIPO_COMPROBANTE_COLORS.Default}`}>
                  {venta.tipoComprobante}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card className="relative overflow-hidden border border-emerald-200/40 bg-white/90 rounded-2xl shadow-none">
        <CardBody className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-100 shadow">
              <FaUser className="text-xl text-emerald-500" />
            </span>
            <div>
              <span className="block text-xs text-emerald-700 font-semibold">Cliente</span>
              <span className="font-bold text-emerald-900 text-lg">{venta.cliente}</span>
              <div className="text-xs text-gray-500">{venta.ruc}</div>
            </div>
          </div>
        </CardBody>
      </Card>
      <Card className="relative overflow-hidden border border-violet-200/40 bg-white/90 rounded-2xl shadow-none">
        <CardBody className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-violet-100 shadow">
              <FaCalendarAlt className="text-xl text-violet-500" />
            </span>
            <div>
              <span className="block text-xs text-violet-700 font-semibold">Fecha</span>
              <span className="font-bold text-violet-900 text-lg">{venta.fechaEmision}</span>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_STYLES[venta.estado]?.bg || "bg-gray-100 dark:bg-gray-800/40"} ${ESTADO_STYLES[venta.estado]?.text || "text-gray-700 dark:text-gray-200"}`}>
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
        <Card className="relative overflow-hidden border border-yellow-200/40 dark:border-yellow-900/40 bg-yellow-50/80 dark:bg-[#2a281c]/70 rounded-2xl shadow-none flex flex-col">
          <CardHeader className="bg-yellow-100/80 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800/50">
            <span className="font-semibold text-yellow-700 dark:text-yellow-200 text-base flex items-center gap-2">
              <FaMoneyBillWave className="text-lg" /> Información de Pago
            </span>
          </CardHeader>
          <CardBody className="p-4 flex-1 text-yellow-900 dark:text-yellow-100">
            <div className="mb-2">
              <span className="font-semibold text-yellow-900 dark:text-yellow-200">Método de Pago: </span>
              <span className="dark:text-yellow-50">{metodoPagoLegible}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold text-yellow-900 dark:text-yellow-200">Cajero: </span>
              <span className="dark:text-yellow-50">{venta.cajero}</span>
            </div>
            <div>
              <span className="font-semibold text-yellow-900 dark:text-yellow-200">ID Cajero: </span>
              <span className="dark:text-yellow-50">{venta.cajeroId}</span>
            </div>
          </CardBody>
        </Card>

        <Card className="relative overflow-hidden border border-emerald-200/40 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-[#1c2b25]/75 rounded-2xl shadow-none flex flex-col">
          <CardHeader className="bg-emerald-100/80 dark:bg-emerald-900/30 border-b border-emerald-200 dark:border-emerald-800/50">
            <span className="font-semibold text-emerald-700 dark:text-emerald-200 text-base flex items-center gap-2">
              <FaCalculator className="text-lg" /> Resumen de Totales
            </span>
          </CardHeader>
          <CardBody className="p-4 flex-1 text-emerald-900 dark:text-emerald-50">
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-800 dark:text-emerald-200">Subtotal:</span>
                <span>{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 dark:text-emerald-200">Descuento:</span>
                <span className="text-red-500">{venta.descuento || "-/ -"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 dark:text-emerald-200">IGV (18%):</span>
                <span>{venta.igv}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-300 mt-2">
                <span>Total:</span>
                <span>{venta.total}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card
          className={`relative overflow-hidden border rounded-2xl shadow-none flex flex-col
          ${venta.observacion
              ? "border-blue-200/40 bg-blue-50/80 dark:border-blue-900/50 dark:bg-[#132238]/80"
              : "border-gray-200/40 bg-gray-50/80 dark:border-gray-700/60 dark:bg-[#1f242b]/70"}`}
        >
          <CardHeader
            className={`${venta.observacion
              ? "bg-blue-100/80 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800/60"
              : "bg-gray-100/80 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-700/60"
              }`}
          >
            <span
              className={`font-semibold text-base flex items-center gap-2 ${venta.observacion
                ? "text-blue-700 dark:text-blue-200"
                : "text-gray-700 dark:text-gray-200"
                }`}
            >
              <FaFileInvoice className="text-lg" /> Observación
            </span>
          </CardHeader>
          <CardBody className="p-4 flex-1 text-sm">
            {venta.observacion ? (
              <span className="text-blue-900 dark:text-blue-100">{venta.observacion}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 italic">Sin observación</span>
            )}
          </CardBody>
        </Card>
      </div>
    );
  };

  const renderVentaTable = (venta) => (
    <div className="w-full mt-4">
      <Card className="relative overflow-hidden border border-blue-100 dark:border-blue-900/40 bg-white/90 dark:bg-[#18212b]/85 rounded-2xl shadow-none">
        <CardHeader className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800/60">
          <span className="font-semibold text-blue-900 dark:text-blue-100 text-base flex items-center gap-2">
            <span className="text-xl">🛒</span> Productos y Servicios
          </span>
        </CardHeader>
        <CardBody className="p-0">
          <ScrollShadow hideScrollBar className="max-h-[220px] min-w-0 overflow-x-auto">
            <Table
              aria-label="Detalles de la Venta"
              className="min-w-[1400px] text-[13px]"
              classNames={{
                th: "bg-white/90 dark:bg-[#1e2a36]/90 text-blue-800 dark:text-blue-200",
                tr: "dark:hover:bg-[#223140]/60",
                td: "dark:text-gray-200"
              }}
            >
              <TableHeader>
                <TableColumn className="text-[12px] text-center w-20">CÓDIGO</TableColumn>
                <TableColumn className="text-[12px] text-left w-96">NOMBRE</TableColumn>
                <TableColumn className="text-[12px] text-left w-42">MARCA</TableColumn>
                <TableColumn className="text-[12px] text-center w-20">CANTIDAD</TableColumn>
                <TableColumn className="text-[12px] text-center w-20">UND</TableColumn>
                <TableColumn className="text-[12px] text-right w-24">PRECIO</TableColumn>
                <TableColumn className="text-[12px] text-right w-24">DESCUENTO</TableColumn>
                <TableColumn className="text-[12px] text-right w-24">IGV</TableColumn>
                <TableColumn className="text-[12px] text-right w-28">SUBTOTAL</TableColumn>
              </TableHeader>
              <TableBody>
                {venta.detalles.map((detalle, idx) => (
                  <TableRow key={idx} className="dark:even:bg-[#202d3a]/70 dark:odd:bg-[#1b2631]/70">
                    <TableCell className="text-[11px] p-1 text-center align-middle">{detalle.codigo}</TableCell>
                    <TableCell className="text-[11px] p-1 text-left align-middle">{detalle.nombre}</TableCell>
                    <TableCell className="text-[11px] p-1 text-left align-middle">{detalle.nom_marca}</TableCell>
                    <TableCell className="text-[11px] p-1 text-center align-middle">{detalle.cantidad}</TableCell>
                    <TableCell className="text-[11px] p-1 text-center align-middle">{detalle.undm}</TableCell>
                    <TableCell className="text-[11px] p-1 text-right align-middle">{detalle.precio}</TableCell>
                    <TableCell className="text-[11px] p-1 text-right align-middle">{detalle.descuento}</TableCell>
                    <TableCell className="text-[11px] p-1 text-right align-middle">{detalle.igv}</TableCell>
                    <TableCell className="text-[11px] p-1 text-right align-middle">{detalle.subtotal}</TableCell>
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
          className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]"
          classNames={{
            th: "py-2 px-2 text-center bg-blue-50 text-blue-900 dark:bg-[#1e2a36] dark:text-blue-100",
            td: "dark:text-gray-200",
            tr: "hover:bg-blue-50 dark:hover:bg-[#233243]"
          }}
        >
          <TableHeader>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">SERIE/NUM</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">TIPO.COMP</TableColumn>
            <TableColumn className="py-2 px-2 text-left text-blue-900 bg-blue-50">CLIENTE</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">F. EMISIÓN</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">IGV</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">TOTAL</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">CAJERO</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">ESTADO</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">ACCIONES</TableColumn>
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