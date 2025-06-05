import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { BsCashCoin, BsCash } from "react-icons/bs";
import { IoCloseSharp } from 'react-icons/io5';
import { GrFormAdd } from "react-icons/gr";
import { Toaster, toast } from "react-hot-toast";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Textarea, Input } from "@heroui/input";
import { Select, SelectItem, Button, Checkbox } from "@heroui/react";
import { ScrollShadow } from "@heroui/scroll-shadow";
import useCobrarModalState from './useCobrarModalState';
import { useUserStore } from "@/store/useStore";
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import PagoDetalles from './PagoDetalles';
import PagoFaltante from './PagoFaltante';
import PagoFaltante2 from './PagoFaltante_2';
import AgregarClienteForm from './AgregarClienteForm';
import VentaExitosaModal from './VentaExitosaModal';
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { generateReceiptContent } from '../Comprobantes/Voucher/Voucher';
import { validateDecimalInput, handleCobrar } from '../../../Data/add_venta';
import { handleGuardarCliente } from '../../../Data/add_cliente';

const CobrarModal = ({ isOpen, onClose, totalImporte, total_I }) => {
  const {
    productos, sucursales, last, clientes, addCliente,
    montoRecibido, setMontoRecibido,
    observacion, setObservacion,
    descuentoActivado, setDescuentoActivado,
    montoDescuento, setMontoDescuento,
    montoRecibido2, setMontoRecibido2,
    comprobante_pago, setcomprobante_pago,
    metodo_pago, setmetodo_pago,
    metodo_pago2, setmetodo_pago2,
    montoRecibido3, setMontoRecibido3,
    metodo_pago3, setmetodo_pago3,
    showConfirmacion, setShowConfirmacion,
    showNuevoCliente, setShowNuevoCliente,
    tipo_cliente, settipo_cliente,
    serie, SetSerie, nu, SetNum,
    clienteSeleccionado, setClienteSeleccionado,
    dniOrRuc, setDni,
    nombreCliente, setNombreCliente,
    direccionCliente, setDireccionCliente,
    detalles, options,
    disabledKeys1, disabledKeys2, disabledKeys3,
  } = useCobrarModalState();

  const nombre = useUserStore((state) => state.nombre);
  const setComprobante = useVentaSeleccionadaStore((state) => state.setComprobante);
  const setObservacion1 = useVentaSeleccionadaStore((state) => state.setObservacion);
  const [activarPagoDividido3, setActivarPagoDividido3] = useState(false);

  // Estado para sucursal seleccionada
  const [sucursalV, setSucursalV] = useState(null);

  useEffect(() => {
    if (sucursales && nombre) {
      setSucursalV(sucursales.find(s => s.usuario === nombre) || null);
    }
  }, [sucursales, nombre]);

  // Cálculos de totales y faltantes
  const totalAPagarConDescuento = useMemo(
    () => descuentoActivado ? totalImporte - montoDescuento : totalImporte,
    [descuentoActivado, totalImporte, montoDescuento]
  );
  const igv_total = useMemo(() => parseFloat(total_I * 0.18).toFixed(2), [total_I]);
  const cambio = useMemo(() => parseFloat(montoRecibido) - totalAPagarConDescuento, [montoRecibido, totalAPagarConDescuento]);
  const faltante = useMemo(() => Math.max(totalAPagarConDescuento - parseFloat(montoRecibido), 0), [totalAPagarConDescuento, montoRecibido]);
  const cambio2 = useMemo(() => parseFloat(montoRecibido2) - faltante, [montoRecibido2, faltante]);
  const faltante2 = useMemo(() => Math.max(faltante - parseFloat(montoRecibido2), 0), [faltante, montoRecibido2]);
  const cambio3 = useMemo(() => parseFloat(montoRecibido3) - faltante2, [montoRecibido3, faltante2]);
  const faltante3 = useMemo(() => Math.max(faltante2 - parseFloat(montoRecibido3), 0), [faltante2, montoRecibido3]);

  const today = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d;
  }, []);
  const localDate = today.toISOString().slice(0, 10);

  const cliente = useMemo(
    () => clientes.find(c => c.nombre === clienteSeleccionado),
    [clientes, clienteSeleccionado]
  );

// --- AUTOCOMPLETADO DE PAGOS DIVIDIDOS ---
useEffect(() => {
  // --- AUTOCOMPLETADO DE PAGOS DIVIDIDOS ---

  // Si el comprobante es "Nota de venta"
  if (comprobante_pago === 'Nota de venta') {
    // Autocompletar monto recibido con el total a pagar con descuento
    if (parseFloat(montoRecibido) !== parseFloat(totalAPagarConDescuento.toFixed(2))) {
      setMontoRecibido(totalAPagarConDescuento.toFixed(2));
    }
    // Seleccionar "EFECTIVO" como método de pago principal
    if (metodo_pago !== 'EFECTIVO') {
      setmetodo_pago('EFECTIVO');
    }
    // Limpiar pagos divididos
    if (montoRecibido2 !== '') setMontoRecibido2('');
    if (montoRecibido3 !== '') setMontoRecibido3('');
    if (metodo_pago2 !== '') setmetodo_pago2('');
    if (metodo_pago3 !== '') setmetodo_pago3('');
    return; // No ejecutar el resto del efecto si es Nota de venta
  }

  // Solo para Boleta y Factura
  if (comprobante_pago === 'Boleta' || comprobante_pago === 'Factura') {
    // Si el primer método de pago es EFECTIVO
    if (metodo_pago === 'EFECTIVO') {

      // --- SEGUNDO PAGO DIVIDIDO ---
      if (!activarPagoDividido3 && faltante > 0) {
        // Autocompletar segundo pago si no está activado el tercero
        if (parseFloat(montoRecibido2) !== parseFloat(faltante.toFixed(2))) {
          setMontoRecibido2(faltante.toFixed(2));
        }
        // Limpiar tercer pago si no está activado
        if (montoRecibido3 !== '') setMontoRecibido3('');
        if (metodo_pago3 !== '') setmetodo_pago3('');
      }

      // --- TERCER PAGO DIVIDIDO ---
      if (activarPagoDividido3) {
        // Si hay un faltante2, autocompletar el tercer pago si está vacío o incorrecto
        if (faltante2 > 0) {
          if (!montoRecibido3 || parseFloat(montoRecibido3) !== parseFloat(faltante2.toFixed(2))) {
            setMontoRecibido3(faltante2.toFixed(2));
          }
        }
      }

    } else if (
      metodo_pago &&
      metodo_pago !== 'EFECTIVO' &&
      (parseFloat(montoRecibido) || 0) < totalAPagarConDescuento
    ) {
      // Si método principal no es efectivo y no cubre el total, autocompletar y limpiar adicionales
      setMontoRecibido(totalAPagarConDescuento.toFixed(2));
      if (montoRecibido2 !== '') setMontoRecibido2('');
      if (montoRecibido3 !== '') setMontoRecibido3('');
      if (metodo_pago2 !== '') setmetodo_pago2('');
      if (metodo_pago3 !== '') setmetodo_pago3('');
    }
  }
  // eslint-disable-next-line
}, [
  comprobante_pago,
  metodo_pago,
  faltante,
  faltante2,
  totalAPagarConDescuento,
  activarPagoDividido3,
  montoRecibido2,
  montoRecibido3,
  metodo_pago2,
  metodo_pago3,
  montoRecibido
]);

// Datos de venta
  const datosVenta = useMemo(() => ({
    usuario: nombre,
    id_comprobante: comprobante_pago,
    id_cliente: clienteSeleccionado,
    estado_venta: 2,
    sucursal: sucursalV?.nombre || "",
    direccion: sucursalV?.ubicacion || "",
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
    metodo_pago: metodo_pago + ':' + (metodo_pago === 'EFECTIVO' ? montoRecibido - cambio : montoRecibido) +
      (faltante > 0 ? ", " + ((metodo_pago2 + ':' + montoRecibido2) || '') : '') +
      (faltante2 > 0 ? ", " + ((metodo_pago3 + ':' + montoRecibido3) || '') : ''),
    fecha: new Date().toISOString().slice(0, 10),
    nombre_cliente: cliente ? cliente.nombre : '',
    documento_cliente: cliente ? cliente.documento : '',
    direccion_cliente: cliente ? cliente.direccion : '',
    igv_b: detalles.reduce((acc, detalle) => {
      const precioSinIGV = parseFloat(detalle.precio) / 1.18;
      const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad;
      return acc + igvDetalle;
    }, 0).toFixed(2),
    total_t: totalAPagarConDescuento,
    comprobante_pago: comprobante_pago === 'Boleta' ? 'Boleta de venta electronica' :
      comprobante_pago === 'Factura' ? 'Factura de venta electronica' : 'Nota de venta',
    totalImporte_venta: detalles.reduce((acc, detalle) => {
      const precioSinIGV = parseFloat(detalle.precio) / 1.18;
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
      (faltante2 > 0 ? ", " + (metodo_pago3 || '') : ''),
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
    observacion,
  }), [
    nombre, comprobante_pago, clienteSeleccionado, sucursalV, localDate, igv_total,
    detalles, metodo_pago, montoRecibido, cambio, faltante, metodo_pago2, montoRecibido2,
    faltante2, metodo_pago3, montoRecibido3, cliente, totalAPagarConDescuento, observacion, productos, cambio2, cambio3
  ]);

  // Sincroniza comprobante y observación en Zustand
  useEffect(() => {
    setComprobante({ comprobante_pago });
    setObservacion1({ observacion });
  }, [comprobante_pago, observacion, setComprobante, setObservacion1]);

    // Cambios aquí: handlePrint ahora es async y espera el contenido
  const handlePrint = async () => {
    let nombreImpresora = "BASIC 230 STYLE";
    let api_key = "90f5550c-f913-4a28-8c70-2790ade1c3ac";
    // eslint-disable-next-line no-undef
    const conector = new connetor_plugin();
    const empresaData = await getEmpresaDataByUser(nombre);
    // Pasa todos los datos necesarios como argumentos
    const content = await generateReceiptContent(
      datosVenta,
      datosVenta,
      useVentaSeleccionadaStore.getState().comprobante1,
      useVentaSeleccionadaStore.getState().observacion,
      nombre,
      empresaData
    );
    conector.textaling("center");
    const imgOptions = { width: 50, height: 50 };
    const qrOptions = { width: 300, height: 300 };
    conector.img_url(empresaData.logotipo, imgOptions);
    content.split('\n').forEach(line => conector.text(line));
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

const handleSubmit = (e) => {
  e.preventDefault();
  let errorMessage = '';

  // Suma de todos los pagos
  const totalRecibido =
    (parseFloat(montoRecibido) || 0) +
    (parseFloat(montoRecibido2) || 0) +
    (parseFloat(montoRecibido3) || 0);

  // Validación: Primer método de pago debe ser EFECTIVO para Boleta/Factura
  if ((comprobante_pago === 'Boleta' || comprobante_pago === 'Factura') && metodo_pago !== 'EFECTIVO') {
    toast.error('El primer método de pago debe ser EFECTIVO para Boleta o Factura.');
    return;
  }

  if (totalRecibido < totalImporte) {
    errorMessage += 'Ingrese una cantidad que cubra el total requerido. ';
  }
  if (!metodo_pago) {
    errorMessage += 'Seleccione el método de pago principal. ';
  }
  if (faltante > 0 && (!montoRecibido2 || !metodo_pago2)) {
    errorMessage += 'Ingrese una cantidad para el segundo monto o seleccione un ítem faltante. ';
  }
  if (faltante2 > 0 && (!montoRecibido3 || !metodo_pago3)) {
    errorMessage += 'Ingrese una cantidad para el tercer monto o seleccione un ítem faltante. ';
  }
  if (errorMessage) {
    toast.error(errorMessage.trim());
    return;
  }
  handlePrint();
  handleCobrar(datosVenta, setShowConfirmacion, datosVenta, { id: last.length > 0 ? last[0].id : '' });
};

  const handleGuardarClientes = (e) => {
    e.preventDefault();
    handleGuardarCliente({
      dniOrRuc, tipo_cliente, nombreCompleto: nombreCliente, direccion: direccionCliente
    }, setShowNuevoCliente);
    addCliente({ id: '', nombre: nombreCliente });
  };

  const token_cliente = import.meta.env.VITE_TOKEN_PROOVEDOR || '';
  const handleValidate = async () => {
    if (!dniOrRuc) {
      setNombreCliente('');
      setDireccionCliente('');
      return;
    }
    const url = tipo_cliente === 'Natural'
      ? `https://dniruc.apisperu.com/api/v1/dni/${dniOrRuc}?token=${token_cliente}`
      : `https://dniruc.apisperu.com/api/v1/ruc/${dniOrRuc}?token=${token_cliente}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (tipo_cliente === 'Natural') {
        setNombreCliente(`${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`);
        setDireccionCliente('');
      } else if (data.razonSocial) {
        setNombreCliente(data.razonSocial);
        setDireccionCliente(data.direccion || '');
      } else {
        alert('No se encontraron datos para el RUC proporcionado');
      }
    } catch (error) {
      console.error('Error al validar el DNI/RUC:', error);
      alert('Hubo un error al validar el DNI/RUC');
    }
  };

  const handleInputChange = (e) => setClienteSeleccionado(e.target.value);
  const handleSelectionChange = (value) => setClienteSeleccionado(value || 'Cliente Varios');

  if (!isOpen) return null;

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
          <ScrollShadow hideScrollBar className="w-full h-full" offset={100} orientation="horizontal">
            <div className="flex w-full h-full justify-center items-center m-0 p-0 box-border overflow-x-hidden">
              <form className='div-pagar-1' onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-4">
                  <Button
                    onClick={onClose}
                    color="#C20E4D"
                    variant="shadow"
                    className="close-modal-pagar absolute top-0 right-0 text-black-500"
                    style={{
                      width: "2rem",
                      height: "2rem",
                      padding: "0.25rem",
                      borderRadius: "0.25rem",
                      minWidth: "auto",
                      gap: "0",
                    }}
                  >
                    <IoCloseSharp style={{ fontSize: "1rem" }} />
                  </Button>
                  <h2 className="text-lg font-bold flex items-center">
                    <BsCash className="mr-2" style={{ fontSize: '25px' }} />
                    Pago
                  </h2>
                </div>
                <div className="mb-4">
                  <div className="flex items-start">
                    <div className="mr-4">
                      <label className="block text-gray-800 mb-2 font-semibold">
                        Seleccione el cliente
                      </label>
                      <div className="flex items-center">
                        <Autocomplete
                          isRequired
                          className="input-c mr-1 autocomplete-no-border"
                          placeholder="Seleccionar cliente"
                          style={{ width: '6rem', border: "none", boxShadow: "none", outline: "none" }}
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
                        <SelectItem key={'Boleta'} value={'Boleta'}>{'Boleta'}</SelectItem>
                        <SelectItem key={'Factura'} value={'Factura'}>{'Factura'}</SelectItem>
                        <SelectItem key={'Nota de venta'} value={'Nota de venta'}>{'Nota de venta'}</SelectItem>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Textarea
                      label="Descripción"
                      placeholder="Ingrese la descripción"
                      className="w-full max-w-md"
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      style={{
                        border: "none",
                        boxShadow: "none",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
                <hr className="mb-5" />
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
                {faltante > 0 && comprobante_pago !== 'Nota de venta' && (
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
                    activarPagoDividido3={activarPagoDividido3}
                    setActivarPagoDividido3={setActivarPagoDividido3}
                />
                )}

                {faltante2 > 0 && activarPagoDividido3 && (
                <PagoFaltante2
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
                <div className="flex justify-end mt-4">
                  <Button type="submit" className="btn btn-cobrar mr-0">
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