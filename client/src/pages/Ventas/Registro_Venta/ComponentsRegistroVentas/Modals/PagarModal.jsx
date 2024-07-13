import { useState } from 'react';
import PropTypes from 'prop-types';
import { BsCashCoin, BsCash } from "react-icons/bs";
import { IoCloseSharp } from 'react-icons/io5';
import { GrFormAdd } from "react-icons/gr";
import InputField from '../PagarInputs';
import SelectField from '../PagarSelectField';
import VentaExitosaModal from './VentaExitosaModal'; // Importar el nuevo componente

const CobrarModal = ({ isOpen, onClose, totalImporte }) => {

    const [montoRecibido, setMontoRecibido] = useState('');
    const [descuentoActivado, setDescuentoActivado] = useState(false);
    const [montoDescuento, setMontoDescuento] = useState(0);
    const [montoRecibido2, setMontoRecibido2] = useState('');
    const [metodo_pago, setmetodo_pago] = useState('EFECTIVO');
    const [metodo_pago2, setmetodo_pago2] = useState('EFECTIVO');
    const [montoRecibido3, setMontoRecibido3] = useState('');
    const [metodo_pago3, setmetodo_pago3] = useState('EFECTIVO');
    const [showConfirmacion, setShowConfirmacion] = useState(false); // Estado para mostrar el modal de confirmación

    if (!isOpen) return null;

    const totalAPagarConDescuento = descuentoActivado ? totalImporte - montoDescuento : totalImporte;
    const cambio = parseFloat(montoRecibido) - totalAPagarConDescuento;
    const faltante = Math.max(totalAPagarConDescuento - parseFloat(montoRecibido), 0);
    const cambio2 = parseFloat(montoRecibido2) - faltante;
    const faltante2 = Math.max(faltante - parseFloat(montoRecibido2), 0);
    const cambio3 = parseFloat(montoRecibido3) - faltante2;
    const faltante3 = Math.max(faltante2 - parseFloat(montoRecibido3), 0);
    const validateDecimalInput = (e) => {
        const { value } = e.target;
        const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', '.', ...Array.from(Array(10).keys()).map(String)];
        if (!allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
        if (value.includes('.')) {
            const parts = value.split('.');
            if (parts[1].length >= 2 && e.key !== 'Backspace') {
                e.preventDefault();
            }
        }
    };

    const handleCobrar = (e) => {
        e.preventDefault();
        // Aquí podrías realizar las acciones necesarias para cobrar e imprimir

        // Mostrar el modal de confirmación
        setShowConfirmacion(true);
    };

    return (
        <div className="modal-container" style={{ overflowY: 'auto' }} >

            <div className="modal-pagar px-6 py-7 rounded-xl shadow-lg relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={onClose} className="close-modal-pagar absolute top-0 right-0 text-black-500 p-2">
                        <IoCloseSharp />
                    </button>
                    <h2 className="text-lg font-bold flex items-center">
                        <BsCash className="mr-2" style={{ fontSize: '25px' }} />
                        Pago
                    </h2>
                </div>
                <form>
                    <div className="mb-4 flex justify-between">
                        <div>
                            <label className="block text-gray-800 mb-2 font-semibold">Seleccione el cliente</label>
                            <div className='flex items-center justify-between'>
                                <select className="input w-40 mr-3" style={{ border: "solid 0.1rem #171a1f28" }}>
                                    <option>Cliente 1</option>
                                    <option>Cliente 2</option>
                                </select>
                                <button className="btn-nuevo-cliente">
                                    <GrFormAdd style={{ fontSize: '24px' }} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <SelectField
                                label="Comprobante de pago"
                                options={['Boleta', 'Factura', 'Nota de venta']}
                                value={metodo_pago}
                                onChange={(e) => setmetodo_pago(e.target.value)}
                                containerStyle={{ marginLeft: '10px' }}
                            />
                        </div>

                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-800 mb-2 font-semibold">Vendedor</label>
                        <div className='flex items-center justify-between'>
                            <select className="input w-full mr-3" style={{ border: "solid 0.1rem #171a1f28" }}>
                                <option>Vendedor 1</option>
                                <option>Vendedor 2 </option>
                            </select>

                        </div>
                    </div>
                    <hr className="mb-5" />
                    <div className="flex justify-between mb-4">
                        <InputField
                            label="Total a pagar"
                            symbol="S/."
                            value={totalImporte}
                            readOnly
                            style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                            className={"input w-40 ml-2"}

                        />
                        <SelectField
                            label="Método de pago"
                            options={['AMERICAN EXPRESS', 'DEPOSITO BBVA', 'DEPOSITO BCP', 'DEPOSITO CAJA PIURA', 'DEPOSITO INTERBANK', 'MASTER CARD', 'PLIN', 'VISA', 'YAPE', 'EFECTIVO']}
                            value={metodo_pago}
                            onChange={(e) => setmetodo_pago(e.target.value)}
                            containerStyle={{ marginLeft: '10px' }}
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
                            className={"input w-40 ml-2"}

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
                                    className={"input w-full ml-2"}
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
                                className={"input w-40 ml-2"}
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
                                className={"input w-full ml-2"}
                            />
                        </div>

                    </div>
                    <hr className="mb-5" />
                    {faltante > 0 && (
                        <div className="mb-4">
                            <div className="flex justify-between mb-4">
                                <InputField
                                    label="Monto recibido"
                                    symbol="S/."
                                    value={montoRecibido2}
                                    onChange={(e) => setMontoRecibido2(e.target.value)}
                                    pattern="[0-9]*[.]?[0-9]{0,2}"
                                    onKeyDown={validateDecimalInput}
                                    style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                    className={"input w-40 ml-2"}
                                />
                                <SelectField
                                    label="Método de pago"
                                    options={['AMERICAN EXPRESS', 'DEPOSITO BBVA', 'DEPOSITO BCP', 'DEPOSITO CAJA PIURA', 'DEPOSITO INTERBANK', 'MASTER CARD', 'PLIN', 'VISA', 'YAPE', 'EFECTIVO']}
                                    value={metodo_pago2}
                                    onChange={(e) => setmetodo_pago2(e.target.value)}
                                    containerStyle={{ marginLeft: '10px' }}
                                />
                            </div>
                            <div className="flex justify-between mt-4 mb-4">
                                <div>
                                    <InputField
                                        label="Cambio"
                                        symbol="S/."
                                        value={cambio2 >= 0 ? cambio2.toFixed(2) : ''}
                                        readOnly
                                        className={"input w-40 ml-2"}
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                    />
                                </div>
                                <div className='ml-12 w-60'>
                                    <InputField
                                        label="Faltante"
                                        symbol="S/."
                                        value={faltante2 >= 0 ? faltante2.toFixed(2) : ''}
                                        readOnly
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                        className={"input w-full ml-2"}
                                    />
                                </div>
                            </div>
                            <hr className="mb-5" />
                        </div>
                    )}
                    {faltante2 > 0 && (
                        <div className="mb-4">
                            <div className="flex justify-between mb-4">
                                <InputField
                                    label="Monto recibido"
                                    symbol="S/."
                                    value={montoRecibido3}
                                    onChange={(e) => setMontoRecibido3(e.target.value)}
                                    pattern="[0-9]*[.]?[0-9]{0,2}"
                                    onKeyDown={validateDecimalInput}
                                    style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                    className={"input w-40 ml-2"}
                                />
                                <SelectField
                                    label="Método de pago"
                                    options={['AMERICAN EXPRESS', 'DEPOSITO BBVA', 'DEPOSITO BCP', 'DEPOSITO CAJA PIURA', 'DEPOSITO INTERBANK', 'MASTER CARD', 'PLIN', 'VISA', 'YAPE', 'EFECTIVO']}
                                    value={metodo_pago3}
                                    onChange={(e) => setmetodo_pago3(e.target.value)}
                                    containerStyle={{ marginLeft: '10px' }}
                                />
                            </div>
                            <div className="flex justify-between mt-4 mb-4">
                                <div>
                                    <InputField
                                        label="Cambio"
                                        symbol="S/."
                                        value={cambio3 >= 0 ? cambio3.toFixed(2) : ''}
                                        readOnly
                                        className={"input w-40 ml-2"}
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                    />
                                </div>
                                <div className='ml-12 w-60'>
                                    <InputField
                                        label="Faltante"
                                        symbol="S/."
                                        value={faltante3 >= 0 ? faltante3.toFixed(2) : ''}
                                        readOnly
                                        style={{ height: "40px", border: "solid 0.1rem #171a1f28" }}
                                        className={"input w-full ml-2"}
                                    />
                                </div>
                            </div>
                            <hr className="mb-5" />
                        </div>
                    )}


                    <div className="flex justify-end mt-4">
                        <button type="submit" className="btn btn-cobrar mr-0" onClick={handleCobrar}>
                            <BsCashCoin className="mr-2" />
                            Cobrar e Imprimir
                        </button>
                    </div>
                    <VentaExitosaModal isOpen={showConfirmacion} onClose={() => setShowConfirmacion(false)} />

                </form>
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
