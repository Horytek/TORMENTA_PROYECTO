import React, { useState, /*useEffect*/ } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from "react-icons/io";
import { TiPrinter } from "react-icons/ti";
import { generateReceiptContent } from '../../../Ventas/Registro_Venta/ComponentsRegistroVentas/Comprobantes/Voucher/Voucher';
import useBoucher from '../../Data/data_boucher'; // Asegúrate de que la ruta sea correcta
//import useSucursalData from '../../Data/data_sucursal_venta';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure,RadioGroup, Radio } from "@nextui-org/react";


const TablaVentas = ({ ventas, modalOpen, deleteOptionSelected, openModal }) => {
  const [expandedRow, setExpandedRow] = useState(null);
  //const {sucursales} = useSucursalData();
  const [printOption, setPrintOption] = useState(''); 
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const toggleRow = (id,estado,venta) => {
    setExpandedRow(expandedRow === id ? null : id);

    if (estado=='En proceso') {
      estado= 2;
    } else if (estado=='Aceptada') {
      estado= 1;
    } else if (estado=='Anulada') {
      estado= 0;
    }

    const datos_venta = {
      id:id,
      serieNum:venta.serieNum,
      num:venta.num,
      tipoComprobante:venta.tipoComprobante,
      estado:estado,
      igv:venta.igv,
      nombre: venta.cliente,
      documento: venta.ruc,
      fechaEmision:venta.fecha_iso,
      id_anular:venta.id_anular,
      id_anular_b:venta.id_anular_b,
      estado_sunat:venta.estado_sunat,
      anular:venta.anular,
      anular_b:venta.anular_b,
      id_venta_boucher:venta.id_venta_boucher,
      sucursal:venta.nombre_sucursal,
      direccion:venta.ubicacion,
      usua_vendedor:venta.usua_vendedor,
      observacion:venta.observacion || '',
    }

    localStorage.setItem('ventas', JSON.stringify(datos_venta));
    localStorage.setItem('boucher', JSON.stringify(datos_venta.id_venta_boucher));
    const saveDetallesToLocalStorage = () => {
      localStorage.setItem('new_detalle', JSON.stringify(venta.detalles));
    };
  
    saveDetallesToLocalStorage();

    const datosClientes = {
      nombre: venta.cliente,
      documento: venta.ruc,
    };

    const surB = {
      sucursal:venta.nombre_sucursal,
      direccion:venta.ubicacion,
    };

    const saveDetallesToLocalStorage1 = () => {
        localStorage.setItem('datosClientes', JSON.stringify({datosClientes}));
        localStorage.setItem('surB', JSON.stringify({surB }));
      };
      saveDetallesToLocalStorage1();
    };

    const handleRowClick = (e, venta) => {
      // Verificar si el clic no fue en un icono
      if (e.target.closest('.ignore-toggle')) {
        return;
      }
      toggleRow(venta.id, venta.estado, venta);
    };

    const loadDetallesFromLocalStorage = () => {
      const savedDetalles = localStorage.getItem('ventas');
      return savedDetalles ? JSON.parse(savedDetalles) : [];
  };

  const ventas_VB = loadDetallesFromLocalStorage();



  //console.log(ventas_VB);
  

  const {venta_B} = useBoucher(ventas_VB.id_venta_boucher);
  //const isoDate = venta_B.fecha.toISOString().slice(0, 10);
  const nuevoNumComprobante = { nuevoNumComprobante: venta_B.num_comprobante }
  localStorage.setItem('comprobante1', JSON.stringify(nuevoNumComprobante));
  const observacion = { observacion: ventas_VB.observacion}
  localStorage.setItem('observacion', JSON.stringify(observacion));
  //console.log(venta_B);
  //console.log(new Date(venta_B.fecha).toISOString().slice(0, 10));
  //const sucursal_v = sucursales.find(sucursal => sucursal.usuario === ventas_VB.usua_vendedor)
  //console.log(sucursal_v);
  //console.log(surB);

  
  const handlePrint = async () => {
    if (printOption === 'print-1') {
      let nombreImpresora = "BASIC 230 STYLE";
      let api_key = "90f5550c-f913-4a28-8c70-2790ade1c3ac";
  
      // eslint-disable-next-line no-undef
      const conector = new connetor_plugin();
      const content = generateReceiptContent(venta_B, ventas_VB);
  
      conector.textaling("center");
  
      // Verifica si las opciones de tamaño están en el formato correcto
      const imgOptions = { width: 50, height: 50 };
      const qrOptions = { width: 300, height: 300 };
  
      conector.img_url("https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png", imgOptions);
      content.split('\n').forEach(line => {
          conector.text(line);
      });
  
      conector.qr("https://www.facebook.com/profile.php?id=100055385846115", qrOptions);
      conector.feed(5);
      conector.cut("0");
  
      const resp = await conector.imprimir(nombreImpresora, api_key);
      if (resp === true) {
          console.log("Impresión exitosa");
      } else {
          console.log("Problema al imprimir: " + resp);
      }
    } else if (printOption === 'print') {
      const content = generateReceiptContent(venta_B, ventas_VB);
      const printWindow = window.open('', '', 'height=600,width=800');
    
  printWindow.document.write(`
    <html>
      <head>
        <title>Recibo</title>
        <style>
          @page {
            size: 72mm 297mm; /* Tamaño de papel en milímetros */
            margin: 20; /* Ajusta los márgenes según sea necesario */
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 12pt;
          }
          pre {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <pre>${content}</pre>
      </body>
    </html>
  `);
    
      printWindow.document.close();
      printWindow.focus();
      printWindow.print(); // Abre el diálogo de impresión
    }
};

  /* const datosVenta= {
    sucursal: sucursal_v.nombre,
    direccion: sucursal_v.ubicacion,
  }*/

  /*const handlePrint = async () => {
    let nombreImpresora = "BASIC 230 STYLE";
    let api_key = "90f5550c-f913-4a28-8c70-2790ade1c3ac";

    // eslint-disable-next-line no-undef
    const conector = new connetor_plugin();
    const content = generateReceiptContent(venta_B, datosVenta);

    conector.textaling("center");

    // Verifica si las opciones de tamaño están en el formato correcto
    const imgOptions = { width: 50, height: 50 };
    const qrOptions = { width: 300, height: 300 };

    conector.img_url("https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png", imgOptions);
    content.split('\n').forEach(line => {
        conector.text(line);
    });

    conector.qr("https://www.facebook.com/profile.php?id=100055385846115", qrOptions);
    conector.feed(5);
    conector.cut("0");

    const resp = await conector.imprimir(nombreImpresora, api_key);
    if (resp === true) {
        console.log("Impresión exitosa");
    } else {
        console.log("Problema al imprimir: " + resp);
    }
};*/

/*
const handlePrint1 = () => {
  const content = generateReceiptContent(venta_B, ventas_VB);
  const printWindow = window.open('', '', 'height=600,width=800');

  printWindow.document.write('<html><head><title>Recibo</title>');
  printWindow.document.write('</head><body >');
  printWindow.document.write(`<pre>${content}</pre>`);
  printWindow.document.write('</body></html>');

  printWindow.document.close();
  printWindow.focus();
  printWindow.print(); // Abre el diálogo de impresión
};
*/

  const renderVentaRow = (venta) => (
    <React.Fragment key={venta.id}>
      <tr onClick={(e) => handleRowClick(e,venta)} className='tr-tabla-venta'>
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
          <div className="whitespace-normal">
            {venta.cajero}
          </div>
          <div className="text-gray-500 whitespace-normal">
            {venta.cajeroId}
          </div>
        </td>

        <td className="text-center " style={{ color: venta.estado === 'Aceptada' ? '#117B34FF' : venta.estado === 'En proceso' ? '#F5B047' : '#E05858FF', fontWeight: "400" }} >
          <div className='ml-2 px-2.5 py-1.5 rounded-full ' style={{ background: venta.estado === 'Aceptada' ? 'rgb(191, 237, 206)' : venta.estado === 'En proceso' ? '#FDEDD4' : '#F5CBCBFF' }}>
            <span>{venta.estado}</span>
          </div>
        </td>
        <td>
          <div className='flex justify-content-center'>
            <IoMdOptions
                className={`ml-2 ml-5 mr-4 cursor-pointer ${venta.estado === 'Anulada' ? 'text-gray-300' :  'text-gray-500'} ${modalOpen && !deleteOptionSelected ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ fontSize: '20px' }}
                onClick={() => openModal(venta.id, venta.estado)}
            />
            <TiPrinter className='text-gray-500' onClick={onOpen} style={{ fontSize: '20px' }}/>
            <Modal backdrop={"opaque"} isOpen={isOpen} onOpenChange={onOpenChange}
            motionProps={{
              variants: {
                enter: {
                  y: 0,
                  opacity: 1,
                  transition: {
                    duration: 0.2,
                    ease: "easeOut",
                  },
                },
                exit: {
                  y: -20,
                  opacity: 0,
                  transition: {
                    duration: 0.2,
                    ease: "easeIn",
                  },
                },
              }
            }}
            classNames={{
              backdrop: "bg-[#27272A]/10 backdrop-opacity-4"
            }}
       >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Opciones de impresion</ModalHeader>
              <ModalBody>
                <RadioGroup
                  label="Selecciona la opcion para el formato del boucher"
                  value={printOption}
                  onChange={(e) => setPrintOption(e.target.value)}
                >
                  <Radio value="print">Descargar PDF</Radio>
                  <Radio value="print-1">Imprimir boucher de la venta</Radio>
                </RadioGroup>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                <Button color="primary" onPress={onClose} onClick={handlePrint}>
                  Aceptar
                </Button>
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
/*px-6 py-3 w-1/3 text-xs font-bold text-gray-500 uppercase text-center*/
  const renderVentaDetails = (detalles) => (
    <tr className="bg-gray-100">
      <td colSpan="9">
        <div className="container-table-details px-4">
          <table className="table-details w-full">
            <thead>
              <tr>
                <th className="w-1/12 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">CODIGO</th>
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
      case 'Factura':
        return 'bg-orange-500';
      case 'Boleta':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <>
    <div className="container-table-venta px-4 bg-white rounded-lg">
      <table className="table w-full">
        <thead> 
          <tr>
            <th className="w-1/8 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">SERIE/NUM</th>
            <th className="w-1/6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TIPO.COMP</th>
            <th className="w-1/6 text-start text-xs font-bold text-gray-500 uppercase tracking-wider">CLIENTE</th>
            <th className="w-1/6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">F. EMISIÓN</th>
            <th className="w-1/8 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">IGV</th>
            <th className="w-1/6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">TOTAL</th>
            <th className="w-1/4 text-start  text-xs font-bold text-gray-500 uppercase tracking-wider">CAJERO</th>
            <th className="w-1/4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">ESTADO</th>
            <th className="W-1/6 tracking-wider"></th>
          </tr>
        </thead>
        <tbody>
          {ventas.map(renderVentaRow)}
        </tbody>
      </table>
    </div>
    </>
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