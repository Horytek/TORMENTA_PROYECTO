import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from "react-icons/io";
import { TiPrinter } from "react-icons/ti";
import { generateReceiptContent } from '../../../Ventas/Registro_Venta/ComponentsRegistroVentas/Comprobantes/Voucher/Voucher';
import useBoucher from '../../Data/data_boucher';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, RadioGroup, Radio } from "@nextui-org/react";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const TablaVentas = ({ ventas, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  const [printOption, setPrintOption] = useState('');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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
      usua_usuario: localStorage.getItem('usuario')
    };

    localStorage.setItem('ventas', JSON.stringify(datos_venta));
    localStorage.setItem('boucher', JSON.stringify(datos_venta.id_venta_boucher));
    localStorage.setItem('new_detalle', JSON.stringify(venta.detalles));
    localStorage.setItem('datosClientes', JSON.stringify({ nombre: venta.cliente, documento: venta.ruc }));
    localStorage.setItem('surB', JSON.stringify({ sucursal: venta.nombre_sucursal, direccion: venta.ubicacion }));
  };

  const handleRowClick = (e, venta) => {
    if (!e.target.closest('.ignore-toggle')) {
      toggleRow(venta.id, venta.estado, venta);
    }
  };

  const loadDetallesFromLocalStorage = () => {
    const savedDetalles = localStorage.getItem('ventas');
    return savedDetalles ? JSON.parse(savedDetalles) : [];
  };

  const ventas_VB = loadDetallesFromLocalStorage();
  const { venta_B } = useBoucher(ventas_VB.id_venta_boucher);

  localStorage.setItem('comprobante1', JSON.stringify({ nuevoNumComprobante: venta_B.num_comprobante }));
  localStorage.setItem('observacion', JSON.stringify({ observacion: ventas_VB.observacion }));

  const handlePrint = async () => {
    const content = generateReceiptContent(venta_B, ventas_VB);
    const imgUrl = 'https://i.ibb.co/k2hnMfCc/Whats-App-Image-2024-08-22-at-12-07-38-AM.jpg';

    if (printOption === 'print') {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [75, 284] });
      QRCode.toDataURL('https://www.facebook.com/profile.php?id=100055385846115', { width: 100, height: 100 }, (err, qrUrl) => {
        if (!err) {
          doc.addImage(imgUrl, 'JPEG', 10, 10, 50, 50);
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
      QRCode.toDataURL('https://www.facebook.com/profile.php?id=100055385846115', { width: 100, height: 100 }, (err, qrUrl) => {
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
  };

  const renderVentaRow = (venta) => (
    <React.Fragment key={venta.id}>
      <tr onClick={(e) => handleRowClick(e, venta)} className='tr-tabla-venta'>
        <td className="font-bold text-center">
          <div>{venta.serieNum}</div>
          <div className="text-gray-500">{venta.num}</div>
        </td>
        <td className="text-center">
          <span className={`px-4 py-2 rounded-full ${getTipoComprobanteClass(venta.tipoComprobante)} text-white`}>
            {venta.tipoComprobante}
          </span>
        </td>
        <td className="font-bold whitespace-normal">
          <div className='whitespace-normal'>{venta.cliente}</div>
          <div className="text-gray-500 whitespace-normal">{venta.ruc}</div>
        </td>
        <td className="text-center">{venta.fechaEmision}</td>
        <td className="text-center">{venta.igv}</td>
        <td className="text-center">{venta.total}</td>
        <td className="font-bold">
          <div className="whitespace-normal">{venta.cajero}</div>
          <div className="text-gray-500 whitespace-normal">{venta.cajeroId}</div>
        </td>
        <td className="text-center" style={{ color: getEstadoColor(venta.estado), fontWeight: "400" }}>
          <div className='ml-2 px-2.5 py-1.5 rounded-full' style={{ background: getEstadoBackground(venta.estado) }}>
            <span>{venta.estado}</span>
          </div>
        </td>
        <td>
          <div className='flex justify-content-center'>
            <IoMdOptions
              className={`ml-2 ml-5 mr-4 cursor-pointer ${venta.estado === 'Anulada' ? 'text-gray-300' : 'text-gray-500'} ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ fontSize: '20px' }}
              onClick={() => openModal(venta.id, venta.estado)}
            />
            <TiPrinter className='text-gray-500' onClick={onOpen} style={{ fontSize: '20px' }} />
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
        </td>
      </tr>
      {expandedRow === venta.id && renderVentaDetails(venta.detalles)}
    </React.Fragment>
  );

  const renderVentaDetails = (detalles) => (
    <tr className="bg-gray-100">
      <td colSpan="9">
        <div className="container-table-details px-4">
          <table className="table-details w-full">
            <thead>
              <tr>
                <th className="w-1/12 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">CÓDIGO</th>
                <th className="w-1/3 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">NOMBRE</th>
                <th className="w-1/12 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">CANTIDAD</th>
                <th className="w-1/12 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">PRECIO</th>
                <th className="w-1/12 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">DESCUENTO</th>
                <th className="w-1/12 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((detalle, index) => (
                <tr key={index}>
                  <td className="font-bold text-center">{detalle.codigo}</td>
                  <td className="font-bold">{detalle.nombre}</td>
                  <td className="text-center">{detalle.cantidad}</td>
                  <td>{detalle.precio}</td>
                  <td>{detalle.descuento}</td>
                  <td>{detalle.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
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
    <div className="container-table-venta px-4 bg-white rounded-lg shadow-md">
      <table className="table w-full">
        <thead>
          <tr>
            <th className="w-1/8 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">SERIE/NUM</th>
            <th className="w-1/6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TIPO.COMP</th>
            <th className="w-1/6 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">CLIENTE</th>
            <th className="w-1/6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">F. EMISIÓN</th>
            <th className="w-1/8 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">IGV</th>
            <th className="w-1/6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TOTAL</th>
            <th className="w-1/4 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">CAJERO</th>
            <th className="w-1/4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="W-1/6 tracking-wider"></th>
          </tr>
        </thead>
        <tbody>
          {ventas.map(renderVentaRow)}
        </tbody>
      </table>
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