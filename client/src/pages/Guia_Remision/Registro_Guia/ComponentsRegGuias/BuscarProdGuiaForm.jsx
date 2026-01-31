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
import { toast } from "react-hot-toast";
import ProductosForm from '../../../Productos/ProductosForm';
import VariantSelectionModal from '../../../../components/Modals/VariantSelectionModal';
import { getProductVariants, getProductAttributes } from "../../../../services/productos.services";

const EMPTY_MSG = "No hay productos cargados";
const NO_MATCHES_MSG = "No hay coincidencias con el filtro actual";

const ModalBuscarProducto = ({
  isOpen,
  onClose,
  productos,
  agregarProducto,
  loading = false,
  hideStock,
  mode = 'salida', // Default to 'salida' for Guia
  almacenOrigen
}) => {
  // UI / filtros
  // const [cantidades, setCantidades] = useState({}); // Removed
  const [searchDescripcion, setSearchDescripcion] = useState('');
  const [searchCodigo, setSearchCodigo] = useState('');
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  // States Limit
  const [limit, setLimit] = useState(20);

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [currentProductForVariant, setCurrentProductForVariant] = useState(null);
  // const [pendingQuantity, setPendingQuantity] = useState(1);

  // Debounce refs
  const descTimerRef = useRef(null);
  const codTimerRef = useRef(null);
  const firstInputRef = useRef(null);

  // Inicializa variantes/filtros al abrir
  useEffect(() => {
    if (isOpen) {
      setInternalLoading(false);
      // Focus en primer input tras animación
      setTimeout(() => {
        try { firstInputRef.current?.focus(); } catch { }
      }, 300);
    } else {
      setSearchDescripcion('');
      setSearchCodigo('');
      setLimit(20);
    }
  }, [isOpen, productos]);

  // Handlers con debounce
  const handleDescripcionChange = (val) => {
    clearTimeout(descTimerRef.current);
    descTimerRef.current = setTimeout(() => {
      setSearchDescripcion(val);
      setLimit(20);
    }, 300);
  };
  const handleCodigoChange = (val) => {
    clearTimeout(codTimerRef.current);
    codTimerRef.current = setTimeout(() => {
      setSearchCodigo(val);
      setLimit(20);
    }, 300);
  };

  // Filtro memoizado
  const filteredProductos = useMemo(() => {
    const desc = searchDescripcion.trim().toLowerCase();
    const cod = searchCodigo.trim().toLowerCase();

    let result = productos;
    if (desc || cod) {
      result = productos.filter(p => {
        const d = (p.descripcion || '').toLowerCase();
        const cb = (p.codbarras || '').toLowerCase();
        const matchDesc = !desc || d.includes(desc);
        const matchCod = !cod || cb.includes(cod);
        return matchDesc && matchCod;
      });
    }
    return result;
  }, [productos, searchDescripcion, searchCodigo]);

  // Items to display
  const itemsToDisplay = useMemo(() => filteredProductos.slice(0, limit), [filteredProductos, limit]);

  // Agregar
  const handleAgregarProducto = useCallback(async (producto) => {
    const finalCantidad = 1; // Default to 1

    // Basic stock check
    if (mode !== 'ingreso' && !hideStock && finalCantidad > producto.stock) {
      toast.error(`Cantidad (${finalCantidad}) excede stock (${producto.stock}).`);
      return;
    }

    try {
      if (mode !== 'ingreso') {
        const productIdentifier = producto.id_producto || producto.id || producto.codigo;
        // Strict variant check (with includeZero=true for safety in this context)
        const variants = await getProductVariants(productIdentifier, true, almacenOrigen, null);

        if (variants && Array.isArray(variants) && variants.length > 0) {
          setCurrentProductForVariant(producto);
          setVariantModalOpen(true);
        } else {
          agregarProducto(producto, finalCantidad);
        }
      } else {
        // Fallback or Ingreso logic
        const id = producto.id_producto || producto.codigo;
        const attrs = await getProductAttributes(id);
        if (attrs && (attrs.tonalidades.length > 0 || attrs.tallas.length > 0)) {
          setCurrentProductForVariant(producto);
          setVariantModalOpen(true);
        } else {
          agregarProducto(producto, finalCantidad);
        }
      }
    } catch (error) {
      console.error("Error checking variants", error);
      // Fallback
      if (producto.stock !== undefined && finalCantidad > producto.stock) {
        toast.error(`Cantidad (${finalCantidad}) excede stock (${producto.stock}).`);
        return;
      }
      agregarProducto(producto, finalCantidad);
    }
  }, [agregarProducto, mode, hideStock]);

  const handleVariantConfirm = (items) => {
    if (currentProductForVariant && Array.isArray(items)) {
      items.forEach((variantItem) => {
        agregarProducto(currentProductForVariant, variantItem.quantity, variantItem);
      });
    }
    setVariantModalOpen(false);
    setCurrentProductForVariant(null);
  };

  // Nuevo producto
  const openNuevoProducto = () => setShowNuevoProducto(true);
  const closeNuevoProducto = () => setShowNuevoProducto(false);

  // Etiqueta de estado
  const listStatus = useMemo(() => {
    if (loading || internalLoading) return 'loading';
    if (!productos.length) return 'empty';
    if (productos.length && !filteredProductos.length) return 'no-matches';
    return 'ok';
  }, [loading, internalLoading, productos.length, filteredProductos.length]);

  // Column definitions
  const columns = useMemo(() => [
    { uid: 'codigo', name: 'CÓDIGO', className: 'w-24' },
    { uid: 'descripcion', name: 'DESCRIPCIÓN', className: '' },
    { uid: 'marca', name: 'MARCA', className: 'w-32' },
    ...(!hideStock ? [{ uid: 'stock', name: 'STOCK', className: 'text-center w-24' }] : []),
    { uid: 'accion', name: 'ACCIÓN', className: 'text-center w-20' },
  ], [hideStock]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case 'codigo':
        return (
          <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-slate-200 dark:border-zinc-700">
            {item.codigo}
          </span>
        );
      case 'descripcion':
        return (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 transition-colors">
              {item.descripcion}
            </span>
          </div>
        );
      case 'marca':
        return (
          <Chip size="sm" variant="flat" className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 capitalize border-none h-6 text-[10px]">
            {item.marca || '—'}
          </Chip>
        );
      case 'stock':
        return (
          <div className="flex justify-center items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full shadow-sm ${item.stock > 10 ? "bg-emerald-500" : item.stock > 0 ? "bg-amber-500" : "bg-rose-500"}`} />
            <span className={`text-xs font-bold ${item.stock > 0 ? "text-slate-600 dark:text-slate-300" : "text-rose-500"}`}>
              {item.stock}
            </span>
          </div>
        );
      case 'accion':
        return (
          <div className="flex justify-center">
            <Tooltip content="Agregar a la guía" color="primary" size="sm" closeDelay={0} offset={-7}>
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
        );
      default:
        return null;
    }
  }, [handleAgregarProducto]);

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
                    Busca y agrega productos a la guía de remisión
                  </p>
                </div>
                <div className="flex gap-2 mr-8">
                  <Chip size="sm" variant="flat" color="primary" className="font-semibold h-7">
                    {productos.length} TOTAL
                  </Chip>
                  {filteredProductos.length !== productos.length && (
                    <Chip size="sm" variant="dot" color="secondary" className="font-semibold h-7 border-none">
                      {filteredProductos.length} FILTRADOS
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
                      aria-label="Buscar por descripción"
                      onChange={(e) => handleDescripcionChange(e.target.value)}
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
                      aria-label="Buscar por código de barras"
                      onChange={(e) => handleCodigoChange(e.target.value)}
                      classNames={{
                        input: "text-base",
                        inputWrapper: "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-purple-400 focus-within:ring-2 ring-purple-500/10"
                      }}
                    />
                    <Button
                      size="lg"
                      color="primary"
                      onPress={openNuevoProducto}
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
                          filteredProductos.length > limit ? (
                            <div className="flex w-full justify-center p-4">
                              <Button size="sm" variant="flat" color="primary" onPress={() => setLimit(prev => prev + 20)}>
                                Cargar más ({limit} de {filteredProductos.length})
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
                        <TableHeader columns={columns}>
                          {(column) => (
                            <TableColumn key={column.uid} className={column.className}>
                              {column.name}
                            </TableColumn>
                          )}
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
                          loadingContent={<Spinner label="Cargando productos..." color="primary" />}
                        >
                          {(item) => (
                            <TableRow key={item.codigo}>
                              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
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
        </DrawerContent >
      </Drawer >

      {showNuevoProducto && (
        <ProductosForm
          modalTitle="Nuevo Producto"
          onClose={closeNuevoProducto}
          onSuccess={() => {
            // Optional: trigger refresh if needed
            toast.success("Producto creado con éxito");
          }}
        />
      )}
      <VariantSelectionModal
        isOpen={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        product={currentProductForVariant}
        onConfirm={handleVariantConfirm}
        mode={mode} // Use the mode passed from parent (ingreso/salida)
        almacen={almacenOrigen} // Pass the selected warehouse
      />
    </>
  );
};

ModalBuscarProducto.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productos: PropTypes.array.isRequired,
  agregarProducto: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  hideStock: PropTypes.bool,
  mode: PropTypes.string,
  almacenOrigen: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default ModalBuscarProducto;