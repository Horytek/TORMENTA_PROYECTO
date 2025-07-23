import { Button, Divider } from '@heroui/react';
import { BsCashCoin } from 'react-icons/bs';
import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { handleCobrar } from '@/services/Data/add_venta';
import { useUserStore } from '@/store/useStore';

const SalesStep4Preview = ({
  cobrarState,
  detalles,
  total_t,
  setCurrentStep,
  selectedDocumentType,
  clienteData,
  paymentData,
  productos,
  // Agregar callbacks para limpiar datos
  onResetVenta,
  // Callback para bloquear navegación
  onBlockNavigation
}) => {
  const [ventaExitosa, setVentaExitosa] = useState(false);
  const [procesandoVenta, setProcesandoVenta] = useState(false);
  const nombre = useUserStore(state => state.nombre);
  const usuario = useUserStore(state => state.usuario);
  
  // Obtener datos necesarios
  const sucursalV = { nombre: "Sucursal Principal", ubicacion: "Dirección Principal" };
  const localDate = new Date().toISOString().slice(0, 10);
  
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
    fecha_iso: new Date(),
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
    observacion: paymentData.observaciones || '',
  }), [detalles, selectedDocumentType, clienteData, paymentData, total_t, totalConDescuento, montoRecibido, montoAdicional, montoAdicional2, totalPagado, cambio, nombre, usuario, productos]);

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
      
      // Mostrar estado de procesamiento y bloquear navegación
      setProcesandoVenta(true);
      if (onBlockNavigation) {
        onBlockNavigation(true);
      }
      
      // Procesar la venta
      await handleCobrar(
        datosVenta, 
        () => {
          console.log('🎯 Callback de éxito ejecutado');
          setVentaExitosa(true);
          
          // Manejar la secuencia de reset directamente aquí
          setTimeout(() => {
            console.log('🔄 Iniciando proceso de reset directo');
            
            // Limpiar todos los datos de la venta
            if (onResetVenta) {
              onResetVenta();
              console.log('✅ Datos de venta limpiados');
            }
            
            // Resetear estados locales
            setVentaExitosa(false);
            setProcesandoVenta(false);
            console.log('✅ Estados locales reseteados');
            
            // Desbloquear navegación y cambiar step
            if (onBlockNavigation) {
              onBlockNavigation(false);
              console.log('✅ Navegación desbloqueada');
            }
            setCurrentStep(1);
            console.log('✅ Cambiado a step 1');
          }, 3000);
        }, 
        datosVenta, 
        { id: '' }, 
        nombre || usuario || 'admin'
      );
      
      setProcesandoVenta(false);
      
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      toast.error('Error al procesar la venta');
      setProcesandoVenta(false);
      // Desbloquear navegación en caso de error
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="stroke-current text-green-300" cx="26" cy="26" r="25" fill="none" strokeWidth="2"/>
              <path className="stroke-current text-green-500" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 26l10 10 14-14" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-600 mb-2">¡Venta procesada exitosamente!</h3>
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BsCashCoin className="w-8 h-8 text-green-600" />
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
            <Button 
              variant="flat"
              color='primary'
              size="lg"
              className="px-6"
              onClick={handleVolver}
              disabled={procesandoVenta}
            >
              Volver atrás
            </Button>
            
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-8" 
              variant="shadow"
              size="lg"
              onClick={procesarVenta}
              disabled={procesandoVenta}
            >
              {procesandoVenta ? 'Procesando...' : 'Cobrar e imprimir'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesStep4Preview;
