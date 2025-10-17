import React from 'react';
import { Button, Tabs, Tab, Select, SelectItem, Input, Switch, Divider, Autocomplete, AutocompleteItem } from '@heroui/react';
import AddClientModal from '../../../Clientes/ComponentsClientes/AddClient';
import { FaPlus } from 'react-icons/fa';
import { ActionButton } from "@/components/Buttons/Buttons";

const SalesStep2 = ({
  selectedDocumentType,
  setSelectedDocumentType,
  clienteData,
  setClienteData,
  clientes,
  showNuevoCliente,
  setShowNuevoCliente,
  goToNextStep,
  // Props del pago
  total_t,
  paymentData,
  setPaymentData,
  validateDecimalInput
}) => {
  // Estado para controlar cuándo mostrar las validaciones
  const [showValidations, setShowValidations] = React.useState(false);
  
  // Estado para controlar si el select de método de pago debe abrirse
  const [shouldOpenPaymentSelect, setShouldOpenPaymentSelect] = React.useState(false);
  
  // Estado para controlar si el select de segundo método de pago debe abrirse
  const [shouldOpenSecondPaymentSelect, setShouldOpenSecondPaymentSelect] = React.useState(false);
  
  // Estado para controlar si el select de tercer método de pago debe abrirse
  const [shouldOpenThirdPaymentSelect, setShouldOpenThirdPaymentSelect] = React.useState(false);
  
  const paymentSectionRef = React.useRef(null);
  const amountSectionRef = React.useRef(null);
  const secondPaymentRef = React.useRef(null);
  const thirdPaymentRef = React.useRef(null);
  const paymentSelectRef = React.useRef(null);
  const clienteAutocompleteRef = React.useRef(null);

  // Función para scroll suave
  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };
  
  // Estados de error para cada campo
  const [errors, setErrors] = React.useState({
    cliente: false,
    metodoPago: false,
    montoRecibido: false,
    tipoDescuento: false,
    montoDescuento: false,
    metodoPago2: false,
    montoAdicional: false,
    metodoPago3: false,
    montoAdicional2: false
  });
  
  // Opciones de métodos de pago
  const paymentOptions = [
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

  // Lógica para deshabilitar opciones según el tipo de comprobante
  const getDisabledKeys = (excludeMethod = '', excludeMethod2 = '') => {
    if (selectedDocumentType !== 'Nota de venta') {
      return paymentOptions.filter(({ value }) => 
        value === excludeMethod || value === excludeMethod2
      ).map(({ key }) => key);
    } else {
      // Para Nota de venta solo permitir EFECTIVO
      return paymentOptions.filter(({ value }) => value !== 'EFECTIVO').map(({ key }) => key);
    }
  };

  const disabledKeys1 = getDisabledKeys(paymentData.metodoPago2, paymentData.metodoPago3);
  const disabledKeys2 = getDisabledKeys(paymentData.metodoPago, paymentData.metodoPago3);

  // Cálculos de pago con descuento
  const descuentoCalculado = parseFloat(paymentData.descuentoCalculado || 0);
  const totalConDescuento = paymentData.descuentoActivado ? total_t - descuentoCalculado : total_t;
  const montoRecibido = parseFloat(paymentData.montoRecibido || 0);
  
  // Cálculos para pagos adicionales
  const montoAdicional = parseFloat(paymentData.montoAdicional || 0);
  const montoAdicional2 = parseFloat(paymentData.montoAdicional2 || 0);
  
  // Calcular el total pagado (suma de todos los pagos)
  const totalPagado = montoRecibido + montoAdicional + montoAdicional2;
  const faltanteFinal = Math.max(totalConDescuento - totalPagado, 0);
  const cambioFinal = Math.max(totalPagado - totalConDescuento, 0);
  
  // Para mostrar cuándo activar el segundo y tercer pago
  const necesitaSegundoPago = montoRecibido > 0 && montoRecibido < totalConDescuento;
  const necesitaTercerPago = necesitaSegundoPago && montoAdicional > 0 && (montoRecibido + montoAdicional) < totalConDescuento;

  // Actualizar payment data
  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => {
      const newData = {
        ...prev,
        [field]: value,
        total: total_t,
        vuelto: Math.max((parseFloat(value) || 0) - total_t, 0)
      };

      // Limpiar montos cuando se cambia el método de pago
      if (field === 'metodoPago2' && value === '') {
        newData.montoAdicional = '';
      }
      if (field === 'metodoPago3' && value === '') {
        newData.montoAdicional2 = '';
      }

      return newData;
    });

    // Limpiar errores cuando se llena el campo
    if (showValidations) {
      setErrors(prev => {
        const newErrors = { ...prev };
        
        const fieldValidations = {
          metodoPago: () => value,
          montoRecibido: () => value && parseFloat(value) > 0,
          tipoDescuento: () => value,
          montoDescuento: () => value,
          porcentajeDescuento: () => value,
          metodoPago2: () => value,
          montoAdicional: () => value && parseFloat(value) > 0,
          metodoPago3: () => value,
          montoAdicional2: () => value && parseFloat(value) > 0
        };

        const fieldErrorMapping = {
          montoDescuento: 'descuento',
          porcentajeDescuento: 'descuento'
        };

        // Validar y limpiar errores
        const validation = fieldValidations[field];
        if (validation && validation()) {
          const errorKey = fieldErrorMapping[field] || field;
          newErrors[errorKey] = false;
        }
        
        return newErrors;
      });
    }
  };

  const autoCompleteAmount = (field) => {
    const montoRecibido = parseFloat(paymentData.montoRecibido || 0);
    const montoAdicional = parseFloat(paymentData.montoAdicional || 0);
    
    let faltante = 0;
    
    if (field === 'montoAdicional') {
      // Para el segundo pago, calcular lo que falta después del primer pago
      faltante = Math.max(totalConDescuento - montoRecibido, 0);
    } else if (field === 'montoAdicional2') {
      // Para el tercer pago, calcular lo que falta después del primer y segundo pago
      faltante = Math.max(totalConDescuento - montoRecibido - montoAdicional, 0);
    }
    
    if (faltante > 0) {
      handlePaymentChange(field, faltante.toFixed(2));
    }
  };

  React.useEffect(() => {
    if (paymentData.metodoPago2 && necesitaSegundoPago) {
      autoCompleteAmount('montoAdicional');
    }
  }, [paymentData.metodoPago2, necesitaSegundoPago, totalConDescuento, paymentData.montoRecibido]);

  React.useEffect(() => {
    if (paymentData.metodoPago3 && necesitaTercerPago) {
      autoCompleteAmount('montoAdicional2');
    }
  }, [paymentData.metodoPago3, necesitaTercerPago, totalConDescuento, paymentData.montoRecibido, paymentData.montoAdicional]);

  // Scroll automático cuando se necesita segundo pago
  React.useEffect(() => {
    if (necesitaSegundoPago && !paymentData.metodoPago2) {
      setTimeout(() => {
        scrollToSection(secondPaymentRef);
        // Abrir automáticamente el menú del segundo método de pago
        setTimeout(() => {
          setShouldOpenSecondPaymentSelect(true);
        }, 400);
      }, 500);
    }
  }, [necesitaSegundoPago]);

  // Scroll automático cuando se necesita tercer pago
  React.useEffect(() => {
    if (necesitaTercerPago && !paymentData.metodoPago3) {
      setTimeout(() => {
        scrollToSection(thirdPaymentRef);
        // Abrir automáticamente el menú del tercer método de pago
        setTimeout(() => {
          setShouldOpenThirdPaymentSelect(true);
        }, 400);
      }, 500);
    }
  }, [necesitaTercerPago]);

  // Limpiar montos cuando ya no se necesiten pagos adicionales
  React.useEffect(() => {
    if (!necesitaSegundoPago && paymentData.montoAdicional) {
      handlePaymentChange('montoAdicional', '');
    }
  }, [necesitaSegundoPago]);

  React.useEffect(() => {
    if (!necesitaTercerPago && paymentData.montoAdicional2) {
      handlePaymentChange('montoAdicional2', '');
    }
  }, [necesitaTercerPago]);

  React.useEffect(() => {
    if (selectedDocumentType === 'Nota de venta') {
      // Limpiar métodos adicionales para nota de venta
      handlePaymentChange('metodoPago2', '');
      handlePaymentChange('metodoPago3', '');
      handlePaymentChange('montoAdicional', '');
      handlePaymentChange('montoAdicional2', '');
      // Forzar EFECTIVO como método principal
      if (paymentData.metodoPago !== 'EFECTIVO') {
        handlePaymentChange('metodoPago', 'EFECTIVO');
      }
      // Poner el monto recibido igual al total a pagar
      if (paymentData.montoRecibido !== totalConDescuento.toFixed(2)) {
        handlePaymentChange('montoRecibido', totalConDescuento.toFixed(2));
      }
    }
  }, [selectedDocumentType, paymentData.metodoPago, totalConDescuento]);

  // Función para manejar el intento de continuar
  const handleContinueClick = () => {
    setShowValidations(true);

    // Validar campos y establecer errores
    const newErrors = {
      cliente: selectedDocumentType !== 'Nota de venta' && !clienteData.nombreCliente,
      metodoPago: !paymentData.metodoPago,
      montoRecibido: !paymentData.montoRecibido || parseFloat(paymentData.montoRecibido) <= 0,
      tipoDescuento: paymentData.descuentoActivado && !paymentData.tipoDescuento,
      montoDescuento: paymentData.descuentoActivado && (!paymentData.montoDescuento && !paymentData.porcentajeDescuento),
      metodoPago2: necesitaSegundoPago && !paymentData.metodoPago2,
      montoAdicional: necesitaSegundoPago && paymentData.metodoPago2 && (!paymentData.montoAdicional || parseFloat(paymentData.montoAdicional) <= 0),
      metodoPago3: necesitaTercerPago && !paymentData.metodoPago3,
      montoAdicional2: necesitaTercerPago && paymentData.metodoPago3 && (!paymentData.montoAdicional2 || parseFloat(paymentData.montoAdicional2) <= 0)
    };

    setErrors(newErrors);

    // Verificar si hay errores
    const hasErrors = Object.values(newErrors).some(error => error) || faltanteFinal > 0;

    // Validar todos los campos antes de continuar
    if (!hasErrors &&
      paymentData.metodoPago &&
      paymentData.montoRecibido &&
      parseFloat(paymentData.montoRecibido) > 0
    ) {
      goToNextStep();
    }
  };

  return (
    <div className="space-y-4">
      {/* Tipo de comprobante */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 text-lg">Selecciona el tipo de comprobante:</h4>
        <Tabs 
          selectedKey={selectedDocumentType}
          color='primary'
          onSelectionChange={setSelectedDocumentType}
          classNames={{
            tabList: "w-full",
            tab: "flex-1",
          }}
        >
          <Tab key="Boleta" title="Boleta" />
          <Tab key="Factura" title="Factura" />
          <Tab key="Nota de venta" title="Nota de venta" />
        </Tabs>
      </div>

      {/* Información del cliente */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 text-lg">Cliente:</h4>
        
        <div className="flex gap-3 items-start">
          <div className="w-80">
            <Autocomplete
              ref={clienteAutocompleteRef}
              placeholder="Buscar cliente..."
              selectedKey={clienteData.clienteSeleccionado || null}
              onSelectionChange={(key) => {
                if (key) {
                  const cliente = clientes.find(c => String(c.id) === String(key));
                  if (cliente) {
                    setClienteData(prev => ({
                      ...prev,
                      clienteSeleccionado: String(key),
                      nombreCliente: cliente.nombre,
                      dniOrRuc: cliente.documento,
                      direccionCliente: cliente.direccion || '',
                      tipo_cliente: cliente.tipo || 'Natural'
                    }));
                    
                    // Limpiar error de cliente cuando se selecciona uno
                    if (showValidations) {
                      setErrors(prev => ({
                        ...prev,
                        cliente: false
                      }));
                    }

                    // Scroll automático al método de pago después de seleccionar cliente
                    setTimeout(() => {
                      // Desenfocar el autocomplete del cliente
                      if (clienteAutocompleteRef.current) {
                        clienteAutocompleteRef.current.blur();
                      }
                      // Hacer scroll
                      scrollToSection(paymentSectionRef);
                      // Abrir automáticamente el menú de método de pago
                      setTimeout(() => {
                        setShouldOpenPaymentSelect(true);
                      }, 400);
                    }, 300);
                  }
                } else {
                  // Limpiar selección si no hay cliente
                  setClienteData(prev => ({
                    ...prev,
                    clienteSeleccionado: '',
                    nombreCliente: '',
                    dniOrRuc: '',
                    direccionCliente: '',
                    tipo_cliente: 'Natural'
                  }));
                  
                  // Activar error de cliente si se limpia la selección
                  if (showValidations && selectedDocumentType !== 'Nota de venta') {
                    setErrors(prev => ({
                      ...prev,
                      cliente: true
                    }));
                  }
                }
              }}
              className="w-full"
              variant="flat"
              isClearable
              isInvalid={showValidations && errors.cliente}
              errorMessage={showValidations && errors.cliente ? "Cliente es requerido" : ""}
              listboxProps={{
                emptyContent: "No se encontraron resultados"
              }}
            >
              {clientes.map((cliente) => (
                <AutocompleteItem 
                  key={String(cliente.id)} 
                  value={String(cliente.id)}
                  description={cliente.documento}
                >
                  {cliente.nombre}
                </AutocompleteItem>
              ))}
            </Autocomplete>
          </div>
          
          <ActionButton
            color="blue"
            icon={<FaPlus className="w-4 h-4 text-blue-500" />}
            onClick={() => setShowNuevoCliente(true)}
            size="sm"
            className="h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200"
            style={{ boxShadow: "none", border: "none" }}
          >
            Agregar cliente
          </ActionButton>
          
          
        </div>
      </div>

      <Divider />

      {/* Información de pago en dos columnas */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 text-lg">Información de pago</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna 1: Método de pago y monto */}
          <div className="space-y-4">
            <div ref={paymentSectionRef} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-gray-700">Método de pago</h5>
              <Select
                ref={paymentSelectRef}
                placeholder="Seleccionar método de pago"
                selectedKeys={paymentData.metodoPago ? new Set([paymentData.metodoPago]) : new Set()}
                isOpen={shouldOpenPaymentSelect}
                onOpenChange={(isOpen) => {
                  setShouldOpenPaymentSelect(isOpen);
                }}
                onSelectionChange={(keys) => {
                  const selectedMethod = Array.from(keys)[0] || '';
                  handlePaymentChange('metodoPago', selectedMethod);
                  
                  // Autocompletar monto si no es EFECTIVO
                  if (selectedMethod && selectedMethod !== 'EFECTIVO') {
                    handlePaymentChange('montoRecibido', totalConDescuento.toFixed(2));
                  }
                  
                  // Cerrar el menú después de seleccionar
                  setShouldOpenPaymentSelect(false);
                  
                  // Scroll automático al monto recibido cuando se selecciona método de pago
                  if (selectedMethod) {
                    setTimeout(() => {
                      scrollToSection(amountSectionRef);
                    }, 300);
                  }
                }}
                className="w-full"
                disabledKeys={disabledKeys1}
                isInvalid={showValidations && errors.metodoPago}
                errorMessage={showValidations && errors.metodoPago ? "Método de pago es requerido" : ""}
              >
                {paymentOptions.map(({ key, value, label }) => (
                  <SelectItem key={key} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div ref={amountSectionRef} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-gray-700">Monto recibido</h5>
              <Input
                placeholder="0.00"
                value={paymentData.montoRecibido || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Solo permitir números positivos
                  if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                    handlePaymentChange('montoRecibido', value);
                  }
                }}
                onKeyDown={validateDecimalInput}
                onWheel={(e) => e.target.blur()} // Desactivar scroll del mouse
                className="w-full"
                startContent={<span>S/</span>}
                type="number"
                step="0.01"
                min="0"
                disabled={!paymentData.metodoPago}
                isInvalid={showValidations && errors.montoRecibido}
                errorMessage={showValidations && errors.montoRecibido ? "Monto recibido es requerido" : ""}
                classNames={{
                  input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield"
                }}
              />
              
            </div>

            {/* Card de descuento */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-700">Descuento</h5>
                <Switch
                  isSelected={paymentData.descuentoActivado || false}
                  onValueChange={(checked) => handlePaymentChange('descuentoActivado', checked)}
                  size="sm"
                />
              </div>

              {paymentData.descuentoActivado && (
                <div className="space-y-3">
                  {/* Selector de tipo de descuento */}
                  <Select
                    placeholder="Tipo de descuento"
                    selectedKeys={paymentData.tipoDescuento ? new Set([paymentData.tipoDescuento]) : new Set(['monto'])}
                    onSelectionChange={(keys) => {
                      const tipoSeleccionado = Array.from(keys)[0] || 'monto';
                      handlePaymentChange('tipoDescuento', tipoSeleccionado);
                      // Limpiar valores al cambiar tipo
                      handlePaymentChange('montoDescuento', '');
                      handlePaymentChange('porcentajeDescuento', '');
                      handlePaymentChange('descuentoCalculado', '0');
                    }}
                    className="w-full"
                    size="sm"
                    isInvalid={showValidations && paymentData.descuentoActivado && errors.tipoDescuento}
                    errorMessage={showValidations && paymentData.descuentoActivado && errors.tipoDescuento ? "Tipo de descuento es requerido" : ""}
                  >
                    <SelectItem key="monto" value="monto">Monto fijo</SelectItem>
                    <SelectItem key="porcentaje" value="porcentaje">Porcentaje</SelectItem>
                  </Select>

                  {/* Input de descuento */}
                  <div className="space-y-2">
                    <Input
                      placeholder={paymentData.tipoDescuento === 'porcentaje' ? '0.00' : '0.00'}
                      value={paymentData.tipoDescuento === 'porcentaje' ? 
                        (paymentData.porcentajeDescuento || '') : 
                        (paymentData.montoDescuento || '')
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        
                        if (paymentData.tipoDescuento === 'porcentaje') {
                          // Permitir valores vacíos, números válidos y edición temporal
                          if (value === '' || value === '0' || /^\d*\.?\d*$/.test(value)) {
                            const numericValue = parseFloat(value) || 0;
                            
                            // Solo validar límites si hay un valor numérico válido
                            if (value === '' || (numericValue >= 0 && numericValue <= 100)) {
                              // Calcular descuento en monto
                              const descuentoCalculado = value === '' || value === '0' ? 0 : (total_t * numericValue) / 100;
                              handlePaymentChange('porcentajeDescuento', value);
                              handlePaymentChange('descuentoCalculado', descuentoCalculado.toString());
                            }
                          }
                        } else {
                          // Permitir valores vacíos, números válidos y edición temporal
                          if (value === '' || value === '0' || /^\d*\.?\d*$/.test(value)) {
                            const numericValue = parseFloat(value) || 0;
                            
                            // Solo validar límites si hay un valor numérico válido
                            if (value === '' || (numericValue >= 0 && numericValue <= total_t)) {
                              handlePaymentChange('montoDescuento', value);
                              handlePaymentChange('descuentoCalculado', value === '' ? '0' : value);
                            }
                          }
                        }
                      }}
                      onKeyDown={validateDecimalInput}
                      onWheel={(e) => e.target.blur()} // Desactivar scroll del mouse
                      startContent={
                        <span>{paymentData.tipoDescuento === 'porcentaje' ? '%' : 'S/'}</span>
                      }
                      type="number"
                      step="0.01"
                      min="0"
                      isInvalid={showValidations && paymentData.descuentoActivado && errors.descuento}
                      errorMessage={showValidations && paymentData.descuentoActivado && errors.descuento ? "Descuento es requerido" : ""}
                      max={paymentData.tipoDescuento === 'porcentaje' ? 100 : total_t}
                      className="w-full"
                      disabled={!paymentData.descuentoActivado}
                      style={{  
                        border: "none",
                        boxShadow: "none",
                        outline: "none"
                      }}
                      classNames={{
                        input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield"
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      {paymentData.tipoDescuento === 'porcentaje' ? 
                        'Máximo: 100%' : 
                        `Máximo: S/ ${total_t.toFixed(2)}`
                      }
                    </p>
                    {paymentData.tipoDescuento === 'porcentaje' && paymentData.porcentajeDescuento && (
                      <p className="text-xs text-blue-600 font-medium">
                        Descuento: S/ {((total_t * parseFloat(paymentData.porcentajeDescuento || 0)) / 100).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {necesitaTercerPago && selectedDocumentType !== 'Nota de venta' && (
              <div ref={thirdPaymentRef} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <h5 className="font-medium text-yellow-800">Tercer método de pago</h5>
                <Select
                  label="Tercer método"
                  placeholder="Método adicional"
                  selectedKeys={paymentData.metodoPago3 ? new Set([paymentData.metodoPago3]) : new Set()}
                  isOpen={shouldOpenThirdPaymentSelect}
                  onOpenChange={(isOpen) => {
                    setShouldOpenThirdPaymentSelect(isOpen);
                  }}
                  onSelectionChange={(keys) => {
                    const selectedMethod = Array.from(keys)[0] || '';
                    handlePaymentChange('metodoPago3', selectedMethod);
                    
                    // Cerrar el menú después de seleccionar
                    setShouldOpenThirdPaymentSelect(false);
                  }}
                  className="w-full"
                  disabledKeys={[...new Set([...disabledKeys2, paymentData.metodoPago, paymentData.metodoPago2].filter(Boolean))]}
                  isInvalid={showValidations && errors.metodoPago3}
                  errorMessage={showValidations && errors.metodoPago3 ? "Tercer método de pago es requerido" : ""}
                >
                  {paymentOptions.filter(option => 
                    option.key !== paymentData.metodoPago && 
                    option.key !== paymentData.metodoPago2
                  ).map(({ key, value, label }) => (
                    <SelectItem key={key} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  placeholder="0.00"
                  value={paymentData.montoAdicional2 || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Solo permitir números positivos
                    if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                      handlePaymentChange('montoAdicional2', value);
                    }
                  }}
                  onKeyDown={validateDecimalInput}
                  onWheel={(e) => e.target.blur()} // Desactivar scroll del mouse
                  className="w-full"
                  startContent={<span>S/</span>}
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!paymentData.metodoPago3}
                  isInvalid={showValidations && errors.montoAdicional2}
                  errorMessage={showValidations && errors.montoAdicional2 ? "Monto adicional es requerido" : ""}
                  style={{  
                    border: "none",
                    boxShadow: "none",
                    outline: "none"
                  }}
                  classNames={{
                    input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield"
                  }}
                />
         
              </div>
            )}
          </div>

          {/* Columna 2: Cálculos y pago adicional */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-700 mb-3">Cálculos</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">S/ {total_t.toFixed(2)}</span>
                </div>
                {paymentData.descuentoActivado && descuentoCalculado > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Descuento:</span>
                    <span className="font-medium">- S/ {descuentoCalculado.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Total a pagar:</span>
                  <span className="font-bold text-green-600">S/ {totalConDescuento.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cambio:</span>
                  <span className="font-medium text-blue-600">S/ {cambioFinal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total pagado:</span>
                  <span className="font-medium text-green-600">S/ {totalPagado.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Faltante:</span>
                  <span className={`font-medium ${faltanteFinal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    S/ {faltanteFinal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {necesitaSegundoPago && selectedDocumentType !== 'Nota de venta' && (
              <div ref={secondPaymentRef} className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                <h5 className="font-medium text-orange-800">Pago adicional</h5>
                <Select
                  label="Segundo método"
                  placeholder="Método adicional"
                  selectedKeys={paymentData.metodoPago2 ? new Set([paymentData.metodoPago2]) : new Set()}
                  isOpen={shouldOpenSecondPaymentSelect}
                  onOpenChange={(isOpen) => {
                    setShouldOpenSecondPaymentSelect(isOpen);
                  }}
                  onSelectionChange={(keys) => {
                    const selectedMethod = Array.from(keys)[0] || '';
                    handlePaymentChange('metodoPago2', selectedMethod);
                    
                    // Cerrar el menú después de seleccionar
                    setShouldOpenSecondPaymentSelect(false);
                    
                    // Scroll automático al tercer pago si es necesario
                    if (selectedMethod && necesitaTercerPago) {
                      setTimeout(() => {
                        scrollToSection(thirdPaymentRef);
                      }, 800);
                    }
                  }}
                  className="w-full"
                  disabledKeys={disabledKeys2}
                  isInvalid={showValidations && errors.metodoPago2}
                  errorMessage={showValidations && errors.metodoPago2 ? "Segundo método de pago es requerido" : ""}
                >
                  {paymentOptions.filter(option => option.key !== paymentData.metodoPago).map(({ key, value, label }) => (
                    <SelectItem key={key} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  placeholder="0.00"
                  value={paymentData.montoAdicional || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Solo permitir números positivos
                    if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                      handlePaymentChange('montoAdicional', value);
                    }
                  }}
                  onKeyDown={validateDecimalInput}
                  onWheel={(e) => e.target.blur()} // Desactivar scroll del mouse
                  className="w-full"
                  startContent={<span>S/</span>}
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!paymentData.metodoPago2}
                  isInvalid={showValidations && errors.montoAdicional}
                  errorMessage={showValidations && errors.montoAdicional ? "Monto adicional es requerido" : ""}
                  style={{  
                    border: "none",
                    boxShadow: "none",
                    outline: "none"
                  }}
                  classNames={{
                    input: "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield"
                  }}
                />
               
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para agregar nuevo cliente */}
      <AddClientModal
        open={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        onClientCreated={() => {
          // Aquí puedes agregar lógica para refrescar la lista de clientes
          setShowNuevoCliente(false);
        }}
        refetch={async () => {
          // Aquí puedes agregar lógica para refrescar la lista de clientes
          // console.log('Cliente agregado, refrescando lista...');
        }}
      />

    {/* Botón continuar */}
    <div className="flex flex-col items-center space-y-2 pt-6">
      <ActionButton
        color="blue"
        icon={null}
        onClick={handleContinueClick}
        size="lg"
        className="w-full xl:w-96 text-blue-700 font-semibold py-3 bg-blue-50 hover:bg-blue-100 rounded-xl border-0 shadow-none transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200"
        style={{ backgroundColor: undefined, boxShadow: "none", border: "none" }}
      >
        {faltanteFinal > 0
          ? 'Continuar' 
          : 'Revisar y confirmar venta'
        }
      </ActionButton>
      
      {/* Información de validación */}
      
    </div>
  </div>
  );
};

export default SalesStep2;
