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

const CobrarModal = ({ isOpen, onClose, totalImporte }) => {
    const { productos } = useProductosData();
    const [montoRecibido, setMontoRecibido] = useState('');
    const [descuentoActivado, setDescuentoActivado] = useState(false);
    const [montoDescuento, setMontoDescuento] = useState(0);
    const [montoRecibido2, setMontoRecibido2] = useState('');
    const [comprobante_pago, setcomprobante_pago] = useState('Boleta');
    const [metodo_pago, setmetodo_pago] = useState('EFECTIVO');
    const [metodo_pago2, setmetodo_pago2] = useState('EFECTIVO');
    const [montoRecibido3, setMontoRecibido3] = useState('');
    const [metodo_pago3, setmetodo_pago3] = useState('EFECTIVO');
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

                console.log('Nuevo número de comprobante:', nuevoNumComprobante);

                // Almacena el número de comprobante en el localStorage
                localStorage.setItem('comprobante1', JSON.stringify({ nuevoNumComprobante }));

                // Verifica si el almacenamiento local se actualizó correctamente
                console.log('Contenido actualizado de localStorage:', localStorage.getItem('comprobante1'));
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
    const igv_total = parseFloat(totalImporte * 0.18).toFixed(2);
    const cambio = parseFloat(montoRecibido) - totalAPagarConDescuento;
    const faltante = Math.max(totalAPagarConDescuento - parseFloat(montoRecibido), 0);
    const cambio2 = parseFloat(montoRecibido2) - faltante;
    const faltante2 = Math.max(faltante - parseFloat(montoRecibido2), 0);
    const cambio3 = parseFloat(montoRecibido3) - faltante2;
    const faltante3 = Math.max(faltante2 - parseFloat(montoRecibido3), 0);

    const datosVenta = {
        usuario: localStorage.getItem('usuario'),
        id_comprobante: comprobante_pago,
        id_cliente: clienteSeleccionado,
        estado_venta: 2,
        f_venta: new Date().toISOString().slice(0, 10),
        igv: igv_total,
        detalles: detalles.map(detalle => ({
            id_producto: detalle.codigo,
            cantidad: detalle.cantidad,
            precio: parseFloat(detalle.precio),
            descuento: parseFloat(detalle.descuento),
            total: parseFloat(detalle.subtotal.replace(/[^0-9.-]+/g, '')),
        })),
        fecha_iso: new Date(),
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
    };

    saveDetallesToLocalStorage();



    const handleSubmit = (e) => {
        e.preventDefault();
        handleCobrar(datosVenta, setShowConfirmacion);
        handlePrint();  // Esto llamará a la función de impresión
    };

    const cliente = clientes.find(cliente => cliente.nombre === clienteSeleccionado);


    {/* Esto son los datos que pasan al voucher */ }
    const datosVentaComprobante = {

        fecha: new Date().toISOString().slice(0, 10),
        nombre_cliente: cliente ? cliente.nombre : '',
        documento_cliente: cliente ? cliente.documento : '',
        direccion_cliente: cliente ? cliente.direccion : '',
        igv: (detalles.reduce((acc, detalle) => acc + (parseFloat(detalle.precio) * detalle.cantidad), 0).toFixed(2)) * 0.18,
        total_t: totalAPagarConDescuento,
        comprobante_pago: comprobante_pago === 'Boleta' ? 'Boleta de venta electronica' :
            comprobante_pago === 'Factura' ? 'Factura de venta electronica' :
                'Nota de venta',
        totalImporte_venta: detalles.reduce((acc, detalle) => acc + (parseFloat(detalle.precio) * detalle.cantidad), 0).toFixed(2),
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

    console.log(datosVentaComprobante);
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
            console.log("Impresión exitosa");
        } else {
            console.log("Problema al imprimir: " + resp);
        }
    };
    {/* Fin del handlePrint del voucher automatico */ }


    const handleGuardarClientes = (e) => {
        e.preventDefault();
        handleGuardarCliente(datosCliente, setShowNuevoCliente);
        addCliente(datosCliente_P);
    };

    const handleValidate = async () => {
        if (dniOrRuc != '') {
            const url =
                tipo_cliente === 'Natural'
                    ? `https://dniruc.apisperu.com/api/v1/dni/${dniOrRuc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImJ1c3RhbWFudGU3NzdhQGdtYWlsLmNvbSJ9.0tadscJV_zWQqZeRMDM4XEQ9_t0f7yph4WJWNoyDHyw`
                    : `https://dniruc.apisperu.com/api/v1/ruc/${dniOrRuc}?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImJ1c3RhbWFudGU3NzdhQGdtYWlsLmNvbSJ9.0tadscJV_zWQqZeRMDM4XEQ9_t0f7yph4WJWNoyDHyw`;

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
        <div className="modal-container" style={{ overflowY: 'auto' }} >
            <div className={` modal-pagar px-6 py-7 rounded-xl shadow-lg relative ${showNuevoCliente ? 'expanded' : ''}`} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className='flex '>
                    <form className='div-pagar-1'>
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={onClose} className="close-modal-pagar absolute top-0 right-0 text-black-500 p-2">
                                <IoCloseSharp />
                            </button>
                            <h2 className="text-lg font-bold flex items-center">
                                <BsCash className="mr-2" style={{ fontSize: '25px' }} />
                                Pago
                            </h2>
                        </div>
                        <div className="mb-4 flex">
                            <div>
                                <label className="block text-gray-800 mb-2 font-semibold">Seleccione el cliente</label>
                                <div className='flex items-center justify-between'>
                                <Autocomplete
                                        className="input-c mr-1 autocomplete-no-border"
                                        placeholder="Seleccionar cliente"
                                        style={{ width: '6rem' }}
                                        value={clienteSeleccionado}
                                        onChange={handleInputChange} // Usa onChange para manejar cambios en el input
                                        onSelectionChange={handleSelectionChange} // Usa onSelectionChange para manejar la selección
                                    >
                                        {clientes.map((cliente) => (
                                            <AutocompleteItem key={cliente.nombre} value={cliente.nombre}>{cliente.nombre}</AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                    <button type="button" className="btn-nuevo-cliente px-1 py-2" onClick={() => setShowNuevoCliente(true)}>
                                        <GrFormAdd style={{ fontSize: '24px' }} />
                                    </button>
                                </div>
                            </div>
                            <div style={{ marginLeft: "10px" }}>
                                <SelectField
                                    label="Comprobante de pago"
                                    options={['Boleta', 'Factura', 'Nota de venta']}
                                    value={comprobante_pago}
                                    onChange={(e) => setcomprobante_pago(e.target.value)}
                                    containerStyle={{ marginLeft: '10px' }}
                                    className={"input-c h-10 border border-gray-300 pr-8"}
                                    classNamediv={"flex items-center mt-2 "}
                                    style={{ width: '12rem' }}
                                />
                            </div>
                        </div>
                        <hr className="mb-5" />
                        <div className="flex mb-4" >
                            <InputField
                                label="Total a pagar"
                                symbol="S/."
                                value={totalImporte}
                                readOnly
                                style={{ height: "40px", border: "solid 0.2rem #171a1f28", backgroundColor: "#f5f5f5" }}
                                className={"input-c w-40 ml-2 focus:outline-none"}
                            />
                            <div >
                                <SelectField
                                    label="Método de pago"
                                    options={['AMERICAN EXPRESS', 'DEPOSITO BBVA', 'DEPOSITO BCP', 'DEPOSITO CAJA PIURA', 'DEPOSITO INTERBANK', 'MASTER CARD', 'PLIN', 'VISA', 'YAPE', 'EFECTIVO']}
                                    value={metodo_pago}
                                    onChange={(e) => setmetodo_pago(e.target.value)}
                                    containerStyle={{ marginLeft: '45px' }}
                                    className={"input-c h-10 border border-gray-300 pr-8"}
                                    classNamediv={"flex items-center mt-2 "}
                                    style={{ width: '12rem' }}
                                />
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
                                    <SelectField
                                        label="Método de pago"
                                        options={['AMERICAN EXPRESS', 'DEPOSITO BBVA', 'DEPOSITO BCP', 'DEPOSITO CAJA PIURA', 'DEPOSITO INTERBANK', 'MASTER CARD', 'PLIN', 'VISA', 'YAPE', 'EFECTIVO']}
                                        value={metodo_pago2}
                                        onChange={(e) => setmetodo_pago2(e.target.value)}
                                        containerStyle={{ marginLeft: '45px' }}
                                        className={"input-c h-10 border border-gray-300 pr-8"}
                                        classNamediv={"flex items-center mt-2 "}
                                        style={{ width: '12rem' }}
                                    />
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
                                    <SelectField
                                        label="Método de pago"
                                        options={['AMERICAN EXPRESS', 'DEPOSITO BBVA', 'DEPOSITO BCP', 'DEPOSITO CAJA PIURA', 'DEPOSITO INTERBANK', 'MASTER CARD', 'PLIN', 'VISA', 'YAPE', 'EFECTIVO']}
                                        value={metodo_pago3}
                                        onChange={(e) => setmetodo_pago3(e.target.value)}
                                        containerStyle={{ marginLeft: '45px' }}
                                        className={"input-c h-10 border border-gray-300 pr-8"}
                                        classNamediv={"flex items-center mt-2 "}
                                        style={{ width: '12rem' }}
                                    />
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
    );
};

CobrarModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    totalImporte: PropTypes.number.isRequired,
};

export default CobrarModal;
