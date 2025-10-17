import { Button, Divider, Textarea } from '@heroui/react';
import { BsCashCoin } from 'react-icons/bs';
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { handleCobrar } from '@/services/data/add_venta';
import { useUserStore } from '@/store/useStore';
import useSucursalData from '@/services/data/data_sucursal_venta';
import { ActionButton } from "@/components/Buttons/Buttons";

const SalesStep4Preview = ({
  cobrarState,
  detalles,
  total_t,
  setCurrentStep,
  selectedDocumentType,
  clienteData,
  paymentData,
  productos,
  onResetVenta,
  onBlockNavigation,
  handleRemoveAllProducts,
  onPrintThermal
}) => {
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const [observacion, setObservacion] = useState(paymentData.observaciones || '');
  const nombre = useUserStore(state => state.nombre);
  const usuario = useUserStore(state => state.usuario);
  const sur = useUserStore(state => state.sur);
  
  // Obtener datos necesarios
    // Cargar sucursales y obtener dirección de la sucursal del store
  const { sucursales } = useSucursalData();
  const sucursalV = useMemo(() => {
    const found =
      (sucursales || []).find(
        s => String(s.nombre || '').toLowerCase() === String(sur || '').toLowerCase()
      ) || null;

    return {
      nombre: found?.nombre || sur || '',
      ubicacion: found?.ubicacion || '',
    };
  }, [sucursales, sur]);
  // Fecha local en formato YYYY-MM-DD
  function getFechaLocalISO() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - tzOffset).toISOString().slice(0, 19);
    return localISO.replace('T', ' ');
  }
  const localDate = getFechaLocalISO();

  // Fecha y hora local en formato ISO (con zona horaria)
  function getFechaIsoLocal() {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString();
  }
  const fechaIsoLocal = getFechaIsoLocal();
  
  // Cálculos para descuentos
  const descuentoCalculado = parseFloat(paymentData.descuentoCalculado || 0);
  const totalConDescuento = paymentData.descuentoActivado ? total_t - descuentoCalculado : total_t;
  
  // Cálculos para pagos múltiples
  const montoRecibido = parseFloat(paymentData.montoRecibido || 0);
  const montoAdicional = parseFloat(paymentData.montoAdicional || 0);
  const montoAdicional2 = parseFloat(paymentData.montoAdicional2 || 0);
  const totalPagado = montoRecibido + montoAdicional + montoAdicional2;
  const cambio = Math.max(totalPagado - totalConDescuento, 0);
  
  // Construir datos de venta
  const datosVenta = useMemo(() => ({
    usuario: usuario || nombre || 'admin', // Priorizar usuario, luego nombre, fallback a 'admin'
    id_comprobante: selectedDocumentType,
    id_cliente: clienteData.nombreCliente || 'Clientes Varios', // Usar el nombre del cliente, no el ID
    estado_venta: 1,
    ...(selectedDocumentType !== 'Nota de venta' && { estado_sunat: 1 }),
    sucursal: sucursalV?.nombre || "",
    direccion: sucursalV?.ubicacion || "",
    f_venta: localDate,
    igv: detalles.reduce((acc, detalle) => {
      const precioSinIGV = parseFloat(detalle.precio) / 1.18;
      const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad;
      return acc + igvDetalle;
    }, 0).toFixed(2),
    detalles: detalles.map(detalle => ({
      id_producto: detalle.codigo,
      cantidad: detalle.cantidad,
      precio: parseFloat(detalle.precio),
      descuento: parseFloat(detalle.descuento),
      total: parseFloat(detalle.subtotal.replace(/[^0-9.-]+/g, '')),
    })),
    fecha_iso: fechaIsoLocal,
    metodo_pago: paymentData.metodoPago + ':' + montoRecibido +
      (paymentData.metodoPago2 && montoAdicional > 0 ? ", " + paymentData.metodoPago2 + ':' + montoAdicional : '') +
      (paymentData.metodoPago3 && montoAdicional2 > 0 ? ", " + paymentData.metodoPago3 + ':' + montoAdicional2 : ''),
    fecha: localDate,
    nombre_cliente: clienteData.nombreCliente || 'Clientes Varios',
    documento_cliente: clienteData.dniOrRuc || '00000000',
    direccion_cliente: clienteData.direccionCliente || 'Sin dirección',
    igv_b: detalles.reduce((acc, detalle) => {
      const precioSinIGV = parseFloat(detalle.precio) / 1.18;
      const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad;
      return acc + igvDetalle;
    }, 0).toFixed(2),
    total_t: totalConDescuento,
    comprobante_pago: selectedDocumentType === 'Boleta' ? 'Boleta de venta electronica' :
      selectedDocumentType === 'Factura' ? 'Factura de venta electronica' : 'Nota de venta',
    totalImporte_venta: detalles.reduce((acc, detalle) => {
      const precioSinIGV = parseFloat(detalle.precio) / 1.18;
      return acc + (precioSinIGV * detalle.cantidad);
    }, 0).toFixed(2),
    descuento_venta: detalles.reduce((acc, detalle) => 
      acc + (parseFloat(detalle.precio) * parseFloat(detalle.descuento) / 100) * detalle.cantidad, 0
    ).toFixed(2),
    vuelto: cambio.toFixed(2),
    recibido: totalPagado.toFixed(2),
    formadepago: paymentData.metodoPago +
      (paymentData.metodoPago2 && montoAdicional > 0 ? ", " + paymentData.metodoPago2 : '') +
      (paymentData.metodoPago3 && montoAdicional2 > 0 ? ", " + paymentData.metodoPago3 : ''),
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
    observacion: observacion
  }), [detalles, selectedDocumentType, clienteData, paymentData, total_t, totalConDescuento, montoRecibido, montoAdicional, montoAdicional2, totalPagado, cambio, nombre, usuario, productos, localDate, fechaIsoLocal, observacion, sucursalV]);

  // Función para procesar la venta
 const procesarVenta = async () => {
    try {
      // Validaciones básicas
      if (!selectedDocumentType) {
        toast.error('Seleccione un tipo de comprobante');
        return;
      }
      if (!paymentData.metodoPago) {
        toast.error('Seleccione un método de pago');
        return;
      }
      if (selectedDocumentType !== 'Nota de venta' && !clienteData.nombreCliente) {
        toast.error('Seleccione un cliente');
        return;
      }
      if (totalPagado < totalConDescuento) {
        toast.error('El monto total recibido debe cubrir el total de la venta');
        return;
      }

      setProcesandoVenta(true);
      if (onBlockNavigation) {
        onBlockNavigation(true);
      }

      await handleCobrar(
        datosVenta,
        () => {
          // Imprimir ticket térmico con Voucher.jsx
          if (typeof onPrintThermal === 'function') {
            onPrintThermal(datosVenta, observacion); 
          }

          if (typeof handleRemoveAllProducts === 'function') {
            handleRemoveAllProducts();
          }
          setVentaExitosa(true);

          setTimeout(() => {
            if (onResetVenta) onResetVenta();
            setVentaExitosa(false);
            setProcesandoVenta(false);
            if (onBlockNavigation) onBlockNavigation(false);
            setCurrentStep(1);
          }, 3000);
        },
        datosVenta,
        nombre || usuario || 'admin'
      );

      setProcesandoVenta(false);

    } catch (error) {
      console.error('Error al procesar la venta:', error);
      toast.error('Error al procesar la venta');
      setProcesandoVenta(false);
      if (onBlockNavigation) {
        onBlockNavigation(false);
      }
    }
  };

  // Efecto para manejar la venta exitosa - DESHABILITADO
  // Ahora manejamos todo directamente en el callback de handleCobrar
  /*
  useEffect(() => {
    if (ventaExitosa && !resetInProgress) {
      console.log('🟡 Venta exitosa iniciada');
      setResetInProgress(true);
      
      if (onBlockNavigation) {
        onBlockNavigation(true);
      }
      
      const timeout = setTimeout(() => {
        console.log('🔄 Iniciando proceso de reset');
        
        // Primero resetear estados locales
        setVentaExitosa(false);
        setProcesandoVenta(false);
        console.log('✅ Estados locales reseteados');
        
        // Luego limpiar todos los datos de la venta
        if (onResetVenta) {
          onResetVenta();
          console.log('✅ Datos de venta limpiados');
        }
        
        // Finalmente desbloquear navegación y cambiar step
        setTimeout(() => {
          if (onBlockNavigation) {
            onBlockNavigation(false);
            console.log('✅ Navegación desbloqueada');
          }
          setCurrentStep(1);
          setResetInProgress(false);
          console.log('✅ Cambiado a step 1');
        }, 100);
        
      }, 3000);
      
      return () => {
        clearTimeout(timeout);
        setResetInProgress(false);
      };
    }
  }, [ventaExitosa, resetInProgress]);
  */

  const handleVolver = () => {
    if (!procesandoVenta && !ventaExitosa) {
      setCurrentStep(2);
    }
  };
  // Validación para evitar errores si cobrarState es undefined
  if (!cobrarState) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-red-600">Error: No se encontró información de la venta</p>
          <Button 
            className="mt-4" 
            variant="flat"
            onClick={() => setCurrentStep(2)}
          >
            Volver atrás
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mostrar mensaje de venta exitosa */}
      {ventaExitosa ? (
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-emerald-200 dark:border-emerald-800">
            <svg className="w-10 h-10 text-emerald-500 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="stroke-current text-emerald-300" cx="26" cy="26" r="25" fill="none" strokeWidth="2"/>
              <path className="stroke-current text-emerald-500" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 26l10 10 14-14" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-emerald-600 mb-2">¡Venta procesada exitosamente!</h3>
          <p className="text-base text-gray-600">
            Redirigiendo en unos segundos...
          </p>
        </div>
      ) : procesandoVenta ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-xl font-semibold text-blue-600 mb-2">Procesando venta...</h3>
          <p className="text-base text-gray-600">
            Por favor espere mientras se procesa la transacción
          </p>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-200 dark:border-blue-800 shadow">
              <BsCashCoin className="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¿Confirmar la venta?</h3>
            <p className="text-base text-gray-600">
              Revisa todos los datos antes de procesar la venta
            </p>
          </div>

          {/* Resumen final */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Comprobante:</span>
              <span className="text-sm font-medium text-gray-900">{cobrarState.comprobante_pago || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Número:</span>
              <span className="text-sm font-medium text-gray-900">{cobrarState.serie || 'N/A'}-{cobrarState.nu || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Productos:</span>
              <span className="text-sm font-medium text-gray-900">{detalles?.length || 0} items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Método de pago:</span>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {paymentData.metodoPago} - S/ {montoRecibido.toFixed(2)}
                </div>
                {paymentData.metodoPago2 && montoAdicional > 0 && (
                  <div className="text-sm font-medium text-gray-900">
                    {paymentData.metodoPago2} - S/ {montoAdicional.toFixed(2)}
                  </div>
                )}
                {paymentData.metodoPago3 && montoAdicional2 > 0 && (
                  <div className="text-sm font-medium text-gray-900">
                    {paymentData.metodoPago3} - S/ {montoAdicional2.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total recibido:</span>
              <span className="text-sm font-medium text-gray-900">S/ {totalPagado.toFixed(2)}</span>
            </div>
                    <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-600 font-medium">Observación:</span>
          <Textarea
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            placeholder="Agrega una observación para la venta (opcional)"
            minRows={2}
            maxRows={4}
            className="w-full"
            size="md"
            variant="flat"
          />
        </div>
            <Divider />
            <div className="flex justify-between">
              <span className="text-base font-medium text-gray-900">Total:</span>
              <span className="text-base font-bold text-green-600">S/ {totalConDescuento.toFixed(2)}</span>
            </div>
            {totalPagado > totalConDescuento && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vuelto:</span>
                <span className="text-sm font-medium text-blue-600">
                  S/ {cambio.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Botones finales */}
          <div className="grid grid-cols-2 gap-4">
            <ActionButton
              color="blue"
              icon={null}
              size="lg"
              className="px-6 h-12 font-semibold rounded-xl border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200"
              onClick={handleVolver}
              disabled={procesandoVenta}
            >
              Volver atrás
            </ActionButton>
            <ActionButton
              color="green"
              icon={<BsCashCoin className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />}
              size="lg"
              className="h-12 font-semibold rounded-xl border-0 shadow-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-200"
              onClick={procesarVenta}
              disabled={procesandoVenta}
            >
              {procesandoVenta ? 'Procesando...' : 'Cobrar e imprimir'}
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesStep4Preview;
