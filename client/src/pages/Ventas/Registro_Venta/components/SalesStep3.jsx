import { Button, Chip, Select, SelectItem, Input, Textarea } from '@heroui/react';

const SalesStep3 = ({
  total_t,
  paymentData,
  setPaymentData,
  selectedDocumentType,
  validateDecimalInput,
  goToNextStep
}) => {
  // Opciones de métodos de pago (mismas que en useCobrarModalState)
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

  // Lógica de deshabilitar opciones según el tipo de comprobante y métodos ya seleccionados
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

  // Calcular el monto recibido según el método de pago seleccionado
  const getMontoRecibido = () => {
    // Para simplificar, usar un campo general 'montoRecibido' en lugar de campos específicos
    return parseFloat(paymentData.montoRecibido || 0);
  };

  const montoRecibido = getMontoRecibido();
  const cambio = Math.max(montoRecibido - total_t, 0);
  const faltante = Math.max(total_t - montoRecibido, 0);

  // Actualizar payment data
  const handlePaymentChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value,
      total: total_t,
      vuelto: Math.max((parseFloat(value) || 0) - total_t, 0)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header del paso 3 */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-green-800">Resumen de la venta</h3>
          <Chip size="sm" color="success" variant="flat">
            {selectedDocumentType}
          </Chip>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Número:</span>
            <span className="font-mono">001-00001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-green-800">S/ {total_t}</span>
          </div>
        </div>
      </div>

      {/* Sección de método de pago */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">1</span>
          </div>
          <h4 className="font-semibold text-gray-800">Método de pago</h4>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <Select
            label="Selecciona método de pago"
            placeholder="Elige cómo vas a recibir el pago"
            selectedKeys={paymentData.metodoPago ? [paymentData.metodoPago] : []}
            onSelectionChange={(keys) => handlePaymentChange('metodoPago', Array.from(keys)[0] || '')}
            className="w-full"
            disabledKeys={disabledKeys1}
            startContent={<span className="text-lg">💳</span>}
          >
            {paymentOptions.map(({ key, value, label }) => (
              <SelectItem key={key} value={value}>
                {label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Sección de montos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">2</span>
          </div>
          <h4 className="font-semibold text-gray-800">Montos y cálculos</h4>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Total a pagar */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total a pagar"
              value={`S/ ${total_t}`}
              readOnly
              className="w-full"
              classNames={{
                input: "text-center font-semibold",
                inputWrapper: "bg-gray-50"
              }}
              startContent={<span className="text-green-600">💰</span>}
            />

            <Input
              label="Monto recibido"
              placeholder="0.00"
              value={paymentData.montoRecibido || ''}
              onChange={(e) => {
                handlePaymentChange('montoRecibido', e.target.value);
              }}
              onKeyDown={validateDecimalInput}
              className="w-full"
              startContent={<span>S/</span>}
              type="number"
              step="0.01"
              disabled={!paymentData.metodoPago}
            />
          </div>

          {/* Cálculos automáticos */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <h5 className="font-medium text-gray-700 text-sm">Cálculos automáticos</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Cambio:</span>
                <span className="font-medium text-blue-600">
                  S/ {cambio.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Faltante:</span>
                <span className="font-medium text-red-600">
                  S/ {faltante.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pago adicional si hay faltante */}
      {faltante > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">3</span>
            </div>
            <h4 className="font-semibold text-gray-800">Pago adicional requerido</h4>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800 mb-3">
              Aún falta <strong>S/ {faltante.toFixed(2)}</strong> por pagar
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Segundo método de pago"
                placeholder="Método adicional"
                selectedKeys={paymentData.metodoPago2 ? [paymentData.metodoPago2] : []}
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
                label="Monto adicional"
                placeholder="0.00"
                value={paymentData.montoAdicional || ''}
                onChange={(e) => handlePaymentChange('montoAdicional', e.target.value)}
                onKeyDown={validateDecimalInput}
                className="w-full"
                startContent={<span>S/</span>}
                type="number"
                step="0.01"
                disabled={!paymentData.metodoPago2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Observaciones */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-bold text-sm">📝</span>
          </div>
          <h4 className="font-semibold text-gray-800">Observaciones</h4>
        </div>

        <Textarea
          label="Notas adicionales (opcional)"
          placeholder="Agrega cualquier observación sobre esta venta..."
          value={paymentData.observaciones || ''}
          onChange={(e) => handlePaymentChange('observaciones', e.target.value)}
          maxRows={3}
          className="w-full"
          description="Estas notas aparecerán en el comprobante"
        />
      </div>

      {/* Botón continuar */}
      <div className="border-t pt-4">
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3" 
          onClick={goToNextStep}
          variant="shadow"
          size="lg"
          disabled={!paymentData.metodoPago || montoRecibido <= 0}
          startContent={<span className="text-lg">✓</span>}
        >
          {faltante > 0 
            ? 'Continuar con pago pendiente' 
            : 'Revisar y confirmar venta'
          }
        </Button>
        
        {/* Información del estado */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            {paymentData.metodoPago ? `Método: ${paymentData.metodoPago}` : 'Selecciona un método de pago'} 
            {montoRecibido > 0 ? ` • Recibido: S/ ${montoRecibido.toFixed(2)}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesStep3;
