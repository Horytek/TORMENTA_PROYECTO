import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { toast, Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { generateReceiptContent } from './ComponentsRegistroVentas/Comprobantes/Voucher/Voucher';
import { getEmpresaDataByUser } from '@/services/empresa.services'; 
import generateComprobanteNumber from '@/services/data/generate_comprobante';
import { Button, Card, CardHeader, CardBody, Divider, Chip, ScrollShadow } from '@heroui/react';
import PropTypes from 'prop-types';

// Componentes internos
import ProductSearchSection from './components/ProductSearchSection';
import SalesStep1 from './components/SalesStep1';
import SalesStep2 from './components/SalesStep2';
import SalesStep3 from './components/SalesStep3';
import SalesStep4Preview from './components/SalesStep4Preview';

// Componentes existentes
import AlertModal from '../../../components/Modals/AlertModal';
import Comprobante from '../Registro_Venta/ComponentsRegistroVentas/Comprobantes/CotizacionPDF/CotizacionPDF';

// Custom hooks
import useVentasData from '@/services/data/data_venta';
import useProductosData from '@/services/data/data_producto_venta';
import useClientesData from '@/services/data/data_cliente_venta';
import { useVentaSeleccionadaStore } from '@/store/useVentaTable';
import { useUserStore } from '@/store/useStore';

const Registro_Venta = () => {
  // States
  const nombre = useUserStore((state) => state.nombre);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [nuevoNumComprobante, setNuevoNumComprobante] = useState(null); // <--- NUEVO
  const [currentStep, setCurrentStep] = useState(1); // 1: Resumen, 2: Comprobante, 3: Pago, 4: Confirmación
  const [selectedDocumentType, setSelectedDocumentType] = useState("Boleta");
  const [clienteData, setClienteData] = useState({
    tipo_cliente: 'Natural',
    dniOrRuc: '',
    nombreCliente: '',
    direccionCliente: '',
    clienteSeleccionado: ''
  });
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [navigationBlocked, setNavigationBlocked] = useState(false);
  const [paymentData, setPaymentData] = useState({
    metodoPago: "",
    montoRecibido: "",
    metodoPago2: "",
    montoAdicional: "",
    metodoPago3: "",
    montoRecibido3: "",
    observaciones: "",
    total: 0,
    vuelto: 0
  });
  
  // Refs
  const componentRef = useRef();
  
  // Custom hooks
  const { detalles, addDetalle, updateDetalle, removeDetalle, clearAllDetalles } = useVentasData();
  const { productos, setProductos } = useProductosData();
  const { clientes, addCliente } = useClientesData();
  const [stockOriginal, setStockOriginal] = useState({});
  
// Effects
useEffect(() => {
  // Actualizar total_ventas en Zustand solo si cambia detalles
  const currentTotalVentas = useVentaSeleccionadaStore.getState().total_ventas;
  if (JSON.stringify(currentTotalVentas) !== JSON.stringify(detalles)) {
    useVentaSeleccionadaStore.getState().setTotalVentas(detalles);
  }

  // Guardar el stock original solo una vez al cargar productos
  if (productos.length > 0 && Object.keys(stockOriginal).length === 0) {
    const stockMap = {};
    productos.forEach(p => {
      stockMap[p.codigo] = p.stock;
    });
    setStockOriginal(stockMap);
  }
}, [detalles, productos, stockOriginal]);

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // Product selection handler
  const handleProductSelect = (producto) => {
    const existingDetalle = detalles.find(detalle => detalle.codigo === producto.codigo);
    const productoIndex = productos.findIndex(p => p.codigo === producto.codigo);
    
    if (productoIndex !== -1 && productos[productoIndex].stock > 0) {
      let nuevosDetalles;
      
      if (existingDetalle) {
        const updatedCantidad = existingDetalle.cantidad + 1;
        const updatedSubtotal = (
          parseFloat(existingDetalle.precio) * updatedCantidad - 
          ((parseFloat(existingDetalle.descuento) / 100) * existingDetalle.precio) * updatedCantidad
        ).toFixed(2);
        
        nuevosDetalles = detalles.map(detalle => 
          detalle.codigo === producto.codigo 
            ? { ...detalle, cantidad: updatedCantidad, subtotal: `S/ ${updatedSubtotal}` }
            : detalle
        );
      } else {
        const subtotal = (parseFloat(producto.precio) - parseFloat(0)).toFixed(2);
        const newDetalle = { 
          ...producto, 
          cantidad: 1, 
          descuento: '0', 
          subtotal: `S/ ${subtotal}` 
        };
        nuevosDetalles = [...detalles, newDetalle];
      }
      
      // Calcular el nuevo total para validar el límite de 499
      const nuevoTotalImporte = nuevosDetalles.reduce((acc, item) => {
        const subtotalNumber = parseFloat(item.subtotal.replace(/[^\d.-]/g, ''));
        return acc + subtotalNumber / 1.18;
      }, 0);
      
      const nuevoIgv = nuevoTotalImporte * 0.18;
      const nuevoTotalExacto = nuevoTotalImporte + nuevoIgv;
      
      // Validar que no supere los 499 soles
      if (nuevoTotalExacto > 499) {
        toast.error(`No se puede agregar el producto. El total sería S/ ${nuevoTotalExacto.toFixed(2)} (máximo permitido: S/ 499.00)`);
        return;
      }
      
      // Si pasa la validación, proceder con la actualización
      if (existingDetalle) {
        const updatedCantidad = existingDetalle.cantidad + 1;
        const updatedSubtotal = (
          parseFloat(existingDetalle.precio) * updatedCantidad - 
          ((parseFloat(existingDetalle.descuento) / 100) * existingDetalle.precio) * updatedCantidad
        ).toFixed(2);
        
        updateDetalle({ 
          ...existingDetalle, 
          cantidad: updatedCantidad, 
          subtotal: `S/ ${updatedSubtotal}` 
        });
      } else {
        const subtotal = (parseFloat(producto.precio) - parseFloat(0)).toFixed(2);
        const newDetalle = { 
          ...producto, 
          cantidad: 1, 
          descuento: '0', 
          subtotal: `S/ ${subtotal}` 
        };
        addDetalle(newDetalle);
      }

      setProductos(prevProductos => 
        prevProductos.map(p => 
          p.codigo === producto.codigo 
            ? { ...p, stock: p.stock - 1 } 
            : p
        )
      );
    } else {
      setShowAlert(true);
    }
  };

  // Product removal handler
  const handleProductRemove = (codigo, cantidad) => {
    removeDetalle(codigo);
    setProductos(prevProductos => 
      prevProductos.map(p => 
        p.codigo === codigo 
          ? { ...p, stock: p.stock + cantidad } 
          : p
      )
    );
  };

  // Incrementar cantidad de producto
  const handleIncrement = (index) => {
    const detalle = detalles[index];
    if (detalle) {
      const productoIndex = productos.findIndex(p => p.codigo === detalle.codigo);
      
      // Verificar si hay stock disponible
      if (productoIndex !== -1 && productos[productoIndex].stock > 0) {
        const updatedCantidad = detalle.cantidad + 1;
        const updatedSubtotal = (
          parseFloat(detalle.precio) * updatedCantidad - 
          ((parseFloat(detalle.descuento) / 100) * detalle.precio) * updatedCantidad
        ).toFixed(2);
        
        // Calcular el nuevo total simulado para validar el límite de 499
        const nuevosDetalles = detalles.map((d, i) => 
          i === index 
            ? { ...d, cantidad: updatedCantidad, subtotal: `S/ ${updatedSubtotal}` }
            : d
        );
        
        const nuevoTotalImporte = nuevosDetalles.reduce((acc, item) => {
          const subtotalNumber = parseFloat(item.subtotal.replace(/[^\d.-]/g, ''));
          return acc + subtotalNumber / 1.18;
        }, 0);
        
        const nuevoIgv = nuevoTotalImporte * 0.18;
        const nuevoTotalExacto = nuevoTotalImporte + nuevoIgv;
        
        // Validar que no supere los 499 soles
        if (nuevoTotalExacto > 499) {
          toast.error(`No se puede incrementar, máximo permitido: S/ 499.00`);
          return;
        }
        
        updateDetalle({ 
          ...detalle, 
          cantidad: updatedCantidad, 
          subtotal: `S/ ${updatedSubtotal}` 
        });

        // Reducir stock
        setProductos(prevProductos => 
          prevProductos.map(p => 
            p.codigo === detalle.codigo 
              ? { ...p, stock: p.stock - 1 } 
              : p
          )
        );
      } else {
        toast.error('No hay stock suficiente');
      }
    }
  };

  // Decrementar cantidad de producto
  const handleDecrement = (index) => {
    const detalle = detalles[index];
    if (detalle && detalle.cantidad > 1) {
      const updatedCantidad = detalle.cantidad - 1;
      const updatedSubtotal = (
        parseFloat(detalle.precio) * updatedCantidad - 
        ((parseFloat(detalle.descuento) / 100) * detalle.precio) * updatedCantidad
      ).toFixed(2);
      
      updateDetalle({ 
        ...detalle, 
        cantidad: updatedCantidad, 
        subtotal: `S/ ${updatedSubtotal}` 
      });

      // Aumentar stock
      setProductos(prevProductos => 
        prevProductos.map(p => 
          p.codigo === detalle.codigo 
            ? { ...p, stock: p.stock + 1 } 
            : p
        )
      );
    }
  };

  // Función para cambiar directamente la cantidad de un producto
  const handleQuantityChange = (index, newQuantity) => {
    const detalle = detalles[index];
    if (!detalle) return;

    // Validar que la nueva cantidad sea válida
    if (newQuantity < 1 || newQuantity > 999) return;

    const cantidadAnterior = detalle.cantidad;
    const diferencia = newQuantity - cantidadAnterior;
    
    // Encontrar el producto correspondiente para verificar stock
    const productoIndex = productos.findIndex(p => p.codigo === detalle.codigo);
    
    if (productoIndex === -1) return;
    
    const producto = productos[productoIndex];
    
    // Si la nueva cantidad es mayor, verificar stock
    if (diferencia > 0 && producto.stock < diferencia) {
      toast.error(`No hay stock suficiente. Stock disponible: ${producto.stock}`);
      return;
    }
    
    // Calcular el nuevo subtotal
    const updatedSubtotal = (
      parseFloat(detalle.precio) * newQuantity - 
      ((parseFloat(detalle.descuento) / 100) * detalle.precio) * newQuantity
    ).toFixed(2);
    
    // Calcular el nuevo total simulado para validar el límite de 499
    const nuevosDetalles = detalles.map((d, i) => 
      i === index 
        ? { ...d, cantidad: newQuantity, subtotal: `S/ ${updatedSubtotal}` }
        : d
    );
    
    const nuevoTotalImporte = nuevosDetalles.reduce((acc, item) => {
      const subtotalNumber = parseFloat(item.subtotal.replace(/[^\d.-]/g, ''));
      return acc + subtotalNumber / 1.18;
    }, 0);
    
    const nuevoIgv = nuevoTotalImporte * 0.18;
    const nuevoTotalExacto = nuevoTotalImporte + nuevoIgv;
    
    // Validar que no supere los 499 soles
    if (nuevoTotalExacto > 499) {
      toast.error(`No se puede cambiar a esta cantidad, máximo permitido: S/ 499.00`);
      return;
    }
    
    // Actualizar el detalle
    updateDetalle({ 
      ...detalle, 
      cantidad: newQuantity, 
      subtotal: `S/ ${updatedSubtotal}` 
    });

    // Actualizar el stock del producto
    setProductos(prevProductos => 
      prevProductos.map(p => 
        p.codigo === detalle.codigo 
          ? { ...p, stock: p.stock - diferencia } 
          : p
      )
    );
  };

    // Función para cambiar el precio de un producto en el detalle
  const handlePriceChange = (index, newPrice) => {
    const detalle = detalles[index];
    if (!detalle) return;

    // Validar que el nuevo precio sea un número positivo
    const precioFinal = parseFloat(newPrice);
    if (isNaN(precioFinal) || precioFinal < 0) return;

    // Calcular el nuevo subtotal con el precio actualizado
    const updatedSubtotal = (
      precioFinal * detalle.cantidad -
      ((parseFloat(detalle.descuento) / 100) * precioFinal) * detalle.cantidad
    ).toFixed(2);

    // Simular el nuevo total para validar el límite de 499 soles
    const nuevosDetalles = detalles.map((d, i) =>
      i === index
        ? { ...d, precio: precioFinal, subtotal: `S/ ${updatedSubtotal}` }
        : d
    );

    const nuevoTotalImporte = nuevosDetalles.reduce((acc, item) => {
      const subtotalNumber = parseFloat(item.subtotal.replace(/[^\d.-]/g, ''));
      return acc + subtotalNumber / 1.18;
    }, 0);

    const nuevoIgv = nuevoTotalImporte * 0.18;
    const nuevoTotalExacto = nuevoTotalImporte + nuevoIgv;

    // Validar que no supere los 499 soles
    if (nuevoTotalExacto > 499) {
      toast.error(`No se puede cambiar el precio, máximo permitido: S/ 499.00`);
      return;
    }

    // Actualizar el detalle con el nuevo precio y subtotal
    updateDetalle({
      ...detalle,
      precio: precioFinal,
      subtotal: `S/ ${updatedSubtotal}`
    });
  };

    // Filtered products for modal
  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory ? producto.categoria === selectedCategory : true) &&
    (selectedMarca ? producto.nom_marca === selectedMarca : true)
  );

  // Get unique brands from products
  const marcasUnicas = [...new Set(productos.map(producto => producto.nom_marca))].filter(Boolean).sort();

  // Remove all products handler
  const handleRemoveAllProducts = () => {
    // Restaurar el stock original de todos los productos
    setProductos(prevProductos =>
      prevProductos.map(p =>
        stockOriginal[p.codigo] !== undefined
          ? { ...p, stock: stockOriginal[p.codigo] }
          : p
      )
    );
    // Limpiar todos los detalles de una vez
    clearAllDetalles();
  };

const actualizarStockDespuesVenta = () => {
  setProductos(prevProductos =>
    prevProductos.map(p => {
      // Buscar si el producto está en los detalles de la venta
      const detalleVenta = detalles.find(d => d.codigo === p.codigo);
      if (detalleVenta) {
        // Restar la cantidad vendida al stock actual
        return { ...p, stock: p.stock - detalleVenta.cantidad };
      }
      return p;
    })
  );
};



  // Calculate totals
  const totalImporte = detalles.reduce((acc, item) => {
    const subtotalNumber = parseFloat(item.subtotal.replace(/[^\d.-]/g, ''));
    return acc + subtotalNumber / 1.18;
  }, 0).toFixed(2);

  const igv_t = (totalImporte * 0.18).toFixed(2);
  const total_t = Math.round(parseFloat(totalImporte) + parseFloat(igv_t));

  // Función para resetear todos los datos de la venta
  const resetVentaData = () => {
    // Restaurar stock de todos los productos antes de limpiar
    detalles.forEach(detalle => {
      setProductos(prevProductos =>
        prevProductos.map(p =>
          p.codigo === detalle.codigo
            ? { ...p, stock: p.stock + detalle.cantidad }
            : p
        )
      );
    });
    
    // Limpiar todos los detalles de una vez
    clearAllDetalles();
    
    // Resetear datos del cliente
    setClienteData({
      tipo_cliente: 'Natural',
      dniOrRuc: '',
      nombreCliente: '',
      direccionCliente: '',
      clienteSeleccionado: ''
    });
    
    // Resetear datos de pago
    setPaymentData({
      metodoPago: "",
      montoRecibido: "",
      metodoPago2: "",
      montoAdicional: "",
      metodoPago3: "",
      montoRecibido3: "",
      observaciones: "",
      total: 0,
      vuelto: 0
    });
    
    // Resetear tipo de documento
    setSelectedDocumentType("Boleta");
    
    // Cerrar modales si están abiertos
    setShowNuevoCliente(false);
    setShowAlert(false);
    
    // Desbloquear navegación
    setNavigationBlocked(false);
    
    // Forzar actualización del store de Zustand
    useVentaSeleccionadaStore.getState().setTotalVentas([]);
  };

  // Sale data for receipt
  const datosVentaComprobante = {
    fecha: new Date().toISOString().slice(0, 10),
    totalImporte_venta: detalles.reduce((acc, detalle) => {
      const precioSinIGV = parseFloat(detalle.precio) / 1.18;
      return acc + (precioSinIGV * detalle.cantidad);
    }, 0).toFixed(2),
    igv: detalles.reduce((acc, detalle) => {
      const precioSinIGV = parseFloat(detalle.precio) / 1.18;
      const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad;
      return acc + igvDetalle;
    }, 0).toFixed(2),
    total_t: detalles.reduce((acc, detalle) => {
      const precioSinIGV = parseFloat(detalle.precio) / 1.18;
      const igvDetalle = precioSinIGV * 0.18 * detalle.cantidad;
      return acc + (precioSinIGV + igvDetalle) * detalle.cantidad;
    }, 0).toFixed(2),
    descuento_venta: parseFloat(
      detalles.reduce((acc, detalle) => 
        acc + (parseFloat(detalle.precio) * parseFloat(detalle.descuento) / 100) * detalle.cantidad, 0
      ).toFixed(2)
    ),
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

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");

  // Funciones para manejo de clientes
  const handleValidate = async () => {
    // Aquí iría la lógica de validación de DNI/RUC
    // Por ahora simularemos la validación
    if (clienteData.dniOrRuc) {
      setClienteData(prev => ({
        ...prev,
        nombreCliente: 'Cliente Validado',
        direccionCliente: 'Dirección Validada'
      }));
      toast.success('Cliente validado correctamente');
    } else {
      toast.error('Ingrese un DNI/RUC válido');
    }
  };

  const handleGuardarClientes = () => {
    if (clienteData.nombreCliente && clienteData.dniOrRuc) {
      // Aquí iría la lógica para guardar el cliente
      addCliente({
        nombre: clienteData.nombreCliente,
        documento: clienteData.dniOrRuc,
        direccion: clienteData.direccionCliente,
        tipo: clienteData.tipo_cliente
      });
      setShowNuevoCliente(false);
      toast.success('Cliente guardado correctamente');
    } else {
      toast.error('Complete todos los campos requeridos');
    }
  };

  // Check if amount is greater than 499 and go to step 2
  const Comprobar_mayor_499 = () => {
    // Calcular el total exacto sin redondear para validación más precisa
    const totalExacto = parseFloat(totalImporte) + parseFloat(igv_t);
    
    if (totalExacto > 499) {
      toast.error(`La venta no puede tener un monto mayor a 499 soles. Total actual: S/ ${totalExacto.toFixed(2)}`);
    } else {
      if (totalExacto <= 0) {
        toast.error('No hay productos en la venta');
      } else {
        setCurrentStep(2); // Cambiar al paso 2 (Comprobante)
      }
    }
  };

  // Función para validar entrada decimal
  const validateDecimalInput = (e) => {
    const { key } = e;
    const value = e.target.value;
    
    // Permitir teclas de control
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }
    
    // Permitir punto decimal solo si no existe uno ya
    if (key === '.' && !value.includes('.')) {
      return;
    }
    
    // Solo permitir números
    if (!/^\d$/.test(key)) {
      e.preventDefault();
    }
  };

  // Navegación entre pasos
  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Obtener el título del paso actual
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Resumen de venta';
      case 2: return 'Comprobante y pago';
      case 4: return 'Confirmación';
      default: return 'Resumen de venta';
    }
  };

    // Obtener el número de comprobante cuando se llega al paso de confirmación (antes de registrar la venta)
  useEffect(() => {
    if (currentStep === 4 && !nuevoNumComprobante) {
      (async () => {
        try {
          const num = await generateComprobanteNumber(selectedDocumentType, nombre);
          setNuevoNumComprobante(num);
        } catch (e) {
          toast.error('No se pudo obtener el número de comprobante');
        }
      })();
    }
    // Limpiar el comprobante si se regresa a pasos anteriores
    if (currentStep < 4 && nuevoNumComprobante) {
      setNuevoNumComprobante(null);
    }
  }, [currentStep, selectedDocumentType, nombre]);
  

  // Imprimir ticket térmico 72mm x 297mm usando el Voucher
 const handlePrintThermal = async (datosVenta, observacionTexto, printMode = 'window') => {
  try {
    const empresaData = await getEmpresaDataByUser(nombre);

    const observacion = { observacion: observacionTexto || '' };
    // Obtener el número de comprobante usando el hook
    const comprobante1 = { nuevoNumComprobante };

    // Contenido del voucher (texto monoespaciado)
    const content = await generateReceiptContent(
      datosVentaComprobante,
      datosVenta,
      comprobante1,
      observacion,
      nombre,
      empresaData
    );

    const imgUrl = empresaData?.logotipo || '';
    const qrText = 'https://www.facebook.com/profile.php?id=100055385846115';

    if (printMode === 'pdf') {
      // Descargar PDF térmico 72mm x 297mm
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [75, 284] });
      QRCode.toDataURL(qrText, { width: 100, height: 100 }, (err, qrUrl) => {
        if (!err) {
          if (imgUrl) {
            // Nota: jsPDF requiere base64/DataURL para addImage. Si tu logo es URL, asegúrate que sea dataURL.
            try { doc.addImage(imgUrl, 'JPEG', 10, 10, 50, 50); } catch {}
          }
          doc.setFont('Courier');
          doc.setFontSize(8);
          doc.text(content, 3, 55); // texto del voucher
          try { doc.addImage(qrUrl, 'PNG', 16, 230, 43, 43); } catch {}
          doc.save('recibo.pdf');
        }
      });
    } else {
      // Imprimir directamente en ventana con CSS de 72mm x 297mm
      const printWindow = window.open('', '', 'height=600,width=800');
      if (!printWindow) return;

      QRCode.toDataURL(qrText, { width: 100, height: 100 }, (err, qrUrl) => {
        if (!err) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Recibo</title>
                <style>
                  @page { size: 72mm 297mm; margin: 10px; }
                  body { margin: 0; padding: 0; font-family: Courier, monospace; font-size: 10pt; width: 100%; }
                  pre { margin: 0; font-size: 10pt; white-space: pre-wrap; }
                  .center { text-align: center; }
                  .qr { display: block; margin: 10px auto; }
                  .image-container { display: flex; justify-content: center; }
                </style>
              </head>
              <body>
                <div class="image-container">
                  ${imgUrl ? `<img src="${imgUrl}" alt="Logo" style="width: 140px; height: 140px;" />` : ''}
                </div>
                <pre>${content}</pre>
                <div class="image-container">
                  <img src="${qrUrl}" alt="QR Code" class="qr" style="width: 80px; height: 80px;" />
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      });
    }
  } catch (e) {
    console.error('Error al imprimir ticket térmico:', e);
    toast.error('No se pudo imprimir el ticket');
  }
};

  return (
    <>
      <Toaster />
      
      <div className="flex justify-between mb-2">
        <h1 className="text-xl font-bold mb-2 text-[36px]">Registrar venta</h1>
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Card de productos - siempre visible */}
      <Card className="lg:col-span-3 h-[600px]">
        <CardHeader className="flex flex-col items-start gap-2">
          <h2 className='text-lg font-bold'>Productos existentes</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <ScrollShadow 
            className="relative" 
            hideScrollBar
            size={15}
            isEnabled={true}
          >
            <div className={currentStep > 1 ? "pointer-events-none opacity-60" : ""}>
            <ProductSearchSection
              searchTerm={searchTerm}
              handleSearchChange={handleSearchChange}
              handleClearSearch={handleClearSearch}
              selectedMarca={selectedMarca}
              setSelectedMarca={setSelectedMarca}
              marcasUnicas={marcasUnicas}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              filteredProductos={filteredProductos}
              handleProductSelect={handleProductSelect}
            />
          </div>
          {currentStep > 1 && (
            <div className="absolute inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
                <p className="text-sm text-gray-600 font-medium">
                  Productos bloqueados en este paso
                </p>
              </div>
              </div>
            )}
          </ScrollShadow>
        </CardBody>
      </Card>

      {/* Card principal - ocupa 2 columnas */}
      <Card className="lg:col-span-2 h-[600px]">
        <CardHeader className="flex flex-col items-start gap-2">
          <div className='flex justify-between items-center w-full'>
            <h2 className='text-lg font-bold'>
              {getStepTitle()}
            </h2>  
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button
                  size="sm"
                  variant="flat"
                  onClick={() => {
                    if (currentStep === 4) {
                      setCurrentStep(2); // Desde confirmación volver a comprobante
                    } else {
                      setCurrentStep(currentStep - 1); // Navegación normal
                    }
                  }}
                  disabled={currentStep === 4 && navigationBlocked}
                  className="text-xs text-white font-bold "
                  style={{ backgroundColor: navigationBlocked && currentStep === 4 ? '#a1a1aa' : '#006FEE'}}
                >
                  ← Volver
                </Button>
              )}
              <Chip color='secondary'>
                Paso {currentStep === 4 ? '3' : currentStep} de 3
              </Chip>
            </div>
          </div> 
        </CardHeader>
      <Divider />

      <CardBody>
        <ScrollShadow 
          className=""
          hideScrollBar
          size={15}
          isEnabled={true}
        >
          {currentStep === 1 ? (
          <SalesStep1
            detalles={detalles}
            handleRemoveAllProducts={handleRemoveAllProducts}
            handleProductRemove={handleProductRemove}
            handleIncrement={handleIncrement}
            handleDecrement={handleDecrement}
            handleQuantityChange={handleQuantityChange}
            handlePriceChange={handlePriceChange}
            totalImporte={totalImporte}
            igv_t={igv_t}
            total_t={total_t}
            handlePrint={handlePrint}
            Comprobar_mayor_499={Comprobar_mayor_499}
            productos={productos}
            handleProductSelect={handleProductSelect}
          />
        ) : currentStep === 2 ? (
          <SalesStep2
            selectedDocumentType={selectedDocumentType}
            setSelectedDocumentType={setSelectedDocumentType}
            clienteData={clienteData}
            setClienteData={setClienteData}
            clientes={clientes}
            showNuevoCliente={showNuevoCliente}
            setShowNuevoCliente={setShowNuevoCliente}
            handleValidate={handleValidate}
            handleGuardarClientes={handleGuardarClientes}
            goToNextStep={() => setCurrentStep(4)} // Saltar directo al paso 4
            // Props del pago
            total_t={total_t}
            paymentData={paymentData}
            setPaymentData={setPaymentData}
            validateDecimalInput={validateDecimalInput}
          />
        ) : currentStep === 3 ? (
          // Paso 3 ya no se usa, pero mantenemos por compatibilidad
          <SalesStep3
            total_t={total_t}
            paymentData={paymentData}
            setPaymentData={setPaymentData}
            selectedDocumentType={selectedDocumentType}
            validateDecimalInput={validateDecimalInput}
            goToNextStep={goToNextStep}
          />
        ) : (
            <SalesStep4Preview
              cobrarState={{
                comprobante_pago: selectedDocumentType,
                serie: '001',
                nu: '001',
                metodo_pago: paymentData.metodoPago,
                montoRecibido: paymentData.montoRecibido
              }}
              detalles={detalles}
              total_t={total_t}
              setCurrentStep={setCurrentStep}
              selectedDocumentType={selectedDocumentType}
              clienteData={clienteData}
              paymentData={paymentData}
              productos={productos}
              nombre={nombre}
              onResetVenta={resetVentaData}
              onBlockNavigation={(shouldBlock) => setNavigationBlocked(shouldBlock)}
              handleRemoveAllProducts={actualizarStockDespuesVenta}
              onPrintThermal={(datosVenta, observacion) => handlePrintThermal(datosVenta, observacion)} // <-- nuevo
            />
        )}

        

        {/* Componente oculto para impresión */}
          <div style={{ display: 'none' }}>
            <Comprobante ref={componentRef} datosVentaComprobante={datosVentaComprobante} />
          </div>
        </ScrollShadow>
      </CardBody>
      </Card>
    </div>

    {/* Modal de alerta para stock insuficiente */}
    {showAlert && (
      <AlertModal
        message="Stock insuficiente"
        onClose={() => setShowAlert(false)}
      />
    )}
    </>
  );
};

Registro_Venta.propTypes = {
  clienteSeleccionado: PropTypes.string.isRequired,
};

Registro_Venta.defaultProps = {
  clienteSeleccionado: '',
};

export default Registro_Venta;
