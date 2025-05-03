import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BsCashCoin, BsCash } from "react-icons/bs";
import { IoCloseSharp, IoPersonAddSharp } from 'react-icons/io5';
import { GrFormAdd } from "react-icons/gr";
import InputField from '../Inputs/PagarInputs';
import SelectField from '../Inputs/PagarSelectField';
import VentaExitosaModal from './VentaExitosaModal';
import useClientesData from '../../../Data/data_cliente_venta';
import { validateDecimalInput, handleCobrar } from '../../../Data/add_venta';
import { handleGuardarCliente } from '../../../Data/add_cliente';
import { GrValidate } from "react-icons/gr";
import useProductosData from '../../../Data/data_producto_venta';
{/* Import para el voucher sin preview */ }
import { generateReceiptContent } from '../Comprobantes/Voucher/Voucher';
//import tormentaImg from '../../../../../assets/tormenta.png';
{/* Import para el voucher con preview */ }
// import Voucher from '../Comprobantes/Voucher/VoucherPreview';
// import { useReactToPrint } from 'react-to-print';
import generateComprobanteNumber from '../../../Data/generate_comprobante';
import {Autocomplete, AutocompleteItem} from "@heroui/autocomplete";
import {Textarea} from "@heroui/input";
import {Select, SelectItem} from "@heroui/select";
import {Button, Checkbox} from "@heroui/react";
//
import {ScrollShadow} from "@heroui/scroll-shadow";
import {Input} from "@heroui/input";
import {Toaster} from "react-hot-toast";
import {toast} from "react-hot-toast";
import useSucursalData from '../../../Data/data_sucursal_venta';
import QRCode from 'qrcode';
import { useLastData } from '../../../Data/getLastVenta';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import PagoDetalles from './PagoDetalles';
import PagoFaltante from './PagoFaltante';
import PagoFaltante2 from './PagoFaltante_2';
import AgregarClienteForm from './AgregarClienteForm';
import useCobrarModalState from './useCobrarModalState';
/*import { handleSunatMultiple } from "../../../Data/add_sunat_multiple";
import {  handleUpdate } from '../../../Data/update_venta';*/

const CobrarModal = ({ isOpen, onClose, totalImporte,total_I }) => {
  const {
    productos,
    sucursales,
    last,
    clientes,
    addCliente,
    montoRecibido,
    setMontoRecibido,
    observacion,
    setObservacion,
    descuentoActivado,
    setDescuentoActivado,
    montoDescuento,
    setMontoDescuento,
    montoRecibido2,
    setMontoRecibido2,
    comprobante_pago,
    setcomprobante_pago,
    metodo_pago,
    setmetodo_pago,
    metodo_pago2,
    setmetodo_pago2,
    montoRecibido3,
    setMontoRecibido3,
    metodo_pago3,
    setmetodo_pago3,
    showConfirmacion,
    setShowConfirmacion,
    showNuevoCliente,
    setShowNuevoCliente,
    tipo_cliente,
    settipo_cliente,
    serie,
    SetSerie,
    nu,
    SetNum,
    clienteSeleccionado,
    setClienteSeleccionado,
    dniOrRuc,
    setDni,
    nombreCliente,
    setNombreCliente,
    direccionCliente,
    setDireccionCliente,
    detalles,
    options,
    disabledKeys1,
    disabledKeys2,
    disabledKeys3,
  } = useCobrarModalState();
  
    {/* Este handlePrint es para el voucher con preview */ }
    // const VoucherRef = useRef();

    // const handlePrint = useReactToPrint({
    //     content: () => VoucherRef.current,
    // });

    {/* Fin del handlePrint del voucher con preview */ }

    if (!isOpen) return null;

    const totalAPagarConDescuento = descuentoActivado ? totalImporte - montoDescuento : totalImporte;
    const igv_total = parseFloat(total_I* 0.18).toFixed(2);
    const cambio = parseFloat(montoRecibido) - totalAPagarConDescuento;
    const faltante = Math.max(totalAPagarConDescuento - parseFloat(montoRecibido), 0);
    const cambio2 = parseFloat(montoRecibido2) - faltante;
    const faltante2 = Math.max(faltante - parseFloat(montoRecibido2), 0);
    const cambio3 = parseFloat(montoRecibido3) - faltante2;
    const faltante3 = Math.max(faltante2 - parseFloat(montoRecibido3), 0);
    const sucursal_v = sucursales.find(sucursal => sucursal.usuario === localStorage.getItem('usuario'))
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const localDate = today.toISOString().slice(0, 10);
    const cliente = clientes.find(cliente => cliente.nombre === clienteSeleccionado);

    const datosVenta = {
        usuario: localStorage.getItem('usuario'),
        id_comprobante: comprobante_pago,
        id_cliente: clienteSeleccionado,
        estado_venta: 2,
        sucursal: sucursal_v.nombre,
        direccion: sucursal_v.ubicacion,
        f_venta: localDate,
        igv: igv_total,
        detalles: detalles.map(detalle => ({
            id_producto: detalle.codigo,
            cantidad: detalle.cantidad,
            precio: parseFloat(detalle.precio),
            descuento: parseFloat(detalle.descuento),
            total: parseFloat(detalle.subtotal.replace(/[^0-9.-]+/g, '')),
        })),
        fecha_iso: new Date(),
        metodo_pago: metodo_pago + ':' + (metodo_pago === 'EFECTIVO' ? montoRecibido - cambio : montoRecibido ) +
        (faltante > 0 ? ", " + ((metodo_pago2 + ':' + montoRecibido2) || '') : '') +
        (faltante2 > 0 ? ", " + ((metodo_pago3 + ':' + montoRecibido3) || '') : ''),
        fecha: new Date().toISOString().slice(0, 10),
        nombre_cliente: cliente ? cliente.nombre : '',
        documento_cliente: cliente ? cliente.documento : '',
        direccion_cliente: cliente ? cliente.direccion : '',
        igv_b: detalles.reduce((acc, detalle) => {
            const precioSinIGV = parseFloat(detalle.precio) / 1.18;
            const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad; // Calcular el IGV del detalle
            return acc + igvDetalle;
          }, 0).toFixed(2),
        total_t: totalAPagarConDescuento,
        comprobante_pago: comprobante_pago === 'Boleta' ? 'Boleta de venta electronica' :
            comprobante_pago === 'Factura' ? 'Factura de venta electronica' :
                'Nota de venta',
                totalImporte_venta: detalles.reduce((acc, detalle) => {
                    const precioSinIGV = parseFloat(detalle.precio) / 1.18; // Dividir el precio por 1.18 para obtener el valor sin IGV
                    return acc + (precioSinIGV * detalle.cantidad);
                  }, 0).toFixed(2),
        descuento_venta: detalles.reduce((acc, detalle) => acc + (parseFloat(detalle.precio) * parseFloat(detalle.descuento) / 100) * detalle.cantidad, 0).toFixed(2),
        vuelto: (
            (cambio >= 0 ? Number(cambio) : 0) +
            (faltante > 0 && cambio2 >= 0 ? Number(cambio2) : 0) +
            (faltante2 > 0 && cambio3 >= 0 ? Number(cambio3) : 0)
          ).toFixed(2),
        recibido: ((Number(montoRecibido) || 0) +
            (faltante > 0 ? (Number(montoRecibido2) || 0) : 0) +
            (faltante2 > 0 ? (Number(montoRecibido3) || 0) : 0)).toFixed(2),
        formadepago: metodo_pago +
            (faltante > 0 ? ", " + (metodo_pago2 || '') : '') +
            (faltante2 > 0 ? ", " + (metodo_pago3 || '') : '')
        ,
        detalles_b: detalles.map(detalle => {
            const producto = productos.find(producto => producto.codigo === detalle.codigo);
            return {
                id_producto: detalle.codigo,
                nombre: detalle.nombre,
                undm: producto ? producto.undm : '',
                nom_marca: producto ? producto.nom_marca : '',
                cantidad: detalle.cantidad,
                precio: parseFloat(detalle.precio),
                descuento: parseFloat(detalle.descuento),
                sub_total: parseFloat(detalle.subtotal.replace(/[^0-9.-]+/g, '')),
            };
        }).filter(detalle => detalle !== null),
        observacion:observacion,
    };

    const datosVenta_1 = {
        tipoComprobante: comprobante_pago,
        serieNum: serie,
        num: nu,
        ruc: cliente ? cliente.documento : '',
        fecha_iso: new Date(),
        cliente: cliente ? cliente.nombre : '',
        detalles: detalles.map(detalle => {
            const producto = productos.find(producto => producto.codigo === detalle.codigo);
            return {
                codigo: detalle.codigo,
                nombre: detalle.nombre,
                undm: producto ? producto.undm : '',
                nom_marca: producto ? producto.nom_marca : '',
                cantidad: detalle.cantidad,
                precio: parseFloat(detalle.precio),
                descuento: parseFloat(detalle.descuento),
                sub_total: parseFloat(detalle.subtotal.replace(/[^0-9.-]+/g, '')),
            };
        }).filter(detalle => detalle !== null)
    };

    const datosCliente = {
        dniOrRuc: dniOrRuc,
        tipo_cliente: tipo_cliente,
        nombreCompleto: nombreCliente,
        direccion: direccionCliente,
    };

    const ven = {
        id: last.length > 0 ? last[0].id : ''
    };

    const datosCliente_P = {
        id: '',
        nombre: nombreCliente,
    };

    const saveDetallesToLocalStorage = () => {
        localStorage.setItem('comprobante', JSON.stringify({ comprobante_pago }));
        localStorage.setItem('cliente_d', JSON.stringify({ clienteSeleccionado }));
        localStorage.setItem('observacion', JSON.stringify({observacion}));
        localStorage.setItem('last', JSON.stringify(ven)); 
        localStorage.setItem('vent', JSON.stringify([datosVenta_1]));
    };

    saveDetallesToLocalStorage();

    const handleSubmit = (e) => {
        e.preventDefault();
    
        let errorMessage = '';
    
        // Consolidar validaciones en un solo mensaje
        if (montoRecibido === '' || montoRecibido < totalImporte || metodo_pago === '') {
            errorMessage += 'Ingrese una cantidad que cubra el total requerido o seleccione un ítem faltante. ';
        }

        if (faltante > 0){
            if (faltante2 ==="" || faltante2 === null || faltante2 === undefined){
                if (montoRecibido2 === ''|| montoRecibido2 < faltante ||  metodo_pago2 === '') {
                    errorMessage += 'Ingrese una cantidad para el segundo monto o seleccione un ítem faltante. ';
                }
            } else {
                if (montoRecibido2 === '' || metodo_pago2 === '') {
                    errorMessage += 'Ingrese una cantidad para el segundo monto o seleccione un ítem faltante. ';
                }
            }
        }
        
        if (faltante2>0){
            if (montoRecibido3 === '' || montoRecibido3 < faltante2 && faltante2 > 0 || metodo_pago3 === '') {
                errorMessage += 'Ingrese una cantidad para el tercer monto o seleccione un ítem faltante. ';
            }            
        }

    
        if (errorMessage) {
            toast.error(errorMessage.trim());
            return; // Detiene la ejecución si hay un mensaje de error
        }
    
        // Si todas las validaciones pasan, procede con el manejo del cobro e impresión
        handlePrint();  // Llama a la función de impresión
        handleCobrar(datosVenta, setShowConfirmacion,datosVenta_1,ven);
        /*handleSunatMultiple([datosVenta_1]);
        handleUpdate(ven);*/
    };

    {/* Esto son los datos que pasan al voucher */ }
    const datosVentaComprobante = {

        fecha: new Date().toISOString().slice(0, 10),
        nombre_cliente: cliente ? cliente.nombre : '',
        documento_cliente: cliente ? cliente.documento : '',
        direccion_cliente: cliente ? cliente.direccion : '',
        igv: detalles.reduce((acc, detalle) => {
            const precioSinIGV = parseFloat(detalle.precio) / 1.18;
            const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad; // Calcular el IGV del detalle
            return acc + igvDetalle;
          }, 0).toFixed(2),
        total_t: totalAPagarConDescuento,
        comprobante_pago: comprobante_pago === 'Boleta' ? 'Boleta de venta electronica' :
            comprobante_pago === 'Factura' ? 'Factura de venta electronica' :
                'Nota de venta',
                totalImporte_venta: detalles.reduce((acc, detalle) => {
                    const precioSinIGV = parseFloat(detalle.precio) / 1.18; // Dividir el precio por 1.18 para obtener el valor sin IGV
                    return acc + (precioSinIGV * detalle.cantidad);
                  }, 0).toFixed(2),
        descuento_venta: detalles.reduce((acc, detalle) => acc + (parseFloat(detalle.precio) * parseFloat(detalle.descuento) / 100) * detalle.cantidad, 0).toFixed(2),
        vuelto: (
            (cambio >= 0 ? Number(cambio) : 0) +
            (faltante > 0 && cambio2 >= 0 ? Number(cambio2) : 0) +
            (faltante2 > 0 && cambio3 >= 0 ? Number(cambio3) : 0)
          ).toFixed(2),
        recibido: ((Number(montoRecibido) || 0) +
            (faltante > 0 ? (Number(montoRecibido2) || 0) : 0) +
            (faltante2 > 0 ? (Number(montoRecibido3) || 0) : 0)).toFixed(2),
        formadepago: metodo_pago +
            (faltante > 0 ? ", " + (metodo_pago2 || '') : '') +
            (faltante2 > 0 ? ", " + (metodo_pago3 || '') : '')
        ,
        detalles: detalles.map(detalle => {
            const producto = productos.find(producto => producto.codigo === detalle.codigo);
            return {
                id_producto: detalle.codigo,
                nombre: detalle.nombre,
                undm: producto ? producto.undm : '',
                nom_marca: producto ? producto.nom_marca : '',
                cantidad: detalle.cantidad,
                precio: parseFloat(detalle.precio),
                descuento: parseFloat(detalle.descuento),
                sub_total: parseFloat(detalle.subtotal.replace(/[^0-9.-]+/g, '')),
            };
        }).filter(detalle => detalle !== null),
    };

    //console.log(datosVentaComprobante);
    {/* Fin de los datos que pasan al voucher */ }

    {/* Este handlePrint es para el voucher automatico */ }

    const handlePrint = async () => {
        let nombreImpresora = "BASIC 230 STYLE";
        let api_key = "90f5550c-f913-4a28-8c70-2790ade1c3ac";
    
        // eslint-disable-next-line no-undef
        const conector = new connetor_plugin();
        const content = generateReceiptContent(datosVentaComprobante, datosVenta);
    
        conector.textaling("center");
    
        // Verifica si las opciones de tamaño están en el formato correcto
        const imgOptions = { width: 50, height: 50 };
        const qrOptions = { width: 300, height: 300 };

        const empresaData = await getEmpresaDataByUser();
        const logotipo = empresaData.logotipo; // Obtener el logotipo de la empresa
    
        conector.img_url(logotipo , imgOptions);
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
       
           //const content = generateReceiptContent(datosVentaComprobante, datosVenta);
           //const imgUrl = 'https://i.postimg.cc/mDJwxYpT/Whats-App-Image-2024-08-22-at-12-07-38-AM.jpg';

           //const printWindow = window.open('', '', 'height=600,width=800');
           // Generar QR dinámicamente
          // QRCode.toDataURL('https://www.facebook.com/profile.php?id=100055385846115', { width: 100, height: 100 }, function (err, qrUrl) {
           //  if (!err) {
              // printWindow.document.write(`
               //  <html>
              //     <head>
              //       <title>Recibo</title>
              //       <style>
               //        @page {
                //         size: 72mm 297mm; /* Tamaño de papel en milímetros */
                //         margin: 10px; /* Ajusta los márgenes según sea necesario */
               //        }
               //        body {
                //         margin: 0;
                 //        padding: 0;
                  //       font-family: Courier, monospace; /* Cambiar la fuente a Courier */
                   //      font-size: 10pt; /* Reducir el tamaño de la fuente */
                   //      width: 100%; /* Asegurar que el contenido utilice todo el ancho disponible */
                  //     }
                  //     pre {
                    //     margin: 0;
                   //      font-size: 10pt; /* Asegurar que el texto del preformateado sea más pequeño */
                  //       white-space: pre-wrap; /* Permitir el ajuste del texto en lugar de cortar palabras */
                  //     }
                  //     .center {
                  //       text-align: center;
                  //     }
                  //     .qr {
                  //       display: block;
                  //       margin: 10px auto;
                   //    }
                   //    .image-container {
                   //      display: flex;
                   //      justify-content: center;
                  //     }
                 //    </style>
                 //  </head>
               //    <body>
               //      <div class="image-container">
             //          <img src="${imgUrl}" alt="Logo" style="width: 140px; height: 140px;" /> <!-- Ajustar tamaño de la imagen -->
             //        </div>
             //        <pre>${content}</pre>
              //       <div class="image-container">
             //         <img src="${qrUrl}" alt="QR Code" class="qr" style="width: 80px; height: 80px;" /> <!-- Ajustar tamaño del QR -->
            //         </div>
            //       </body>
          //       </html>
        //       `);
           
             //  printWindow.document.close();
          //     printWindow.focus();
            //   printWindow.print(); // Abre el diálogo de impresión
           //  } else {
           //    console.error('Error generando el código QR:', err);
            // }
          // });
    };

    {/* Fin del handlePrint del voucher automatico */ }


    const handleGuardarClientes = (e) => {
        e.preventDefault();
        handleGuardarCliente(datosCliente, setShowNuevoCliente);
        addCliente(datosCliente_P);
    };

    const token_cliente = import.meta.env.VITE_TOKEN_PROOVEDOR || '';

    const handleValidate = async () => {
        if (dniOrRuc != '') {
            const url =
                tipo_cliente === 'Natural'
                    ? `https://dniruc.apisperu.com/api/v1/dni/${dniOrRuc}?token=${token_cliente}`
                    : `https://dniruc.apisperu.com/api/v1/ruc/${dniOrRuc}?token=${token_cliente}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (tipo_cliente === 'Natural') {
                    setNombreCliente(`${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`);
                    setDireccionCliente('');
                } else {
                    if (data.razonSocial) {
                        setNombreCliente(data.razonSocial);// Asumiendo que la API devuelve un array de telefonos
                        setDireccionCliente(data.direccion || ''); // Asumiendo que la API devuelve "direccion"
                    } else {
                        alert('No se encontraron datos para el RUC proporcionado');
                    }
                }
            } catch (error) {
                console.error('Error al validar el DNI/RUC:', error);
                alert('Hubo un error al validar el DNI/RUC');
            }
        } else if (dniOrRuc === '') {
            setNombreCliente('');// Asumiendo que la API devuelve un array de telefonos
            setDireccionCliente(''); // Asumiendo que la API devuelve "direccion"
        }
    };

  // Maneja el cambio de valor del input
  const handleInputChange = (e) => {
    setClienteSeleccionado(e.target.value); // Actualiza el estado con el valor del input
  };

  // Maneja la selección de un elemento de la lista
  const handleSelectionChange = (value) => {
    setClienteSeleccionado(value);
    if (value){
        setClienteSeleccionado(value);
    } else {
        setClienteSeleccionado('Cliente Varios');
    } //Actualiza el estado con el valor seleccionado
  };
    

  return (
    <>
          <Toaster />
          <div className="modal-container fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
  <div 
    className={`modal-pagar px-6 py-7 rounded-xl shadow-lg relative transition-all duration-300 flex flex-col 
      ${showNuevoCliente ? 'sm:w-[90%] md:w-[70%] lg:w-[50%]' : 'sm:w-[90%] md:w-[45%] lg:w-[30%]'}`} 
    style={{ 
      maxHeight: '90vh', 
      overflowY: 'auto', 
      backgroundColor: 'white',  
      margin: '0 auto'
    }}
  >
    <ScrollShadow hideScrollBar className="w-full h-full"       offset={100}
      orientation="horizontal">
<div className="flex w-full h-full justify-center items-center m-0 p-0 box-border overflow-x-hidden">
                
                <form className='div-pagar-1'>
                    <div className="flex justify-between items-center mb-4">
                    <Button 
                    onClick={onClose} 
                    color="#C20E4D" 
                    variant="shadow" 
                    className="close-modal-pagar absolute top-0 right-0 text-black-500"
                    style={{
                        width: "2rem", // Ajuste para un tamaño más pequeño
                        height: "2rem", // Mantén un tamaño pequeño y cuadrado
                        padding: "0.25rem", // Padding reducido
                        borderRadius: "0.25rem", // Ligero redondeo en las esquinas
                        minWidth: "auto", // Elimina el ancho mínimo
                        gap: "0", // Elimina el espacio entre elementos
                    }}
                    >
                    <IoCloseSharp style={{ fontSize: "1rem" }} /> {/* Ícono reducido */}
                    </Button>
                        <h2 className="text-lg font-bold flex items-center">
                            <BsCash className="mr-2" style={{ fontSize: '25px' }} />
                            Pago
                        </h2>
                    </div>
                    <div className="mb-4">
                        {/* Contenedor para cliente y comprobante */}
                        <div className="flex items-start">
                            {/* Selección de cliente */}
                            <div className="mr-4">
                            <label className="block text-gray-800 mb-2 font-semibold">
                                Seleccione el cliente
                            </label>
                            <div className="flex items-center">
                                <Autocomplete
                                isRequired
                                className="input-c mr-1 autocomplete-no-border"
                                placeholder="Seleccionar cliente"
                                style={{ width: '6rem',border: "none", // Sin !important
                                    boxShadow: "none", // Sin !important
                                    outline: "none", }}
                                value={clienteSeleccionado}
                                onChange={handleInputChange}
                                onSelectionChange={handleSelectionChange}
                                >
                                {clientes.map((cliente) => (
                                    <AutocompleteItem key={cliente.nombre} value={cliente.nombre}>
                                    {cliente.nombre}
                                    </AutocompleteItem>
                                ))}
                                </Autocomplete>
                                <button
                                type="button"
                                className="btn-nuevo-cliente px-1 py-1"
                                onClick={() => setShowNuevoCliente(true)}
                                >
                                <GrFormAdd style={{ fontSize: '24px' }} />
                                </button>
                            </div>
                            </div>

                            {/* Selección de comprobante */}
                            <div>
                            <label className="block text-gray-800 mb-2 font-semibold">
                                Select. el comprobante
                            </label>
                                      <Select
                                      isRequired
    placeholder="Comprob. de pago" 
    className={"input-c mt-2"}
    style={{ width: '12rem' }}
    value={comprobante_pago}
    onChange={(e) => setcomprobante_pago(e.target.value)}
  >
    (
      <SelectItem key={'Boleta'} value={'Boleta'}>{'Boleta'}</SelectItem>
      <SelectItem key={'Factura'} value={'Factura'}>{'Factura'}</SelectItem>
      <SelectItem key={'Nota de venta'} value={'Nota de venta'}>{'Nota de venta'}</SelectItem>
    )
  </Select>
                            </div>
                        </div>

                        {/* Textarea debajo de cliente y comprobante */}
                        <div className="mt-4">
                            <Textarea
                            label="Descripción"
                            placeholder="Ingrese la descripción"
                            className="w-full max-w-md"
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            style={{
                                border: "none", // Sin !important
                                boxShadow: "none", // Sin !important
                                outline: "none", // Sin !important
                              }}
                            />
                        </div>
                        </div>
                    <hr className="mb-5" />
           
            {/* Otros componentes */}
            <PagoDetalles
              totalImporte={totalImporte}
              metodo_pago={metodo_pago}
              setmetodo_pago={setmetodo_pago}
              disabledKeys1={disabledKeys1}
              options={options}
              montoRecibido={montoRecibido}
              setMontoRecibido={setMontoRecibido}
              validateDecimalInput={validateDecimalInput}
              descuentoActivado={descuentoActivado}
              setDescuentoActivado={setDescuentoActivado}
              montoDescuento={montoDescuento}
              setMontoDescuento={setMontoDescuento}
              cambio={cambio}
              faltante={faltante}
            />
                    <hr className="mb-5" />
                    {faltante > 0 && comprobante_pago !='Nota de venta' && (
              <PagoFaltante
              faltante={faltante}
              montoRecibido2={montoRecibido2}
              setMontoRecibido2={setMontoRecibido2}
              validateDecimalInput={validateDecimalInput}
              metodo_pago2={metodo_pago2}
              setmetodo_pago2={setmetodo_pago2}
              disabledKeys2={disabledKeys2}
              options={options}
              cambio2={cambio2}
              faltante2={faltante2}
            />
                    )}
                        {faltante2 > 0 && (
                                          <PagoFaltante
                                          faltante={faltante2}
                                          montoRecibido2={montoRecibido3}
                                          setMontoRecibido2={setMontoRecibido3}
                                          validateDecimalInput={validateDecimalInput}
                                          metodo_pago2={metodo_pago3}
                                          setmetodo_pago2={setmetodo_pago3}
                                          disabledKeys2={disabledKeys3}
                                          options={options}
                                          cambio2={cambio3}
                                          faltante2={faltante3}
                                        />
                        )}

                        {/* Este div es solo para el voucher con preview */}
                        {/* <div style={{ display: 'none' }}>
                            <Voucher ref={VoucherRef} />
                        </div> */}
                        {/* Fin del div para el voucher con preview */}

                        <div className="flex justify-end mt-4">
                            <Button type="submit" className="btn btn-cobrar mr-0" onClick={handleSubmit}>
                                <BsCashCoin className="mr-2" />
                                Cobrar e Imprimir
                            </Button>
                        </div>
                        <VentaExitosaModal isOpen={showConfirmacion} onClose={() => setShowConfirmacion(false)} />
                        {showConfirmacion && <VentaExitosaModal onClose={() => setShowConfirmacion(false)} />}

                    </form>
                    {showNuevoCliente && (
                <AgregarClienteForm
                tipo_cliente={tipo_cliente}
                settipo_cliente={settipo_cliente}
                dniOrRuc={dniOrRuc}
                setDni={setDni}
                nombreCliente={nombreCliente}
                direccionCliente={direccionCliente}
                handleValidate={handleValidate}
                handleGuardarClientes={handleGuardarClientes}
                setShowNuevoCliente={setShowNuevoCliente}
              />
                    )}
                
                </div>

                </ScrollShadow>
            </div>
            
        </div>
        </>
    );
};

CobrarModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    totalImporte: PropTypes.number.isRequired,
    total_I: PropTypes.number.isRequired,
};

export default CobrarModal;
