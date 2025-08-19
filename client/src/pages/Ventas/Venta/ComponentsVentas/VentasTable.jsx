import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from "react-icons/io";
import { TiPrinter } from "react-icons/ti";
import { generateReceiptContent } from '../../../Ventas/Registro_Venta/ComponentsRegistroVentas/Comprobantes/Voucher/Voucher';
import useBoucher from '@/services/data/data_boucher';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure,
  RadioGroup, Radio, Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Tooltip, Pagination, Select, SelectItem, ScrollShadow
} from "@heroui/react";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import { FaUser, FaCalendarAlt, FaFileInvoice, FaMapMarkerAlt, FaMoneyBillWave, FaUserTie, FaCalculator } from "react-icons/fa";


const ESTADO_MAP = {
  'En proceso': 2,
  'Aceptada': 1,
  'Anulada': 0
};

const TIPO_COMPROBANTE_COLORS = {
  Factura: 'bg-orange-100 text-orange-700 border border-orange-200',
  Boleta: 'bg-purple-100 text-purple-700 border border-purple-200',
  Default: 'bg-blue-100 text-blue-700 border border-blue-200'
};

const ESTADO_STYLES = {
  Aceptada: { bg: 'bg-green-100', text: 'text-green-700', icon: 'fa-check-circle' },
  'En proceso': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'fa-hourglass-half' },
  Anulada: { bg: 'bg-rose-100', text: 'text-rose-700', icon: 'fa-times-circle' },
  Default: { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'fa-info-circle' }
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

  // Zustand: setter y selectores
  const setVentaSeleccionada = useVentaSeleccionadaStore((state) => state.setVentaSeleccionada);
  const ventaSeleccionada = useVentaSeleccionadaStore((state) => state.venta);
  const detallesSeleccionados = useVentaSeleccionadaStore((state) => state.detalles);
  const setComprobante1 = useVentaSeleccionadaStore((state) => state.setComprobante1);
  const setObservacion = useVentaSeleccionadaStore((state) => state.setObservacion);
  const comprobante1 = useVentaSeleccionadaStore(state => state.comprobante1);
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

const handleRowClick = (e, venta) => {
  if (!e.target.closest('.ignore-toggle')) {
    setExpandedRow(venta.id);
    setShowDetailModal(true);
  }
};

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setExpandedRow(null);
  };


  // Hook para obtener los datos del boucher
  const { venta_B } = useBoucher(ventaSeleccionada?.id_venta_boucher);

  // Mantener el comprobante por venta en estado local
  useEffect(() => {
    if (venta_B?.num_comprobante && ventaSeleccionada?.id) {
      setComprobantePorVenta(prev => ({
        ...prev,
        [ventaSeleccionada.id]: venta_B.num_comprobante
      }));
    }
    if (ventaSeleccionada?.observacion) setObservacion({ observacion: ventaSeleccionada.observacion });
  }, [venta_B?.num_comprobante, ventaSeleccionada?.id, ventaSeleccionada?.observacion, setObservacion]);
  
  // Al hacer click en imprimir, setear venta actual y abrir modal
  const handlePrintIconClick = (venta) => {
    setVentaSeleccionada(venta);
    setVentaActualId(venta.id);
    onOpen();
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
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [75, 284] });
        const qrText = 'https://www.facebook.com/profile.php?id=100055385846115';
        QRCode.toDataURL(qrText, { width: 100, height: 100 }, (err, qrUrl) => {
          if (!err) {
            if (imgUrl) doc.addImage(imgUrl, 'JPEG', 10, 10, 50, 50);
            doc.setFont('Courier');
            doc.setFontSize(8);
            doc.text(content, 3, 55);
            doc.addImage(qrUrl, 'PNG', 16, 230, 43, 43);
            doc.save('recibo.pdf');
          }
        });
      } else if (printOption === 'print-1') {
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
      <TableRow key={venta.id} onClick={(e) => handleRowClick(e, venta)} className='cursor-pointer hover:bg-blue-50/60 transition-colors'>
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
              <i className="fas fa-calendar-alt text-blue-500 cursor-pointer"></i>
            </div>
          </Tooltip>
        </TableCell>
        <TableCell className="text-center text-[13px] p-2">{venta.igv}</TableCell>
        <TableCell className="text-center text-[13px] p-2">{venta.total}</TableCell>
        <TableCell className="font-bold text-[13px] p-2">
          <div>{venta.cajero}</div>
          <div className="text-gray-500">{venta.cajeroId}</div>
        </TableCell>
        <TableCell className="text-center text-[13px] p-2">
          <Tooltip content={venta.estado === 'Anulada' ? `Usuario que dio de baja: ${venta.u_modifica || 'N/A'}` : `Estado: ${venta.estado}`}>
            <span
              className={`
                inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                ${estadoStyle.bg} ${estadoStyle.text} border
                ${venta.estado === 'Aceptada' ? 'border-green-200' : venta.estado === 'En proceso' ? 'border-yellow-200' : venta.estado === 'Anulada' ? 'border-rose-200' : 'border-gray-200'}
                min-w-[90px] justify-center
              `}
              style={{ fontSize: "13px" }}
            >
              {venta.estado === 'Aceptada' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {venta.estado === 'En proceso' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
              {venta.estado === 'Anulada' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}
              <span className="ml-1">{venta.estado}</span>
            </span>
          </Tooltip>
        </TableCell>
        <TableCell className="text-[13px] p-2">
          <div className='flex justify-center items-center gap-2'>
            <IoMdOptions
              className={`ignore-toggle cursor-pointer ${venta.estado === 'Anulada' ? 'text-gray-300' : 'text-gray-500'} ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ fontSize: '20px' }}
              onClick={() => {
                openModal(venta.id, venta.estado);
              }}
            />
            <TiPrinter
              className='ignore-toggle text-gray-500 cursor-pointer'
              onClick={() => handlePrintIconClick(venta)}
              style={{ fontSize: '20px' }}
            />
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
          </div>
        </TableCell>
      </TableRow>
    );
  };


  const renderVentaInfo = (venta) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    {/* Card Comprobante */}
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
    {/* Card Cliente */}
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
    {/* Card Fecha/Estado */}
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
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_STYLES[venta.estado]?.bg || "bg-gray-100"} ${ESTADO_STYLES[venta.estado]?.text || "text-gray-700"}`}>
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
  // Cast legible para método de pago
  let metodoPagoLegible = venta.metodo_pago;
  if (metodoPagoLegible && typeof metodoPagoLegible === "string") {
    metodoPagoLegible = metodoPagoLegible
      .replace(/:/g, ": ")
      .replace(/,/g, ", ")
      .replace(/\s+/g, " ")
      .replace(/([A-Z]+)/g, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
  }

  // Calcular subtotal como total - igv (ambos en formato "S/ 0.00")
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
      {/* Información de Pago */}
      <Card className="relative overflow-hidden border border-yellow-200/40 bg-yellow-50/80 rounded-2xl shadow-none flex flex-col">
        <CardHeader className="bg-yellow-100/80 border-b border-yellow-200">
          <span className="font-semibold text-yellow-700 text-base flex items-center gap-2">
            <FaMoneyBillWave className="text-lg" /> Información de Pago
          </span>
        </CardHeader>
        <CardBody className="p-4 flex-1">
          <div className="mb-2">
            <span className="font-semibold text-yellow-900">Método de Pago: </span>
            <span>{metodoPagoLegible}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-yellow-900">Cajero: </span>
            <span>{venta.cajero}</span>
          </div>
          <div>
            <span className="font-semibold text-yellow-900">ID Cajero: </span>
            <span>{venta.cajeroId}</span>
          </div>
        </CardBody>
      </Card>
      {/* Resumen de Totales */}
      <Card className="relative overflow-hidden border border-emerald-200/40 bg-emerald-50/80 rounded-2xl shadow-none flex flex-col">
        <CardHeader className="bg-emerald-100/80 border-b border-emerald-200">
          <span className="font-semibold text-emerald-700 text-base flex items-center gap-2">
            <FaCalculator className="text-lg" /> Resumen de Totales
          </span>
        </CardHeader>
        <CardBody className="p-4 flex-1">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Descuento:</span>
              <span className="text-red-500">{venta.descuento || "-/ -"}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV (18%):</span>
              <span>{venta.igv}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-700 mt-2">
              <span>Total:</span>
              <span>{venta.total}</span>
            </div>
          </div>
        </CardBody>
      </Card>
      {/* Observación */}
      <Card className={`relative overflow-hidden border rounded-2xl shadow-none flex flex-col ${venta.observacion ? "border-blue-200/40 bg-blue-50/80" : "border-gray-200/40 bg-gray-50/80"}`}>
        <CardHeader className={`${venta.observacion ? "bg-blue-100/80 border-b border-blue-200" : "bg-gray-100/80 border-b border-gray-200"}`}>
          <span className={`font-semibold text-base flex items-center gap-2 ${venta.observacion ? "text-blue-700" : "text-gray-700"}`}>
            <FaFileInvoice className="text-lg" /> Observación
          </span>
        </CardHeader>
        <CardBody className="p-4 flex-1">
          {venta.observacion
            ? <span className="text-blue-900">{venta.observacion}</span>
            : <span className="text-gray-500 italic">Sin observación</span>
          }
        </CardBody>
      </Card>
    </div>
  );
};

const renderVentaTable = (venta) => (
  <div className="w-full mt-4">
    <Card className="relative overflow-hidden border border-blue-100 bg-white/90 rounded-2xl shadow-none">
      <CardHeader className="flex items-center gap-2 bg-blue-50 border-b border-blue-100">
        <span className="font-semibold text-blue-900 text-base flex items-center gap-2">
          <span className="text-xl">🛒</span> Productos y Servicios
        </span>
      </CardHeader>
      <CardBody className="p-0">
        <ScrollShadow hideScrollBar className="max-h-[220px] min-w-0 overflow-x-auto">
          <Table aria-label="Detalles de la Venta" className="min-w-[1400px] text-[13px]">
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
                <TableRow key={idx}>
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
        <Table aria-label="Tabla de Ventas" className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
          <TableHeader>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">SERIE/NUM</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">TIPO.COMP</TableColumn>
            <TableColumn className="py-2 px-2 text-blue-900 bg-blue-50">CLIENTE</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">F. EMISIÓN</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">IGV</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">TOTAL</TableColumn>
            <TableColumn className="py-2 px-2 text-blue-900 bg-blue-50">CAJERO</TableColumn>
            <TableColumn className="py-2 px-2 text-center text-blue-900 bg-blue-50">ESTADO</TableColumn>
            <TableColumn className="py-2 px-2 text-blue-900 bg-blue-50"></TableColumn>
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
      {/* Modal flotante HeroUI para detalle */}
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
};

export default TablaVentas;