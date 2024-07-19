import { useState} from 'react';
import PropTypes from 'prop-types';
import { BsCashCoin, BsCash } from "react-icons/bs";
import { IoCloseSharp, IoPersonAddSharp } from 'react-icons/io5';
import { GrFormAdd } from "react-icons/gr";
import InputField from '../PagarInputs';
import SelectField from '../PagarSelectField';
import VentaExitosaModal from './VentaExitosaModal';
import useClientesData from '../../../Data/data_cliente_venta';
import { validateDecimalInput, handleCobrar } from '../../../Data/add_venta';
import { GrValidate } from "react-icons/gr";

const CobrarModal = ({ isOpen, onClose, totalImporte }) => {
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
    const { clientes } = useClientesData(); // Llama al hook personalizado para obtener los clientes
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const loadDetallesFromLocalStorage = () => {
        const savedDetalles = localStorage.getItem('detalles');
        return savedDetalles ? JSON.parse(savedDetalles) : [];
    };
    const detalles = loadDetallesFromLocalStorage();

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
        estado_venta: 0,
        f_venta: new Date().toISOString().slice(0, 10),
        igv: igv_total,
        detalles: detalles.map(detalle => ({
            id_producto: detalle.codigo,
            cantidad: detalle.cantidad,
            precio: parseFloat(detalle.precio),
            descuento: parseFloat(detalle.descuento),
            total: parseFloat(detalle.subtotal.replace(/[^0-9.-]+/g, '')),
        })),
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleCobrar(datosVenta, setShowConfirmacion);
    };

    return (
        <div className="modal-container" style={{ overflowY: 'auto' }} >
            <div className={` modal-pagar px-6 py-7 rounded-xl shadow-lg relative ${showNuevoCliente ? 'expanded' : ''}`} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className='flex'>
                    <form>
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={onClose} className="close-modal-pagar absolute top-0 right-0 text-black-500 p-2">
                                <IoCloseSharp />
                            </button>
                            <h2 className="text-lg font-bold flex items-center">
                                <BsCash className="mr-2" style={{ fontSize: '25px' }} />
                                Pago
                            </h2>
                        </div>
                        <div className="mb-4 flex justify-between">
                            <div>
                                <label className="block text-gray-800 mb-2 font-semibold">Seleccione el cliente</label>
                                <div className='flex items-center justify-between'>
                                <select
                className="input-c w-40 mr-3"
                style={{ border: "solid 0.1rem #171a1f28" }}
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value)}
            >
                <option value="">Seleccionar cliente</option>
                {clientes.map((cliente, index) => (
                    <option key={index} value={cliente.nombre}>{cliente.nombre}</option>
                ))}
            </select>
                                    <button type="button" className="btn-nuevo-cliente" onClick={() => setShowNuevoCliente(true)}>
                                        <GrFormAdd style={{ fontSize: '24px' }} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <SelectField
                                    label="Comprobante de pago"
                                    options={['Boleta', 'Factura', 'Nota de venta']}
                                    value={comprobante_pago}
                                    onChange={(e) => setcomprobante_pago(e.target.value)}
                                    containerStyle={{ marginLeft: '10px' }}
                                    className={"input-c w-full h-10 border border-gray-300"}
                                    classNamediv={"w-60 flex items-center mt-2 "}

                                />
                            </div>
                        </div>
                        <hr className="mb-5" />
                        <div className="flex justify-between mb-4">
                            <InputField
                                label="Total a pagar"
                                symbol="S/."
                                value={totalImporte}
                                readOnly
                                style={{ height: "40px", border: "solid 0.2rem #171a1f28", backgroundColor: "#f5f5f5" }}
                                className={"input-c w-40 ml-2 focus:outline-none"}
                            />
                            <SelectField
                                label="Método de pago"
                                options={['AMERICAN EXPRESS', 'DEPOSITO BBVA', 'DEPOSITO BCP', 'DEPOSITO CAJA PIURA', 'DEPOSITO INTERBANK', 'MASTER CARD', 'PLIN', 'VISA', 'YAPE', 'EFECTIVO']}
                                value={metodo_pago}
                                onChange={(e) => setmetodo_pago(e.target.value)}
                                containerStyle={{ marginLeft: '10px' }}
                                className={"input-c w-full h-10 border border-gray-300"}
                                classNamediv={"w-60 flex items-center mt-2 "}

                            />
                        </div>
                        <div className="flex justify-between">
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
                            <div className='ml-10 mb-4'>
                                <label className="text-gray-800 font-semibold">Aplicar descuento</label>
                                <div className='w-60 flex items-center h-50' >
                                    <span className='mt-2'>S/.</span>
                                    <input
                                        type="checkbox"
                                        className="ml-1 custom-checkbox relative mt-2"
                                        onChange={(e) => setDescuentoActivado(e.target.checked)}
                                    />
                                    <InputField
                                        className={"input-c w-full ml-2"}
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
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between mb-4">
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
                                    style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
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
                                <div className="flex justify-between mb-4">
                                    <InputField
                                        label="Monto recibido adicional"
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
                                        containerStyle={{ marginLeft: '10px' }}
                                        className={"input-c w-full h-10 border border-gray-300"}
                                        classNamediv={"w-60 flex items-center mt-2 "}
                                    />
                                </div>
                                <div className="flex justify-between mb-4">
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
                                            style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                            className={"input-c w-full ml-2"}
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
                                <div className="flex justify-between mb-4">
                                    <InputField
                                                                            placeholder={faltante2.toFixed(2)}

                                        label="Monto recibido adicional"
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
                                        containerStyle={{ marginLeft: '10px' }}
                                        className={"input-c w-full h-10 border border-gray-300"}
                                        classNamediv={"w-60 flex items-center mt-2 "}
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
                                            style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                            className={"input-c w-full ml-2"}
                                        />
                                    </div>
                                </div>
                                <hr className='mb-5' />

                            </div>
                        )}
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
                        <div className=" mt-5 py-4 pl-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4 flex">
                                <IoPersonAddSharp className="mr-2" style={{ fontSize: '25px' }} />

                                Agregar Cliente</h3>
                            <div className="flex justify-between mb-4">
                                <div className="w-1/2 pr-2 ml-2">
                                    <SelectField
                                        label="Tipo de cliente"
                                        options={['Natural', 'Jurídico']}
                                        value={tipo_cliente}
                                        onChange={(e) => settipo_cliente(e.target.value)}
                                        className="input-c w-full h-10 border border-gray-300 mt-2"
                                    />
                                </div>
                                <div className="w-1/2 pl-2">
                                    <InputField
                                        type="number"
                                        placeholder="EJEM: 987654321"
                                        label="Telefono"
                                        className="input-c w-full"
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between mb-4 ml-2">
                                <div className="w-full">
                                    <InputField
                                        placeholder="EJEM: 78541236"
                                        label="DNI/RUC: *"
                                        className="input-c w-full"
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                    />
                                </div>
                                <div className="flex flex-col justify-end ml-4">

                                    <button

                                        type="button"
                                        className="btn-validar text-white px-5 flex py-2 rounded"
                                        style={{ height: "40px", marginTop: "10px" }}>
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
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between mb-4 ml-2 ">
                                <div className="w-full">
                                    <InputField
                                        type="email"
                                        placeholder="EJEM: poala@gmail.com"
                                        label="Email"
                                        className="input-c w-full"
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
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
                                    />
                                </div>
                            </div>


                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="btn-aceptar-cliente text-white px-4 py-2 rounded"
                                    onClick={() => setShowNuevoCliente(false)}
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
