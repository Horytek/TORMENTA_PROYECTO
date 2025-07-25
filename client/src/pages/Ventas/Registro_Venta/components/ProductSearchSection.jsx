import React, { useRef, useEffect } from 'react';
import { Button, ScrollShadow, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip } from '@heroui/react';
import BarraSearch from "@/components/Search/Search";
import { FaTshirt } from 'react-icons/fa';
import { IoHome, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { GiUnderwearShorts, GiArmoredPants, GiAmpleDress, GiShorts, GiPoloShirt, GiMonclerJacket, GiPassport, GiSkirt, GiShirt, GiTankTop } from 'react-icons/gi';

// Categorías de productos con iconos
const categoryButtons = [
  { category: '', icon: IoHome },
  { category: 'Pantalon', icon: GiArmoredPants },
  { category: 'Vestidos Jeans', icon: GiAmpleDress },
  { category: 'Shorts', icon: GiUnderwearShorts },
  { category: 'Torero', icon: GiShorts },
  { category: 'Polos', icon: GiPoloShirt },
  { category: 'Blusas Jeans', icon: FaTshirt },
  { category: 'Casacas Jeans', icon: GiMonclerJacket },
  { category: 'Conjunto Deportivos', icon: GiPassport },
  { category: 'Minifaldas', icon: GiSkirt },
  { category: 'Overoles', icon: GiTankTop },
  { category: 'Poleras Franeladas', icon: GiShirt }
];

const ProductSearchSection = ({
  searchTerm,
  handleSearchChange,
  handleClearSearch,
  selectedMarca,
  setSelectedMarca,
  marcasUnicas,
  selectedCategory,
  setSelectedCategory,
  filteredProductos,
  handleProductSelect
}) => {
  const scrollRef = useRef();

  // Scroll navigation functions
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="flex gap-4 mb-4">
        <BarraSearch
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Buscar producto por nombre..."
          isClearable={true}
          onClear={handleClearSearch}
          className="flex-1"
        />
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="shadow"
              className="px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 shadow-lg"
              startContent={<FaTshirt className="text-lg" />}
            >
              {selectedMarca || 'Filtrar por marca'}
            </Button>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="Seleccionar marca"
            onAction={(key) => setSelectedMarca(key === 'all' ? '' : key)}
            selectionMode="single"
            selectedKeys={selectedMarca ? [selectedMarca] : ['all']}
          >
            <DropdownItem key="all">Todas las marcas</DropdownItem>
            {marcasUnicas.map((marca) => (
              <DropdownItem key={marca}>{marca}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      
      {/* Categorías de productos */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onClick={scrollLeft}
              className="bg-gray-100 hover:bg-gray-200"
            >
              <IoChevronBack />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onClick={scrollRight}
              className="bg-gray-100 hover:bg-gray-200"
            >
              <IoChevronForward />
            </Button>
          </div>
        </div>
        <ScrollShadow 
          ref={scrollRef}
          orientation="horizontal" 
          className="w-full"
          hideScrollBar
          size={20}
          isEnabled={true}
        >
          <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
            {categoryButtons.map(({ category, icon: Icon }) => (
              <button
                key={category || 'all'}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md border border-gray-200"
                }`}
              >
                <Icon className="text-lg flex-shrink-0" />
                <span className="font-medium">{category || 'Todos'}</span>
              </button>
            ))}
          </div>
        </ScrollShadow>
      </div>

      {/* Lista de productos filtrados */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-600">
            Productos encontrados ({filteredProductos.length})
          </h3>
          <div className="flex gap-2">
            {selectedCategory && (
              <Button
                size="sm"
                variant="flat"
                color='danger'
                onClick={() => setSelectedCategory('')}
              >
                Limpiar categoría
              </Button>
            )}
            {selectedMarca && (
              <Chip
                color="primary"
                variant="flat"
                onClose={() => setSelectedMarca('')}
                className="text-xs"
              >
                Marca: {selectedMarca}
              </Chip>
            )}
          </div>
        </div>
        
        <ScrollShadow 
          className="max-h-64" 
          hideScrollBar
          size={15}
          isEnabled={true}
        >
          {filteredProductos.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredProductos.map((producto) => (
                <div
                  key={producto.codigo}
                  onClick={() => handleProductSelect(producto)}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {producto.nombre}
                      </h4>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-xs text-gray-500">
                          Código: {producto.codigo}
                        </p>
                        {producto.nom_marca && (
                          <p className="text-xs text-blue-600 font-medium">
                            Marca: {producto.nom_marca}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-semibold text-blue-600">
                        S/ {producto.precio}
                      </p>
                      <p className={`text-xs ${
                        producto.stock > 0 
                          ? 'text-green-600' 
                          : 'text-red-500'
                      }`}>
                        Stock: {producto.stock}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron productos</p>
              {searchTerm && (
                <p className="text-sm mt-1">
                  Intenta con otro término de búsqueda
                </p>
              )}
            </div>
          )}
        </ScrollShadow>
      </div>
    </>
  );
};

export default ProductSearchSection;
