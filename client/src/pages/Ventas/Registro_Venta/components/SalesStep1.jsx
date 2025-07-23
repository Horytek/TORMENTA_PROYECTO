import { Button, ScrollShadow, Divider, Input } from '@heroui/react';
import { GrDocumentPerformance } from 'react-icons/gr';
import { BsCashCoin } from 'react-icons/bs';
import { BiBarcodeReader } from 'react-icons/bi';
import { useState, useEffect } from 'react';
import BarraSearch from "@/components/Search/Search";

const SalesStep1 = ({
  searchTerm,
  handleSearchChange,
  handleClearSearch,
  detalles,
  handleRemoveAllProducts,
  handleProductRemove,
  handleDecrement,
  handleIncrement,
  handleQuantityChange, 
  totalImporte,
  igv_t,
  total_t,
  handlePrint,
  Comprobar_mayor_499,
  // Props para el escáner directo
  productos,
  handleProductSelect
}) => {
  // Estado local para el filtro si no viene del padre
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  
  // Estados para el escáner directo (siempre activo)
  const [barcode, setBarcode] = useState('');
  const [scanningFeedback, setScanningFeedback] = useState(false);
  
  // Estado local para manejar la edición de cantidades
  const [editingQuantities, setEditingQuantities] = useState({});

  // Efecto para manejar el escáner de códigos de barras (siempre activo)
  useEffect(() => {
    let timeoutId;

    const handleKeyPress = (event) => {
      // Ignorar eventos si estamos en un input o textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === 'Enter') {
        // Al presionar Enter, el escáner ha terminado de enviar el código
        if (barcode && productos) {
         //  console.log('Código escaneado:', barcode);
          
          const productoEscaneado = productos.find(p => 
            p.codigo_barras === barcode || 
            p.codigo.toString() === barcode
          );

          if (productoEscaneado && productoEscaneado.stock > 0) {
         //   console.log('Producto encontrado:', productoEscaneado);
            if (handleProductSelect) {
              handleProductSelect(productoEscaneado);
              
              // Mostrar feedback visual de éxito
              setScanningFeedback(true);
              setTimeout(() => setScanningFeedback(false), 2000);
            }
          } else {
            console.warn('Producto no encontrado o sin stock');
            // Mostrar mensaje de error más discreto
            setScanningFeedback(true);
            setTimeout(() => setScanningFeedback(false), 3000);
          }
        }
        
        // Limpiar el código después de procesar
        setBarcode('');
        
        // Limpiar timeout si existe
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } else if (event.key.length === 1 && /^[0-9]$/.test(event.key)) {
        // Solo agregar números al código de barras
        setBarcode(prev => prev + event.key);
        
        // Auto-limpiar el código después de 2 segundos de inactividad
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          setBarcode('');
        }, 2000);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [barcode, productos, handleProductSelect]);
  
  // Usar el término de búsqueda - simplificado para evitar loops
  const searchTermToUse = searchTerm || localSearchTerm || '';
  
  // Handlers simplificados
  const handleLocalSearchChange = (value) => {
    const actualValue = typeof value === 'string' ? value : (value?.target?.value || '');
    if (handleSearchChange) {
      handleSearchChange(actualValue);
    } else {
      setLocalSearchTerm(actualValue);
    }
  };
  
  const handleLocalClearSearch = () => {
    if (handleClearSearch) {
      handleClearSearch();
    } else {
      setLocalSearchTerm('');
    }
  };
  
  // Filtrar productos basado en el término de búsqueda
  const filteredDetalles = detalles.filter(detalle => {
    // Si no hay término de búsqueda o está vacío, mostrar todos
    if (!searchTermToUse || searchTermToUse.trim() === '') return true;
    
    const nombre = (detalle.nombre || '').toString();
    const codigo = (detalle.codigo || '').toString();
    const searchLower = searchTermToUse.toLowerCase().trim();
    
    return nombre.toLowerCase().includes(searchLower) ||
           codigo.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-4">
      {/* Header con cantidad de productos - Solo mostrar si hay productos */}
      {detalles.length > 0 && (
        <div className="flex justify-between items-center gap-3">
          <BarraSearch
            value={searchTermToUse}
            onChange={handleLocalSearchChange}
            placeholder="Buscar producto en el detalle..."
            isClearable={true}
            onClear={handleLocalClearSearch}
            className="max-w-xs"
          />
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="flat"
              color="danger"
              onClick={handleRemoveAllProducts}
              className="text-xs text-bold text-red-600"
            >
              Limpiar todo
            </Button>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <ScrollShadow className="max-h-80" hideScrollBar>
        {detalles.length > 0 ? (
          filteredDetalles.length > 0 ? (
            <div className="space-y-3">
              {filteredDetalles.map((detalle) => {
                // Encontrar el índice original del producto para las funciones
                const originalIndex = detalles.findIndex(d => d.codigo === detalle.codigo);
                return (
                <div
                  key={detalle.codigo}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {detalle.nombre}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Código: {detalle.codigo}
                      </p>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="danger"
                      onClick={() => handleProductRemove(detalle.codigo, detalle.cantidad)}
                      className="text-xs"
                    >
                      ×
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          if (handleDecrement && typeof handleDecrement === 'function') {
                            handleDecrement(originalIndex);
                          }
                        }}
                        disabled={detalle.cantidad <= 1 || !handleDecrement}
                        style={{ backgroundColor: '#f3281ddf', color: '#ffffff', opacity: !handleDecrement ? 0.5 : 1 }}
                      >
                        -
                      </Button>
                      
                      <Input
                        value={
                          editingQuantities[detalle.codigo] !== undefined 
                            ? editingQuantities[detalle.codigo] 
                            : detalle.cantidad.toString()
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          
                          // Actualizar el estado de edición local
                          setEditingQuantities(prev => ({
                            ...prev,
                            [detalle.codigo]: value
                          }));

                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 1 && numValue <= 999 && value.length <= 3) {
                            if (handleQuantityChange && typeof handleQuantityChange === 'function') {
                              handleQuantityChange(originalIndex, numValue);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Enter'];
                          const isNumber = /^[0-9]$/.test(e.key);
                          const isControlKey = allowedKeys.includes(e.key);
                          const isSelectAll = e.ctrlKey && e.key.toLowerCase() === 'a';
                          
                          if (!isNumber && !isControlKey && !isSelectAll) {
                            e.preventDefault();
                            return;
                          }
                          
                          // Si presiona Enter, procesar el cambio
                          if (e.key === 'Enter') {
                            e.target.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          let finalValue = parseInt(value);
                          
                          // Solo corregir si el valor es inválido
                          if (value === '' || isNaN(finalValue) || finalValue < 1) {
                            finalValue = 1;
                            if (handleQuantityChange && typeof handleQuantityChange === 'function') {
                              handleQuantityChange(originalIndex, finalValue);
                            }
                          } else if (finalValue > 999) {
                            finalValue = 999;
                            if (handleQuantityChange && typeof handleQuantityChange === 'function') {
                              handleQuantityChange(originalIndex, finalValue);
                            }
                          }
                          
                          // Limpiar el estado de edición
                          setEditingQuantities(prev => {
                            const newState = { ...prev };
                            delete newState[detalle.codigo];
                            return newState;
                          });
                        }}
                        onFocus={(e) => {
                          // Seleccionar todo al hacer foco
                          setTimeout(() => e.target.select(), 0);
                        }}
                        className="w-16"
                        size="sm"
                        variant="bordered"
                        classNames={{
                          input: "text-center text-sm font-medium"
                        }}
                      />
                      
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onClick={() => {
                          if (handleIncrement && typeof handleIncrement === 'function') {
                            handleIncrement(originalIndex);
                          }
                        }}
                        disabled={!handleIncrement}
                        style={{ backgroundColor: '#0077ffff', color: '#ffffff', opacity: !handleIncrement ? 0.5 : 1 }}
                      >
                        +
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">
                        {detalle.subtotal}
                      </p>
                      <p className="text-xs text-gray-500">
                        S/ {detalle.precio} c/u
                      </p>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No se encontraron productos</p>
              <p className="text-xs mt-1">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <BiBarcodeReader className="text-4xl mx-auto mb-2 text-green-600" />
              <p className="text-sm">No hay productos seleccionados</p>
              <p className="text-xs mt-1 mb-2">
                Selecciona productos de la lista de la izquierda o usa el escáner
              </p>
              <p className="text-xs text-green-600 font-medium">
                Escáner siempre activo - Solo escanea un código de barras
              </p>
            </div>
          </div>
        )}
      </ScrollShadow>

      {/* Resumen de totales */}
      {detalles.length > 0 && (
        <>
          <Divider />
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">S/ {totalImporte}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IGV (18%):</span>
              <span className="font-medium">S/ {igv_t}</span>
            </div>
            <Divider />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">S/ {total_t}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button 
              className="bg-green-600/80 hover:bg-green-600 text-white font-medium" 
              onClick={() => handlePrint(true)} 
              disabled={detalles.length === 0} 
              variant="shadow"
              startContent={<GrDocumentPerformance />}
            >
              Cotizar
            </Button>

            <Button 
              className="bg-[#379AE6] hover:bg-[#1f7db9] text-white font-medium" 
              onClick={Comprobar_mayor_499} 
              variant="shadow"
              startContent={<BsCashCoin />}
            >
              Continuar al cobro
            </Button>
          </div>
        </>
      )}

     

      {/* Feedback visual cuando se escanea */}
      {scanningFeedback && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <BiBarcodeReader className="text-lg" />
          <span className="text-sm font-medium">¡Producto escaneado!</span>
        </div>
      )}
    </div>
  );
};

export default SalesStep1;
