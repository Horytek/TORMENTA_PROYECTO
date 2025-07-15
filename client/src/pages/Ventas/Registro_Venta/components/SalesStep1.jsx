import { Button, ScrollShadow, Divider } from '@heroui/react';
import { GrDocumentPerformance } from 'react-icons/gr';
import { BsCashCoin } from 'react-icons/bs';
import { useState } from 'react';
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
  totalImporte,
  igv_t,
  total_t,
  handlePrint,
  Comprobar_mayor_499
}) => {
  // Estado local para el filtro si no viene del padre
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  
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
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onClick={handleRemoveAllProducts}
            className="text-xs text-bold text-red-600 shrink-0"
          >
            Limpiar todo
          </Button>
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
                      <span className="text-sm font-medium w-8 text-center">
                        {detalle.cantidad}
                      </span>
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
            <p className="text-sm">No hay productos seleccionados</p>
            <p className="text-xs mt-1">
              Selecciona productos de la lista de la izquierda
            </p>
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
    </div>
  );
};

export default SalesStep1;
