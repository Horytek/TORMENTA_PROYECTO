import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  Chip,
  Spinner
} from '@heroui/react';
import { ScrollShadow } from '@heroui/react';
import { IoMdAdd } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { RiRefreshLine } from "react-icons/ri";
import ProductosForm from '@/pages/Productos/ProductosForm';
import { toast } from "react-hot-toast";

const DEBOUNCE_MS = 380;

const ModalBuscarProducto = ({
  isOpen,
  onClose,
  onBuscar,
  setSearchInput,
  productos,
  agregarProducto,
  setCodigoBarras,
  hideStock
}) => {
  const [cantidades, setCantidades] = useState({});
  const [activeAdd, setModalOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [codigoBarrasValue, setCodigoBarrasValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimer = useRef(null);
  const firstInputRef = useRef(null);

  // Foco inicial
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Inicializar cantidades al abrir (merge strategy to prevent reset)
  useEffect(() => {
    if (isOpen) {
      setCantidades(prev => {
        const next = { ...prev };
        productos.forEach(p => {
          // Solo inicializar si no existe, para evitar sobreescribir lo que el usuario ya escribió
          if (next[p.codigo] === undefined) {
            next[p.codigo] = 1;
          }
        });
        return next;
      });
    }
  }, [isOpen, productos]);

  // Debounce búsqueda
  const triggerSearch = useCallback(() => {
    if (!onBuscar) return;
    setIsSearching(true);
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

  const handleCantidadChange = (codigo, value) => {
    if (value === "") {
      setCantidades(prev => ({ ...prev, [codigo]: "" }));
      return;
    }
    const cantidad = parseInt(value, 10);
    if (!isNaN(cantidad) && cantidad > 0) {
      setCantidades(prev => ({ ...prev, [codigo]: cantidad }));
    }
  };

  const handleAgregarProducto = (producto) => {
    const val = cantidades[producto.codigo];
    const cantidadSolicitada = (val === "" || val === undefined) ? 1 : parseInt(val, 10);
    // Safety check if NaN
    const finalCantidad = isNaN(cantidadSolicitada) ? 1 : cantidadSolicitada;
    if (!hideStock && finalCantidad > producto.stock) {
      toast.error(`Cantidad (${finalCantidad}) excede stock (${producto.stock}).`);
      return;
    }
    agregarProducto(producto, finalCantidad);
  };

  const resetFiltros = () => {
    setSearchInputValue('');
    setCodigoBarrasValue('');
    setSearchInput('');
    setCodigoBarras('');
    triggerSearch();
  };

  const totalProductos = productos.length;
  const totalConStock = useMemo(
    () => hideStock ? totalProductos : productos.filter(p => (p.stock ?? 0) > 0).length,
    [productos, hideStock, totalProductos]
  );

  const highlight = (texto) => {
    if (!searchInputValue) return texto;
    const idx = texto.toLowerCase().indexOf(searchInputValue.toLowerCase());
    if (idx === -1) return texto;
    return (
      <>
        {texto.slice(0, idx)}
        <span className="bg-yellow-200/70 dark:bg-yellow-500/30 rounded px-0.5">
          {texto.slice(idx, idx + searchInputValue.length)}
        </span>
        {texto.slice(idx + searchInputValue.length)}
      </>
    );
  };

  const emptyState = isSearching
    ? (
      <tr>
        <td colSpan={hideStock ? 5 : 6} className="py-10">
          <div className="flex flex-col items-center justify-center gap-3 text-sm">
            <Spinner size="sm" color="primary" />
            <span className="text-blue-700 dark:text-blue-300">Buscando productos…</span>
          </div>
        </td>
      </tr>
    ) : (
      <tr>
        <td colSpan={hideStock ? 5 : 6} className="py-12">
          <div className="flex flex-col items-center justify-center gap-2 text-sm">
            <FiSearch className="text-2xl text-blue-500" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">Sin resultados</span>
            <p className="text-blue-600/70 dark:text-blue-300/60 text-xs">
              Ajusta términos o intenta otro código de barras.
            </p>
          </div>
        </td>
      </tr>
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      backdrop="blur"
      classNames={{
        backdrop: "bg-slate-900/40 backdrop-blur-md",
        wrapper: "z-[9999]",
        base: "bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl"
      }}
      motionProps={{
        variants: {
          enter: { y: 0, opacity: 1, scale: 1 },
          exit: { y: 10, opacity: 0, scale: 0.98 }
        }
      }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1 pb-4 pt-6 px-8 bg-slate-50/50 dark:bg-zinc-900/20 border-b border-slate-100 dark:border-zinc-800/50">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-extrabold text-blue-900 dark:text-blue-100 tracking-tight">
                  Buscar producto
                </h2>
                <span className="text-xs font-semibold text-blue-500/80 dark:text-blue-400/70">
                  Filtra por descripción o código de barras
                </span>
              </div>
              <div className="flex gap-2">
                <Chip size="sm" variant="flat" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold h-7 px-1">
                  Total: {totalProductos}
                </Chip>
                {!hideStock && (
                  <Chip size="sm" variant="flat" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold h-7 px-1">
                    Con stock: {totalConStock}
                  </Chip>
                )}
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="pt-6 px-8">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_auto_auto] gap-3 mb-6 items-center">
              <Input
                ref={firstInputRef}
                placeholder="Descripción / palabra clave"
                startContent={<FiSearch className="text-blue-500 text-lg" />}
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                  setSearchInput(e.target.value);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') triggerSearch(); }}
                variant="flat"
                classNames={{
                  inputWrapper: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors h-11 rounded-xl",
                  input: "text-sm"
                }}
              />
              <Input
                placeholder="Código de barras"
                value={codigoBarrasValue}
                onChange={(e) => {
                  setCodigoBarrasValue(e.target.value);
                  setCodigoBarras(e.target.value);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') triggerSearch(); }}
                variant="flat"
                classNames={{
                  inputWrapper: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors h-11 rounded-xl",
                  input: "text-sm"
                }}
              />
              <Button
                className="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 font-bold h-11 rounded-xl px-6"
                variant="flat"
                startContent={<RiRefreshLine size={18} />}
                onPress={resetFiltros}
              >
                Reset
              </Button>
              <Button
                className="bg-emerald-500 text-white font-bold h-11 rounded-xl px-6 shadow-md shadow-emerald-500/20"
                startContent={<IoMdAdd size={20} />}
                onPress={handleModalAdd}
              >
                Nuevo
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <ScrollShadow hideScrollBar className="max-h-[450px]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
                    <tr className="text-left">
                      <th className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">Código</th>
                      <th className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">Descripción</th>
                      <th className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider">Marca</th>
                      {!hideStock && <th className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider text-center">Stock</th>}
                      <th className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider text-center w-32">Cantidad</th>
                      <th className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider text-center w-20">Añadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                    {productos.length === 0 && emptyState}
                    {productos.map((producto, idx) => {
                      const lowStock = !hideStock && producto.stock <= 0;
                      return (
                        <tr
                          key={producto.codigo}
                          className="bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group"
                        >
                          <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 text-xs">
                            {producto.codigo}
                          </td>
                          <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium text-sm">
                            {highlight(producto.descripcion)}
                          </td>
                          <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs font-medium">
                            {producto.marca || '-'}
                          </td>
                          {!hideStock && (
                            <td className="py-4 px-6 text-center">
                              <div className={`inline-flex items-center justify-center h-8 px-3 rounded-full border ${lowStock
                                ? "bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                                }`}>
                                <span className="text-xs font-bold">{producto.stock}</span>
                              </div>
                            </td>
                          )}
                          <td className="py-4 px-6">
                            <Input
                              type="number"
                              min={1}
                              value={cantidades[producto.codigo] !== undefined ? String(cantidades[producto.codigo]) : "1"}
                              onValueChange={(value) => handleCantidadChange(producto.codigo, value)}
                              size="sm"
                              classNames={{
                                inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 h-9 shadow-sm hover:border-blue-400 focus-within:border-blue-500 transition-colors",
                                input: "text-center font-bold text-slate-700 dark:text-white"
                              }}
                              isDisabled={lowStock}
                            />
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Button
                              className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 min-w-8 w-9 h-9 rounded-lg"
                              isIconOnly
                              size="sm"
                              onPress={() => handleAgregarProducto(producto)}
                              isDisabled={lowStock}
                            >
                              <IoMdAdd size={18} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollShadow>
            </div>
          </ModalBody>

          <ModalFooter className="px-8 pb-8 pt-4">
            <div className="flex w-full justify-between items-center bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-100 dark:border-zinc-800">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {isSearching ? 'Buscando resultados...' : `${productos.length} resultados encontrados`}
              </span>
              <Button
                className="font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700"
                onPress={onClose}
              >
                Cerrar
              </Button>
            </div>
          </ModalFooter>
        </>
      </ModalContent>

      {activeAdd && (
        <ProductosForm
          modalTitle="Nuevo Producto"
          onClose={handleCloseProductosForm}
          onSuccess={() => {
            toast.success("Producto creado. Actualizando…");
            triggerSearch();
          }}
        />
      )}
    </Modal>
  );
};

export default ModalBuscarProducto;