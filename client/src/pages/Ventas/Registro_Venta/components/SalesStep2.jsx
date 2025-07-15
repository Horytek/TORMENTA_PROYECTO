import React from 'react';
import { Button, Tabs, Tab, Select, SelectItem, Input, Switch, Divider } from '@heroui/react';
import AddClientModal from '../../../Clientes/ComponentsClientes/AddClient';
import { FaPlus } from 'react-icons/fa';

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
  const cambio = Math.max(montoRecibido - totalConDescuento, 0);
  const faltante = Math.max(totalConDescuento - montoRecibido, 0);
  
  // Cálculos para pagos adicionales
  const montoAdicional = parseFloat(paymentData.montoAdicional || 0);
  const faltante2 = Math.max(faltante - montoAdicional, 0);
  
  const montoAdicional2 = parseFloat(paymentData.montoAdicional2 || 0);
  const faltante3 = Math.max(faltante2 - montoAdicional2, 0);

  // Actualizar payment data
  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value,
      total: total_t,
      vuelto: Math.max((parseFloat(value) || 0) - total_t, 0)
    }));
  };

  // Efecto para limpiar datos cuando se cambia el tipo de comprobante
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
    }
  }, [selectedDocumentType, paymentData.metodoPago]);

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
            <Select
              placeholder="Seleccionar cliente"
              selectedKeys={clienteData.clienteSeleccionado ? new Set([clienteData.clienteSeleccionado]) : new Set()}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0];
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
                }
              }}
              renderValue={(items) => {
                return items.map((item) => {
                  const cliente = clientes.find(c => String(c.id) === item.key);
                  return cliente ? `${cliente.nombre} - ${cliente.documento}` : '';
                }).join(', ');
              }}
              className="w-full"
              variant="bordered"
            >
              {clientes.map((cliente) => (
                <SelectItem key={String(cliente.id)} value={String(cliente.id)}>
                  {cliente.nombre} - {cliente.documento}
                </SelectItem>
              ))}
            </Select>
          </div>
          
          <Button
            color="primary"
            startContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={() => setShowNuevoCliente(true)}
            style={{ boxShadow: 'inset 0 1px 0 hsl(224, 84%, 74%), 0 1px 3px hsl(0, 0%, 0%, 0.2)' }}
          >
            Agregar cliente
          </Button>
          
          
        </div>
      </div>

      <Divider />

      {/* Información de pago en dos columnas */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 text-lg">Información de pago</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna 1: Método de pago y monto */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-gray-700">Método de pago</h5>
              <Select
                placeholder="Seleccionar método de pago"
                selectedKeys={paymentData.metodoPago ? new Set([paymentData.metodoPago]) : new Set()}
                onSelectionChange={(keys) => handlePaymentChange('metodoPago', Array.from(keys)[0] || '')}
                className="w-full"
                disabledKeys={disabledKeys1}
              >
                {paymentOptions.map(({ key, value, label }) => (
                  <SelectItem key={key} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
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
                className="w-full"
                startContent={<span>S/</span>}
                type="number"
                step="0.01"
                min="0"
                disabled={!paymentData.metodoPago}
                style={{  border: "none",
                              boxShadow: "none",
                              outline: "none", }}
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
                      startContent={
                        <span>{paymentData.tipoDescuento === 'porcentaje' ? '%' : 'S/'}</span>
                      }
                      type="number"
                      step="0.01"
                      min="0"
                      max={paymentData.tipoDescuento === 'porcentaje' ? 100 : total_t}
                      className="w-full"
                      disabled={!paymentData.descuentoActivado}
                      style={{  border: "none",
                                boxShadow: "none",
                                outline: "none", }}
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

            {faltante2 > 0 && selectedDocumentType !== 'Nota de venta' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <h5 className="font-medium text-yellow-800">Tercer método de pago</h5>
                <Select
                  label="Tercer método"
                  placeholder="Método adicional"
                  selectedKeys={paymentData.metodoPago3 ? new Set([paymentData.metodoPago3]) : new Set()}
                  onSelectionChange={(keys) => handlePaymentChange('metodoPago3', Array.from(keys)[0] || '')}
                  className="w-full"
                  disabledKeys={[...new Set([...disabledKeys2, paymentData.metodoPago, paymentData.metodoPago2].filter(Boolean))]}
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
                  className="w-full"
                  startContent={<span>S/</span>}
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!paymentData.metodoPago3}
                  style={{  border: "none",
                              boxShadow: "none",
                              outline: "none", }}
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
                  <span className="font-medium text-blue-600">S/ {cambio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Faltante:</span>
                  <span className="font-medium text-red-600">S/ {faltante.toFixed(2)}</span>
                </div>
                {faltante2 > 0 && selectedDocumentType !== 'Nota de venta' && (
                  <div className="flex justify-between">
                    <span>Faltante 2:</span>
                    <span className="font-medium text-red-600">S/ {faltante2.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {faltante > 0 && selectedDocumentType !== 'Nota de venta' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                <h5 className="font-medium text-orange-800">Pago adicional</h5>
                <Select
                  label="Segundo método"
                  placeholder="Método adicional"
                  selectedKeys={paymentData.metodoPago2 ? new Set([paymentData.metodoPago2]) : new Set()}
                  onSelectionChange={(keys) => handlePaymentChange('metodoPago2', Array.from(keys)[0] || '')}
                  className="w-full"
                  disabledKeys={disabledKeys2}
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
                  className="w-full"
                  startContent={<span>S/</span>}
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!paymentData.metodoPago2}
                  style={{  border: "none",
                              boxShadow: "none",
                              outline: "none", }}
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
          console.log('Cliente agregado, refrescando lista...');
        }}
      />

    {/* Botón continuar */}
    <div className="flex flex-col items-center space-y-2 pt-6 border-t">
      <Button 
        className="w-full xl:w-96 text-white font-semibold py-3" 
        onClick={goToNextStep}
        variant="shadow"
        size="lg"
        style={{ backgroundColor: '#338CF1' }}
        disabled={
          !selectedDocumentType || 
          (!clienteData.nombreCliente && selectedDocumentType !== 'Nota de venta') ||
          !paymentData.metodoPago || 
          montoRecibido <= 0 ||
          faltante3 > 0 // No permitir continuar si hay faltante final
        }
      >
        {faltante > 0 || faltante2 > 0 || faltante3 > 0
          ? 'Continuar' 
          : 'Revisar y confirmar venta'
        }
      </Button>
      
      {/* Información de validación */}
      
    </div>
  </div>
  );
};

export default SalesStep2;
