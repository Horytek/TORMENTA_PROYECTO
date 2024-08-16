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
import {Autocomplete, AutocompleteItem} from "@nextui-org/autocomplete";
import {Textarea} from "@nextui-org/input";
import {Select, SelectItem} from "@nextui-org/select";
import {Button} from "@nextui-org/react";
import {Toaster} from "react-hot-toast";
import {toast} from "react-hot-toast";
import useSucursalData from '../../../Data/data_sucursal_venta';

const CobrarModal = ({ isOpen, onClose, totalImporte,total_I }) => {
    const { productos } = useProductosData();
    const {sucursales} = useSucursalData();
    const [montoRecibido, setMontoRecibido] = useState('');
    const [observacion,setObservacion] = useState('');
    const [descuentoActivado, setDescuentoActivado] = useState(false);
    const [montoDescuento, setMontoDescuento] = useState(0);
    const [montoRecibido2, setMontoRecibido2] = useState('');
    const [comprobante_pago, setcomprobante_pago] = useState('Boleta');
    const [metodo_pago, setmetodo_pago] = useState('');
    const [metodo_pago2, setmetodo_pago2] = useState('');
    const [montoRecibido3, setMontoRecibido3] = useState('');
    const [metodo_pago3, setmetodo_pago3] = useState('');
    const [showConfirmacion, setShowConfirmacion] = useState(false);
    const [showNuevoCliente, setShowNuevoCliente] = useState(false);
    const [tipo_cliente, settipo_cliente] = useState('Natural');
    const { clientes, addCliente } = useClientesData();
    // Llama al hook personalizado para obtener los clientes
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const loadDetallesFromLocalStorage = () => {
        const savedDetalles = localStorage.getItem('detalles');
        return savedDetalles ? JSON.parse(savedDetalles) : [];
    };
    const detalles = loadDetallesFromLocalStorage();

    const options = [
        { key: 'EFECTIVO', value: 'EFECTIVO', label: 'EFECTIVO' },
        { key: 'PLIN', value: 'PLIN', label: 'PLIN' },
        { key: 'YAPE', value: 'YAPE', label: 'YAPE' },
        { key: 'VISA', value: 'VISA', label: 'VISA' },
        { key: 'AMERICAN EXPRESS', value: 'AMERICAN EXPRESS', label: 'AMERICAN EXPRESS' },
        { key: 'DEPOSITO BBVA', value: 'DEPOSITO BBVA', label: 'DEPOSITO BBVA' },
        { key: 'DEPOSITO BCP', value: 'DEPOSITO BCP', label: 'DEPOSITO BCP' },
        { key: 'DEPOSITO CAJA PIURA', value: 'DEPOSITO CAJA PIURA', label: 'DEPOSITO CAJA PIURA' },
        { key: 'DEPOSITO INTERBANK', value: 'DEPOSITO INTERBANK', label: 'DEPOSITO INTERBANK' },
        { key: 'MASTER CARD', value: 'MASTER CARD', label: 'MASTER CARD' },
      ];
    

  // Obtener las claves de los elementos deshabilitados para cada Select
  const disabledKeys1 = options
    .filter(({ value }) => value === metodo_pago2 || value === metodo_pago3)
    .map(({ key }) => key);

  const disabledKeys2 = options
    .filter(({ value }) => value === metodo_pago || value === metodo_pago3)
    .map(({ key }) => key);

    const disabledKeys3 = options
    .filter(({ value }) => value === metodo_pago || value === metodo_pago2)
    .map(({ key }) => key);
    

    const comprobante_pago1 = JSON.parse(localStorage.getItem('comprobante')) || {};
    const comp = comprobante_pago1.comprobante_pago;
    useEffect(() => {
        const fetchComprobanteNumber = async () => {
            try {
                const comprobante_pago = JSON.parse(localStorage.getItem('comprobante')) || {};
                const comp = comprobante_pago.comprobante_pago;

                // Asegúrate de que comp es válido y está definido
                if (!comp) {
                    console.warn('El valor de comp no es válido:', comp);
                    return;
                }

                const nuevoNumComprobante = await generateComprobanteNumber(comp);

                //console.log('Nuevo número de comprobante:', nuevoNumComprobante);

                // Almacena el número de comprobante en el localStorage
                localStorage.setItem('comprobante1', JSON.stringify({ nuevoNumComprobante }));

                // Verifica si el almacenamiento local se actualizó correctamente
                //console.log('Contenido actualizado de localStorage:', localStorage.getItem('comprobante1'));
            } catch (error) {
                console.error('Error al obtener el número de comprobante:', error);
            }
        };

        fetchComprobanteNumber();
    }, [comp]);

    const [dniOrRuc, setDni] = useState('');
    const [nombreCliente, setNombreCliente] = useState('');
    const [direccionCliente, setDireccionCliente] = useState('');
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
        metodo_pago: metodo_pago + ':' + montoRecibido +
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

    const datosCliente = {
        dniOrRuc: dniOrRuc,
        tipo_cliente: tipo_cliente,
        nombreCompleto: nombreCliente,
        direccion: direccionCliente,
    };

    const datosCliente_P = {
        id: '',
        nombre: nombreCliente,
    };

    const saveDetallesToLocalStorage = () => {
        localStorage.setItem('comprobante', JSON.stringify({ comprobante_pago }));
        localStorage.setItem('cliente_d', JSON.stringify({ clienteSeleccionado }));
        localStorage.setItem('observacion', JSON.stringify({observacion}));
    };

    saveDetallesToLocalStorage();



    const handleSubmit = (e) => {
        e.preventDefault();
    
        let errorMessage = '';
    
        // Consolidar validaciones en un solo mensaje
        if (montoRecibido === '' || montoRecibido < totalImporte || metodo_pago === '') {
            errorMessage += 'Ingrese una cantidad que cubra el total requerido o seleccione un ítem. ';
        }

        if (faltante > 0){
            if (faltante2 ==="" || faltante2 === null || faltante2 === undefined){
                if (montoRecibido2 === ''|| montoRecibido2 < faltante ||  metodo_pago2 === '') {
                    errorMessage += 'Ingrese una cantidad para el segundo monto o seleccione un ítem. ';
                }
            } else {
                if (montoRecibido2 === '' || metodo_pago2 === '') {
                    errorMessage += 'Ingrese una cantidad para el segundo monto o seleccione un ítem. ';
                }
            }
        }
        
        if (faltante2>0){
            if (montoRecibido3 === '' || montoRecibido3 < faltante2 && faltante2 > 0 || metodo_pago3 === '') {
                errorMessage += 'Ingrese una cantidad para el tercer monto o seleccione un ítem. ';
            }            
        }

    
        if (errorMessage) {
            toast.error(errorMessage.trim());
            return; // Detiene la ejecución si hay un mensaje de error
        }
    
        // Si todas las validaciones pasan, procede con el manejo del cobro e impresión
        handleCobrar(datosVenta, setShowConfirmacion);
        handlePrint();  // Llama a la función de impresión
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
    
        conector.img_url("https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png", imgOptions);
        content.split('\n').forEach(line => {
            conector.text(line);
        });
    
        conector.qr("https://www.facebook.com/profile.php?id=100055385846115", qrOptions);
        conector.feed(5);
        conector.cut("0");
    
        const resp = await conector.imprimir(nombreImpresora, api_key);
        if (resp === true) {
            //console.log("Impresión exitosa");
        } else {
           //console.log("Problema al imprimir: " + resp);
        }
    };
    {/* Fin del handlePrint del voucher automatico */ }


    const handleGuardarClientes = (e) => {
        e.preventDefault();
        handleGuardarCliente(datosCliente, setShowNuevoCliente);
        addCliente(datosCliente_P);
    };

    const token_cliente = import.meta.env.VITE_TOKEN_PROVEDOR || '';

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
              <div className="modal-container" style={{ overflowY: 'auto' }} >
            <div className={` modal-pagar px-6 py-7 rounded-xl shadow-lg relative ${showNuevoCliente ? 'expanded' : ''}`} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className='flex '>
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
                        <div className="flex mb-4">
  {/* Total a pagar */}
  <InputField
    label="Total a pagar"
    symbol="S/."
    value={totalImporte}
    readOnly
    style={{
      height: "40px",
      border: "solid 0.2rem #171a1f28",
      backgroundColor: "#f5f5f5",
    }}
    className={"input-c w-40 ml-2 focus:outline-none"}
  />

  {/* Método de pago */}
  <div style={{ marginLeft: "20px" }}> {/* Aumenta el margen izquierdo aquí */}
    <label className="block text-gray-800 mb-2 font-semibold">
      Método de pago
    </label>
    <Select
    isRequired
      placeholder="Método de pago"
      className={"input-c h-10 pr-8"}
      classNamediv={"flex items-center mt-2"}
      value={metodo_pago}
      style={{ width: '13rem' }}
      onChange={(e) => setmetodo_pago(e.target.value)}
      containerStyle={{ marginLeft: "5px" }}
      disabledKeys={disabledKeys1}  // Ajusta el margen aquí si es necesario
    >
            {options.map(({ key, value, label }) => (
          <SelectItem key={key} value={value}>
            {label}
          </SelectItem>
        ))}
    </Select>
  </div>
</div>
                        <div className="flex">
                            <InputField
                                label="Monto recibido"
                                symbol="S/."
                                value={montoRecibido}
                                onChange={(e) => setMontoRecibido(e.target.value)}
                                pattern="[0-9]*[.]?[0-9]{0,2}"
                                onKeyDown={validateDecimalInput}
                                style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                className={"input-c w-40 ml-2"}
                            />
                            <div className='mb-4' style={{ marginLeft: "45px" }}>
                                <label className="text-gray-800 font-semibold">Aplicar descuento</label>
                                <div className='flex items-center h-50' >
                                    <span className='mt-2'>S/.</span>
                                    <input
                                        type="checkbox"
                                        className="ml-1 custom-checkbox relative mt-2"
                                        onChange={(e) => setDescuentoActivado(e.target.checked)}
                                    />
                                    <InputField
                                        className={"input-c ml-2"}
                                        label=""
                                        symbol=""
                                        value={montoDescuento}
                                        onChange={(e) => {
                                            const { value } = e.target;
                                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                setMontoDescuento(value);
                                            } else if (value === '' || value === '.') {
                                                setMontoDescuento(value);
                                            }
                                        }}
                                        disabled={!descuentoActivado}
                                        onKeyDown={validateDecimalInput}
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28", width: '8.5rem' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex  mb-4">
                            <div>
                                <InputField
                                    label="Cambio"
                                    symbol="S/."
                                    value={cambio >= 0 ? cambio.toFixed(2) : ''}
                                    readOnly
                                    className={"input-c w-40 ml-2"}
                                    style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                />
                            </div>
                            <div className='ml-12 w-60'>
                                <InputField
                                    label="Faltante"
                                    symbol="S/."
                                    value={faltante >= 0 ? faltante.toFixed(2) : ''}
                                    readOnly
                                    style={{ height: "40px", border: "solid 0.1rem #171a1f28", width: '10.1rem' }}
                                    className={"input-c w-full ml-2"}
                                />
                            </div>
                        </div>
                        <hr className="mb-5" />
                        {faltante > 0 && (
                            <div>
                                <div className="flex justify-center text-center mb-4">
                                    <InputField
                                        label="Total a pagar"
                                        symbol="S/."
                                        value={faltante.toFixed(2)}
                                        readOnly
                                        style={{ height: "40px", border: "solid 0.2rem #171a1f28", backgroundColor: "#f5f5f5" }}
                                        className={"input-c w-40 ml-2 focus:outline-none"}
                                    />

                                </div>
                                <div className="flex mb-4">
                                    <InputField
                                        label="N°2 || Monto recibido"
                                        symbol="S/."
                                        placeholder={faltante.toFixed(2)}
                                        value={montoRecibido2}
                                        onChange={(e) => setMontoRecibido2(e.target.value)}
                                        pattern="[0-9]*[.]?[0-9]{0,2}"
                                        onKeyDown={validateDecimalInput}
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                        className={"input-c w-40 ml-2"}
                                    />
                                      <div style={{ marginLeft: "20px" }}> {/* Aumenta el margen izquierdo aquí */}
    <label className="block text-gray-800 mb-2 font-semibold">
      Método de pago
    </label>
    <Select
    isRequired
      placeholder="Método de pago"
      className={"input-c h-10 pr-8"}
      classNamediv={"flex items-center mt-2"}
      value={metodo_pago2}
      style={{ width: '13rem' }}
      onChange={(e) => setmetodo_pago2(e.target.value)}
      containerStyle={{ marginLeft: "5px" }}
      disabledKeys={disabledKeys2} // Ajusta el margen aquí si es necesario
    >
            {options.map(({ key, value, label }) => (
          <SelectItem key={key} value={value}>
            {label}
          </SelectItem>
        ))}
    </Select>
  </div>
                                </div>
                                <div className="flex mb-4">
                                    <InputField
                                        label="Cambio"
                                        symbol="S/."
                                        value={cambio2 >= 0 ? cambio2.toFixed(2) : ''}
                                        readOnly
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                        className={"input-c w-40 ml-2"}
                                    />
                                    <div className='ml-12 w-60'>
                                        <InputField
                                            label="Faltante"
                                            symbol="S/."
                                            value={faltante2 >= 0 ? faltante2.toFixed(2) : ''}
                                            readOnly
                                            style={{ height: "40px", border: "solid 0.1rem #171a1f28", width: '10.1rem' }}
                                            className={"input-c ml-2"}
                                        />
                                    </div>
                                </div>
                                <hr className='mb-5' />

                            </div>
                        )}
                        {faltante2 > 0 && (
                            <div>
                                <div className="flex justify-center text-center mb-4">
                                    <InputField
                                        label="Total a pagar"
                                        symbol="S/."
                                        value={faltante2.toFixed(2)}
                                        readOnly
                                        style={{ height: "40px", border: "solid 0.2rem #171a1f28", backgroundColor: "#f5f5f5" }}
                                        className={"input-c w-40 ml-2 focus:outline-none"}
                                    />

                                </div>
                                <div className="flex mb-4">
                                    <InputField
                                        placeholder={faltante2.toFixed(2)}

                                        label="N°3 || Monto recibido"
                                        symbol="S/."
                                        value={montoRecibido3}
                                        onChange={(e) => setMontoRecibido3(e.target.value)}
                                        pattern="[0-9]*[.]?[0-9]{0,2}"
                                        onKeyDown={validateDecimalInput}
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                        className={"input-c w-40 ml-2"}

                                    />
  <div style={{ marginLeft: "20px" }}> {/* Aumenta el margen izquierdo aquí */}
    <label className="block text-gray-800 mb-2 font-semibold">
      Método de pago
    </label>
    <Select
        isRequired
      placeholder="Método de pago"
      className={"input-c h-10 pr-8"}
      classNamediv={"flex items-center mt-2"}
      value={metodo_pago3}
      style={{ width: '13rem' }}
      onChange={(e) => setmetodo_pago3(e.target.value)}
      containerStyle={{ marginLeft: "5px" }}
      disabledKeys={disabledKeys3} // Ajusta el margen aquí si es necesario
    >
            {options.map(({ key, value, label }) => (
          <SelectItem key={key} value={value}>
            {label}
          </SelectItem>
        ))}
    </Select>
  </div>
                                </div>
                                <div className="flex justify-between mb-4">
                                    <InputField
                                        label="Cambio"
                                        symbol="S/."
                                        value={cambio3 >= 0 ? cambio3.toFixed(2) : ''}
                                        readOnly
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                        className={"input-c w-40 ml-2"}
                                    />
                                    <div className='ml-12 w-60'>
                                        <InputField
                                            label="Faltante"
                                            symbol="S/."
                                            value={faltante3 >= 0 ? faltante3.toFixed(2) : ''}
                                            readOnly
                                            style={{ height: "40px", border: "solid 0.1rem #171a1f28", width: '10.1rem' }}
                                            className={"input-c ml-2"}
                                        />
                                    </div>
                                </div>
                                <hr className='mb-5' />

                            </div>
                        )}

                        {/* Este div es solo para el voucher con preview */}
                        {/* <div style={{ display: 'none' }}>
                            <Voucher ref={VoucherRef} />
                        </div> */}
                        {/* Fin del div para el voucher con preview */}

                        <div className="flex justify-end mt-4">
                            <button type="submit" className="btn btn-cobrar mr-0" onClick={handleSubmit}>
                                <BsCashCoin className="mr-2" />
                                Cobrar e Imprimir
                            </button>
                        </div>
                        <VentaExitosaModal isOpen={showConfirmacion} onClose={() => setShowConfirmacion(false)} />
                        {showConfirmacion && <VentaExitosaModal onClose={() => setShowConfirmacion(false)} />}

                    </form>
                    {showNuevoCliente && (
                        <div className="pt-0 py-4 pl-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 flex">
                                <IoPersonAddSharp className="mr-2" style={{ fontSize: '25px' }} />

                                Agregar Cliente</h3>
                            <div className="flexflex-col mb-4">
                                <div className="w-full">
                                    <SelectField
                                        label="Tipo de cliente"
                                        options={['Natural', 'Jurídico']}
                                        value={tipo_cliente}
                                        onChange={(e) => settipo_cliente(e.target.value)}
                                        className={"input-c w-full h-10 border border-gray-300 pr-8"}
                                        classNamediv={"flex items-center mt-2 "}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between mb-4 ml-2">
                                <div className="w-full">
                                    <InputField
                                        placeholder="EJEM: 78541236"
                                        label="DNI/RUC: *"
                                        className="input-c "
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28", width: '11rem' }}
                                        value={dniOrRuc}
                                        onChange={(e) => setDni(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col justify-end ml-4">

                                    <button

                                        type="button"
                                        className="btn-validar text-white px-5 flex py-2 rounded"
                                        style={{ height: "40px", marginTop: "10px" }} onClick={handleValidate}>
                                        <GrValidate className="mr-2" style={{ fontSize: '20px' }} />
                                        Validar
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between mb-4 ml-2 ">
                                <div className="w-full">
                                    <InputField
                                        placeholder="EJEM: Juan Perez"
                                        label="Nombre del cliente / Razón social * "
                                        className="input-c w-full"
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                        value={nombreCliente}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between mb-4 ml-2 ">
                                <div className="w-full">
                                    <InputField
                                        type="address"
                                        placeholder="EJEM: Balta y Leguia"
                                        label="Dirección"
                                        className="input-c w-full"
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                        value={direccionCliente}
                                        readOnly
                                    />
                                </div>
                            </div>


                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="btn-aceptar-cliente text-white px-4 py-2 rounded"
                                    onClick={handleGuardarClientes}
                                >
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    className="btn-cerrar text-white px-4 py-2 rounded ml-4"
                                    onClick={() => setShowNuevoCliente(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>


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
