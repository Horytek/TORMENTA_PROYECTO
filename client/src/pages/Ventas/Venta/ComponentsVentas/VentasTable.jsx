import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from "react-icons/io";
import { TiPrinter } from "react-icons/ti";
import { generateReceiptContent } from '../../../Ventas/Registro_Venta/ComponentsRegistroVentas/Comprobantes/Voucher/Voucher';
import useBoucher from '@/services/Data/data_boucher';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, RadioGroup, Radio, Card, 
  CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip } from "@heroui/react";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { format } from 'date-fns'
import { useUserStore } from "@/store/useStore";
import { useVentaSeleccionadaStore } from "@/store/useVentaTable"; // <-- Importa tu store


const TablaVentas = ({ ventas, modalOpen, deleteOptionSelected, openModal, currentPage }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [printOption, setPrintOption] = useState('');
  const [empresaData, setEmpresaData] = useState(null); // Estado para almacenar los datos de la empresa
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const nombre = useUserStore((state) => state.nombre);

      const formatHours = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

  useEffect(() => {
    setExpandedRow(null);
    const fetchEmpresaData = async () => {
                try {
                    const data = await getEmpresaDataByUser(nombre);
                    setEmpresaData(data); // Establecer los datos de la empresa en el estado
                } catch (error) {
                    console.error("Error al obtener los datos de la empresa:", error);
                }
            };
            fetchEmpresaData(); // Llamar a la función para obtener los datos de la empresa
  }, [currentPage,nombre]);

  // Zustand: setter y selectores
  const setVentaSeleccionada = useVentaSeleccionadaStore((state) => state.setVentaSeleccionada);
  const ventaSeleccionada = useVentaSeleccionadaStore((state) => state.venta);
  const detallesSeleccionados = useVentaSeleccionadaStore((state) => state.detalles);
  const setComprobante1 = useVentaSeleccionadaStore((state) => state.setComprobante1);
  const setObservacion = useVentaSeleccionadaStore((state) => state.setObservacion);
  const comprobante1 = useVentaSeleccionadaStore(state => state.comprobante1);
  const observacion = useVentaSeleccionadaStore(state => state.observacion);

  const toggleRow = (id, estado, venta) => {
    setExpandedRow(expandedRow === id ? null : id);

    const estadoMap = {
      'En proceso': 2,
      'Aceptada': 1,
      'Anulada': 0
    };

    const datos_venta = {
      id,
      serieNum: venta.serieNum,
      num: venta.num,
      tipoComprobante: venta.tipoComprobante,
      estado: estadoMap[estado] || estado,
      igv: venta.igv,
      nombre: venta.cliente,
      documento: venta.ruc,
      fechaEmision: venta.fecha_iso,
      id_anular: venta.id_anular,
      id_anular_b: venta.id_anular_b,
      estado_sunat: venta.estado_sunat,
      anular: venta.anular,
      anular_b: venta.anular_b,
      id_venta_boucher: venta.id_venta_boucher,
      sucursal: venta.nombre_sucursal,
      direccion: venta.ubicacion,
      usua_vendedor: venta.usua_vendedor,
      observacion: venta.observacion || '',
      usua_usuario: nombre
    };


    setVentaSeleccionada(datos_venta, venta.detalles);
  };

  const handleRowClick = (e, venta) => {
    if (!e.target.closest('.ignore-toggle')) {
      toggleRow(venta.id, venta.estado, venta);
    }
  };

// Usa los datos seleccionados desde Zustand
  const { venta_B } = useBoucher(ventaSeleccionada?.id_venta_boucher);

useEffect(() => {
  if (venta_B?.num_comprobante) {
    setComprobante1({ nuevoNumComprobante: venta_B.num_comprobante });
  }
  if (ventaSeleccionada?.observacion) {
    setObservacion({ observacion: ventaSeleccionada.observacion });
  }
}, [venta_B?.num_comprobante, ventaSeleccionada?.observacion, setComprobante1, setObservacion]);

const handlePrint = async () => {
  try {
    const content = await generateReceiptContent(      venta_B, // datosVentaComprobante
      ventaSeleccionada, // datosVenta
      comprobante1,
      observacion,
      nombre,
      empresaData);
    const imgUrl = empresaData?.logotipo || '';

    if (printOption === 'print') {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [75, 284] });

      // Asegúrate de que el texto del QR sea una cadena válida
      const qrText = 'https://www.facebook.com/profile.php?id=100055385846115';
      QRCode.toDataURL(qrText, { width: 100, height: 100 }, (err, qrUrl) => {
        if (!err) {
          if (imgUrl) {
            doc.addImage(imgUrl, 'JPEG', 10, 10, 50, 50);
          }
          doc.setFont('Courier');
          doc.setFontSize(8);
          doc.text(content, 3, 55);
          doc.addImage(qrUrl, 'PNG', 16, 230, 43, 43);
          doc.save('recibo.pdf');
        } else {
          console.error('Error generando el código QR:', err);
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
        } else {
          console.error('Error generando el código QR:', err);
        }
      });
    }
  } catch (error) {
    console.error('Error al generar el PDF:', error);
  }
};

  const renderVentaRow = (venta) => (
    <TableRow key={venta.id} onClick={(e) => handleRowClick(e, venta)} className='cursor-pointer hover:bg-gray-100 transition-colors'>
      <TableCell className="font-bold text-center text-[12px] p-1">
        <div>{venta.serieNum}</div>
        <div className="text-gray-500">{venta.num}</div>
      </TableCell>
      <TableCell className="text-center text-[12px] p-1">
        <span className={`px-4 py-2 rounded-full ${getTipoComprobanteClass(venta.tipoComprobante)} text-white`}>
          {venta.tipoComprobante}
        </span>
      </TableCell>
      <TableCell className="font-bold whitespace-normal text-[12px] p-1">
        <div className='whitespace-normal'>{venta.cliente}</div>
        <div className="text-gray-500 whitespace-normal">{venta.ruc}</div>
      </TableCell>
      <TableCell className="text-center text-[12px] p-1">
        <Tooltip
          content={
            <div className="text-sm text-gray-800">
              <p>
                <strong>Hora de creación:</strong>{" "}
                {venta.hora_creacion
                  ? new Date(`1970-01-01T${venta.hora_creacion}`).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true, // Formato de 12 horas
                    })
                  : "N/A"}
              </p>
              <p>
                <strong>Fecha y hora de anulación:</strong>{" "}
                {venta.fecha_anulacion
                  ? new Date(venta.fecha_anulacion).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true, // Formato de 12 horas
                    })
                  : "N/A"}
              </p>
            </div>
          }
          placement="top"
          className="bg-white shadow-lg rounded-lg p-2 border border-gray-300"
        >
          <div className="flex justify-center items-center gap-1">
          <span>
            {venta.fechaEmision
              ? new Date(venta.fechaEmision + "T12:00:00").toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "N/A"}
          </span>
            <i className="fas fa-calendar-alt text-blue-500 cursor-pointer"></i>
          </div>
        </Tooltip>
      </TableCell>
      <TableCell className="text-center text-[12px] p-1">{venta.igv}</TableCell>
      <TableCell className="text-center text-[12px] p-1">{venta.total}</TableCell>
      <TableCell className="font-bold text-[12px] p-1">
        <div className="whitespace-normal">{venta.cajero}</div>
        <div className="text-gray-500 whitespace-normal">{venta.cajeroId}</div>
      </TableCell>
      <TableCell className="text-center text-[12px] p-1" style={{ color: getEstadoColor(venta.estado), fontWeight: "400" }}>
        <Tooltip content={venta.estado === 'Anulada' ? `Usuario que dio de baja: ${venta.u_modifica || 'N/A'}` : `Estado: ${venta.estado}`}>
          <div className="flex justify-center items-center gap-1 py-1.5 rounded-full" style={{ background: getEstadoBackground(venta.estado) }}>
            <span>{venta.estado}</span>
            <i className={`fas ${venta.estado === 'Anulada' ? 'fa-user text-red-500' : 'fa-info-circle text-gray-500'} cursor-pointer`}></i>
          </div>
        </Tooltip>
      </TableCell>
      <TableCell className="text-[12px] p-1">
        <div className='flex justify-center items-center'>
          <Tooltip content="Opciones">
            <IoMdOptions
              className={`ml-2 ml-5 mr-4 cursor-pointer ${venta.estado === 'Anulada' ? 'text-gray-300' : 'text-gray-500'} ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ fontSize: '20px' }}
              onClick={() => openModal(venta.id, venta.estado)}
            />
          </Tooltip>
          <Tooltip content="Imprimir">
            <TiPrinter className='text-gray-500 cursor-pointer' onClick={onOpen} style={{ fontSize: '20px' }} />
          </Tooltip>
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

  const renderVentaDetails = (detalles) => (
    <Card className="mt-4 w-full shadow-[0_0_10px_#171a1f33] bg-[#171a1f09] rounded-[10px] animate-fade-in max-h-[400px] overflow-y-auto">
      <CardHeader className="bg-gray-50 border-b border-gray-200 rounded-t-2xl p-4">
        <h4 className="text-xl font-semibold text-gray-700">Detalles de la Venta</h4>
      </CardHeader>
      <CardBody className="p-5">
        <Table aria-label="Detalles de la Venta">
          <TableHeader>
            <TableColumn className="text-[12px]">CÓDIGO</TableColumn>
            <TableColumn className="text-[12px]">NOMBRE</TableColumn>
            <TableColumn className="text-[12px]">CANTIDAD</TableColumn>
            <TableColumn className="text-[12px]">PRECIO</TableColumn>
            <TableColumn className="text-[12px]">DESCUENTO</TableColumn>
            <TableColumn className="text-[12px]">SUBTOTAL</TableColumn>
          </TableHeader>
          <TableBody>
            {detalles.map((detalle, index) => (
              <TableRow key={index}>
                <TableCell className="text-[10px] p-1">{detalle.codigo}</TableCell>
                <TableCell className="text-[10px] p-1">{detalle.nombre}</TableCell>
                <TableCell className="text-[10px] p-1">{detalle.cantidad}</TableCell>
                <TableCell className="text-[10px] p-1">{detalle.precio}</TableCell>
                <TableCell className="text-[10px] p-1">{detalle.descuento}</TableCell>
                <TableCell className="text-[10px] p-1">{detalle.subtotal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardBody>
    </Card>
  );

  const getTipoComprobanteClass = (tipoComprobante) => {
    switch (tipoComprobante) {
      case 'Factura': return 'bg-orange-500';
      case 'Boleta': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Aceptada': return '#117B34FF';
      case 'En proceso': return '#F5B047';
      case 'Anulada': return '#E05858FF';
      default: return '#000';
    }
  };

  const getEstadoBackground = (estado) => {
    switch (estado) {
      case 'Aceptada': return 'rgb(191, 237, 206)';
      case 'En proceso': return '#FDEDD4';
      case 'Anulada': return '#F5CBCBFF';
      default: return '#FFF';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row">
      <div className={`px-4 bg-white rounded-lg shadow-md transition-all duration-500 ${expandedRow !== null ? 'lg:w-3/4' : 'w-full'} animate-[shrinkExpand_0.5s_ease-in-out]`}>
        <Table aria-label="Tabla de Ventas">
          <TableHeader>
            <TableColumn className="text-center text-[12px]">SERIE/NUM</TableColumn>
            <TableColumn className="text-center text-[12px]">TIPO.COMP</TableColumn>
            <TableColumn className="text-[12px]">CLIENTE</TableColumn>
            <TableColumn className="text-center text-[12px]">F. EMISIÓN</TableColumn>
            <TableColumn className="text-center text-[12px]">IGV</TableColumn>
            <TableColumn className="text-center text-[12px]">TOTAL</TableColumn>
            <TableColumn className="text-[12px]">CAJERO</TableColumn>
            <TableColumn className="text-center text-[12px]">ESTADO</TableColumn>
            <TableColumn className="text-[12px]"></TableColumn>
          </TableHeader>
          <TableBody>
            {ventas.map(renderVentaRow)}
          </TableBody>
        </Table>
      </div>
      {expandedRow !== null && (
        <div className="w-full lg:w-full lg:ml-4 mt-4 lg:mt-0">
          {renderVentaDetails(ventas.find(venta => venta.id === expandedRow).detalles)}
        </div>
      )}
    </div>
  );
};

TablaVentas.propTypes = {
  ventas: PropTypes.array.isRequired,
  modalOpen: PropTypes.bool.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  openModal: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default TablaVentas;