import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Input,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Spinner,
  ScrollShadow
} from '@heroui/react';
import { IoMdAdd } from "react-icons/io";
import { FaBarcode, FaSearch } from 'react-icons/fa';
import { toast as hotToast } from "react-hot-toast";
import ProductosForm from '../../../Productos/ProductosForm';
import VariantSelectionModal from '@/components/Modals/VariantSelectionModal';
import { getProductVariants, getProductAttributes } from "@/services/productos.services";

const DEBOUNCE_MS = 380;
const EMPTY_MSG = "No hay productos cargados";
const NO_MATCHES_MSG = "No hay coincidencias con el filtro actual";

const ModalBuscarProducto = ({
  isOpen,
  onClose,
  onBuscar,
  setSearchInput,
  productos,
  agregarProducto,
  setCodigoBarras,
  hideStock,
  mode = 'salida',
  almacen
}) => {
  const [cantidades, setCantidades] = useState({});
  const [activeAdd, setModalOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [codigoBarrasValue, setCodigoBarrasValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef(null);
  const firstInputRef = useRef(null);

  const [limit, setLimit] = useState(20); // LIMITE INICIAL

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [currentProductForVariant, setCurrentProductForVariant] = useState(null);
  // const [pendingQuantity, setPendingQuantity] = useState(1);

  // Foco inicial
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Debounce búsqueda
  const triggerSearch = useCallback(() => {
    if (!onBuscar) return;
    setIsSearching(true);
    // Reset limit on search
    setLimit(20);
    Promise.resolve(onBuscar()).finally(() => {
      setIsSearching(false);
    });
  }, [onBuscar]);

  useEffect(() => {
    if (!isOpen) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      triggerSearch();
    }, DEBOUNCE_MS);
    return () => clearTimeout(searchTimer.current);
  }, [searchInputValue, codigoBarrasValue, triggerSearch, isOpen]);

  const handleModalAdd = () => setModalOpen(true);
  const handleCloseProductosForm = () => setModalOpen(false);

  const handleAgregarProducto = async (producto) => {
    const finalCantidad = 1; // Default to 1

    // Basic stock check
    if (mode !== 'ingreso' && !hideStock && finalCantidad > producto.stock) {
      hotToast.error(`Cantidad (${finalCantidad}) excede stock (${producto.stock}).`);
      return;
    }

    try {
      // Unify variant fetching logic
      // For 'ingreso', we want to see ALL variants (includeZeroStock = true)
      // For 'salida', we only want variants with stock (includeZeroStock = false) -> actually, maybe true to let user try and fail? 
      // No, default behavior was hiding invalid options. Let's keep strict for output.

      const includeZeroStock = mode === 'ingreso';
      // Pass null for sucursal if we are filtering by specific almacen ID already
      const variants = await getProductVariants(producto.codigo, includeZeroStock, almacen, null);

      if (variants && variants.length > 0) {
        setCurrentProductForVariant(producto);
        setVariantModalOpen(true);
      } else {
        agregarProducto(producto, finalCantidad);
      }
    } catch (error) {
      console.error("Error checking variants", error);
      agregarProducto(producto, finalCantidad);
    }
  };

  const handleVariantConfirm = (items) => {
    if (currentProductForVariant && Array.isArray(items)) {
      items.forEach((variantItem) => {
        // variantItem contains quantity and resolvedAttributes
        agregarProducto(currentProductForVariant, variantItem.quantity, variantItem);
      });
    }
    setVariantModalOpen(false);
    setCurrentProductForVariant(null);
  };

  const handleSearchChange = (val) => {
    setSearchInputValue(val);
    setSearchInput(val);
    setLimit(20); // Reset limit when typing
  };

  const handleCodigoChange = (val) => {
    setCodigoBarrasValue(val);
    setCodigoBarras(val);
    setLimit(20); // Reset limit when typing
  };

  // Etiqueta de estado
  const listStatus = useMemo(() => {
    if (isSearching) return 'loading';
    if (!productos.length && (searchInputValue || codigoBarrasValue)) return 'no-matches';
    if (!productos.length) return 'empty';
    return 'ok';
  }, [isSearching, productos.length, searchInputValue, codigoBarrasValue]);

  // Derived filtered items for display
  const itemsToDisplay = useMemo(() => {
    return productos.slice(0, limit);
  }, [productos, limit]);

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
        placement="right"
        size="4xl"
        backdrop="blur"
        classNames={{
          wrapper: "z-[50]",
          backdrop: "bg-slate-900/40 backdrop-blur-sm z-[49]",
          base: "bg-white dark:bg-zinc-900 shadow-2xl",
          header: "border-b border-slate-100 dark:border-zinc-800 py-4 px-6",
          body: "p-0",
          footer: "border-t border-slate-100 dark:border-zinc-800 py-4 px-6",
          closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full right-4 top-4"
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between items-center bg-slate-50/50 dark:bg-zinc-800/10">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                    <FaSearch className="text-blue-500" />
                    Buscar producto
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    Explora el inventario o escanea códigos
                  </p>
                </div>
                <div className="flex gap-2 mr-8">
                  <Chip size="sm" variant="flat" color="primary" className="font-semibold h-7">
                    {productos.length} Resultados
                  </Chip>
                  {!hideStock && (
                    <Chip size="sm" variant="flat" color="success" className="font-semibold h-7">
                      Con Stock
                    </Chip>
                  )}
                </div>
              </DrawerHeader>

              <DrawerBody>
                <div className="p-6 flex flex-col h-full gap-4">
                  {/* Filtros */}
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-3">
                    <Input
                      ref={firstInputRef}
                      size="lg"
                      variant="faded"
                      radius="lg"
                      startContent={<FaSearch className="w-5 h-5 text-slate-400" />}
                      placeholder="Buscar por descripción..."
                      value={searchInputValue}
                      onValueChange={handleSearchChange}
                      classNames={{
                        input: "text-base",
                        inputWrapper: "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-blue-400 focus-within:ring-2 ring-blue-500/10"
                      }}
                    />
                    <Input
                      size="lg"
                      variant="faded"
                      radius="lg"
                      startContent={<FaBarcode className="w-5 h-5 text-slate-400" />}
                      placeholder="Código de barras..."
                      value={codigoBarrasValue}
                      onValueChange={handleCodigoChange}
                      classNames={{
                        input: "text-base",
                        inputWrapper: "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-purple-400 focus-within:ring-2 ring-purple-500/10"
                      }}
                    />
                    <Button
                      size="lg"
                      color="primary"
                      onPress={handleModalAdd}
                      className="font-bold shadow-lg shadow-blue-500/20"
                      startContent={<IoMdAdd className="text-xl" />}
                      radius="lg"
                    >
                      Nuevo
                    </Button>
                  </div>

                  {/* Tabla Scrollable */}
                  <div className="flex-1 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm relative">
                    <ScrollShadow className="h-full w-full" hideScrollBar>
                      <Table
                        aria-label="Tabla de búsqueda de productos"
                        removeWrapper
                        radius="none"
                        isHeaderSticky
                        bottomContent={
                          productos.length > limit ? (
                            <div className="flex w-full justify-center p-4">
                              <Button size="sm" variant="flat" color="primary" onPress={() => setLimit(prev => prev + 20)}>
                                Cargar más ({limit} de {productos.length})
                              </Button>
                            </div>
                          ) : null
                        }
                        classNames={{
                          base: "min-w-full h-full",
                          table: "min-w-full",
                          thead: "z-20 [&>tr]:first:shadow-sm",
                          th: "bg-slate-50 dark:bg-zinc-800/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider h-10 border-b border-slate-100 dark:border-zinc-800 backdrop-blur-sm",
                          td: "py-3 px-4 border-b border-slate-50 dark:border-zinc-800/50 group-data-[last=true]:border-none",
                          tr: "hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                        }}
                      >
                        <TableHeader>
                          <TableColumn className="w-24">CÓDIGO</TableColumn>
                          <TableColumn>DESCRIPCIÓN</TableColumn>
                          <TableColumn className="w-32">MARCA</TableColumn>
                          <TableColumn className="text-center w-24">STOCK</TableColumn>
                          <TableColumn className="text-center w-20">ACCIÓN</TableColumn>
                        </TableHeader>
                        <TableBody
                          items={itemsToDisplay}
                          emptyContent={
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center">
                                <FaSearch className="text-2xl opacity-20" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-slate-500">
                                  {listStatus === 'empty' ? EMPTY_MSG : NO_MATCHES_MSG}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Intenta con otros términos</p>
                              </div>
                            </div>
                          }
                          isLoading={listStatus === 'loading'}
                          loadingContent={<Spinner label="Buscando..." color="primary" />}
                        >
                          {(item) => (
                            <TableRow key={item.codigo}>
                              <TableCell>
                                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
                                  {item.codigo}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  {/* Highlight search logic could optionally go here */}
                                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
                                    {item.descripcion}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{item.id_producto}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 capitalize border-none h-6 text-[10px]">
                                  {item.marca || '—'}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full shadow-sm ${item.stock > 10 ? "bg-emerald-500" : item.stock > 0 ? "bg-amber-500" : "bg-rose-500"}`} />
                                  <span className={`text-xs font-bold ${item.stock > 0 ? "text-slate-600 dark:text-slate-300" : "text-rose-500"}`}>
                                    {item.stock}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center">
                                  <Tooltip content="Agregar" color="primary" size="sm" closeDelay={0} offset={-7}>
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="shadow"
                                      color="primary"
                                      className="w-8 h-8 min-w-8 bg-blue-600 text-white rounded-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                                      onPress={() => handleAgregarProducto(item)}
                                    >
                                      <IoMdAdd className="text-lg" />
                                    </Button>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollShadow>
                  </div>
                </div>
              </DrawerBody>

              <DrawerFooter className="bg-slate-50 dark:bg-zinc-900/50 flex justify-between items-center">
                <div className="text-xs text-slate-400">
                  Presiona <span className="font-mono bg-slate-200 dark:bg-zinc-700 px-1 rounded">ESC</span> para cerrar
                </div>
                <Button size="md" color="danger" variant="light" onPress={onClose} className="font-medium">
                  Cerrar Panel
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Nuevo Producto Modal - z-index high */}
      {activeAdd && (
        <ProductosForm
          modalTitle="Nuevo Producto"
          onClose={handleCloseProductosForm}
          onSuccess={() => {
            hotToast.success("Producto creado. Actualizando…");
            triggerSearch();
          }}
        />
      )}

      {/* Variants Modal - z-index higher than Drawer */}
      <VariantSelectionModal
        isOpen={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        product={currentProductForVariant}
        onConfirm={handleVariantConfirm}
        mode={mode}
        almacen={almacen}
      />
    </>
  );
};

ModalBuscarProducto.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onBuscar: PropTypes.func,
  setSearchInput: PropTypes.func,
  productos: PropTypes.array.isRequired,
  agregarProducto: PropTypes.func.isRequired,
  setCodigoBarras: PropTypes.func,
  hideStock: PropTypes.bool,
  mode: PropTypes.string,
  almacen: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default ModalBuscarProducto;