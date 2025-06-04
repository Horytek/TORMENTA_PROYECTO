import { useState, useEffect } from 'react';
import useClientesData from '../../../Data/data_cliente_venta';
import useProductosData from '../../../Data/data_producto_venta';
import useSucursalData from '../../../Data/data_sucursal_venta';
import { useLastData } from '../../../Data/getLastVenta';
import generateComprobanteNumber from '../../../Data/generate_comprobante';
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import { useUserStore } from "@/store/useStore";

const useCobrarModalState = () => {
  const { productos } = useProductosData();
  const { sucursales } = useSucursalData();
  const { last } = useLastData();
  const { clientes, addCliente } = useClientesData();

  const [montoRecibido, setMontoRecibido] = useState('');
  const [observacion, setObservacion] = useState('');
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
  const [serie, SetSerie] = useState('');
  const [nu, SetNum] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [dniOrRuc, setDni] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const usuario = useUserStore(state => state.nombre);

  // Zustand: detalles y comprobante globales
  const detalles = useVentaSeleccionadaStore((state) => state.total_ventas);
  const setComprobante1 = useVentaSeleccionadaStore((state) => state.setComprobante1);

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

  const disabledKeys1 = comprobante_pago !== 'Nota de venta'
    ? options.filter(({ value }) => value === metodo_pago2 || value === metodo_pago3).map(({ key }) => key)
    : options.filter(({ value }) => value !== 'EFECTIVO').map(({ key }) => key);

  const disabledKeys2 = options.filter(({ value }) => value === metodo_pago || value === metodo_pago3).map(({ key }) => key);
  const disabledKeys3 = options.filter(({ value }) => value === metodo_pago || value === metodo_pago2).map(({ key }) => key);

  const fetchComprobanteNumber = async () => {
    try {
      const comp = comprobante_pago;
      if (!comp) {
        console.warn('El valor de comp no es válido:', comp);
        return;
      }
      const nuevoNumComprobante = await generateComprobanteNumber(comp, usuario);
      SetSerie(nuevoNumComprobante.substring(1, nuevoNumComprobante.indexOf('-')));
      SetNum(nuevoNumComprobante.substring(nuevoNumComprobante.indexOf('-') + 1));
      setComprobante1({ nuevoNumComprobante }); // Guardar en Zustand
    } catch (error) {
      console.error('Error al obtener el número de comprobante:', error);
    }
  };

  useEffect(() => {
    fetchComprobanteNumber();
  }, [comprobante_pago]);

  return {
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
  };
};

export default useCobrarModalState;