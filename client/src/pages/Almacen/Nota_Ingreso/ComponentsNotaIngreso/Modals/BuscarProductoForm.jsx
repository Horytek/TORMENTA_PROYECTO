import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  NumberInput,
  Chip,
  Spinner
} from '@heroui/react';
import { ScrollShadow } from '@heroui/react';
import { IoMdAdd } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { RiRefreshLine } from "react-icons/ri";
import ProductosForm from '../../../../Productos/ProductosForm';
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

  // Inicializar cantidades al abrir
  useEffect(() => {
    if (isOpen) {
      const initialCantidades = productos.reduce((acc, p) => {
        acc[p.codigo] = 1;
        return acc;
      }, {});
      setCantidades(initialCantidades);
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
    const cantidad = parseInt(value, 10);
    if (!isNaN(cantidad) && cantidad > 0) {
      setCantidades(prev => ({ ...prev, [codigo]: cantidad }));
    }
  };

  const handleAgregarProducto = (producto) => {
    const cantidadSolicitada = cantidades[producto.codigo] || 1;
    if (!hideStock && cantidadSolicitada > producto.stock) {
      toast.error(`Cantidad (${cantidadSolicitada}) excede stock (${producto.stock}).`);
      return;
    }
    agregarProducto(producto, cantidadSolicitada);
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
        backdrop: "bg-black/40 backdrop-blur-md",
        wrapper: "z-[9999]",
        base: "bg-white/90 dark:bg-zinc-950/90 border border-blue-100/40 dark:border-zinc-700/60 rounded-2xl shadow-2xl"
      }}
      motionProps={{
        variants: {
          enter: { y: 0, opacity: 1, scale: 1 },
          exit: { y: 14, opacity: 0, scale: 0.98 }
        }
      }}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-2 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 tracking-tight">
                  Buscar producto
                </h2>
                <span className="text-[11px] font-medium text-blue-600/70 dark:text-blue-300/60">
                  Filtra por descripción o código de barras
                </span>
              </div>
              <div className="flex gap-2">
                <Chip size="sm" variant="flat" color="primary" className="text-[10px]">
                  Total: {totalProductos}
                </Chip>
                {!hideStock && (
                  <Chip size="sm" variant="flat" color="success" className="text-[10px]">
                    Con stock: {totalConStock}
                  </Chip>
                )}
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="pt-1">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_auto_auto] gap-3 mb-4 items-stretch">
              <Input
                ref={firstInputRef}
                placeholder="Descripción / palabra clave"
                startContent={<FiSearch className="text-blue-500" />}
                value={searchInputValue}
                onChange={(e) => {
                  setSearchInputValue(e.target.value);
                  setSearchInput(e.target.value);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') triggerSearch(); }}
                variant="flat"
                classNames={{
                  inputWrapper: "bg-white/70 dark:bg-zinc-900/70 border border-blue-100/60 dark:border-zinc-700/60 hover:border-blue-300 focus-within:border-blue-400"
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
                  inputWrapper: "bg-white/70 dark:bg-zinc-900/70 border border-blue-100/60 dark:border-zinc-700/60 hover:border-blue-300 focus-within:border-blue-400"
                }}
              />
              <Button
                color="secondary"
                variant="flat"
                startContent={<RiRefreshLine />}
                onPress={resetFiltros}
              >
                Reset
              </Button>
              <Button
                color="success"
                startContent={<IoMdAdd />}
                onPress={handleModalAdd}
                className="w-full"
              >
                Nuevo
              </Button>
            </div>

            <div className="rounded-xl border border-blue-100/50 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-sm shadow-inner">
              <ScrollShadow hideScrollBar className="max-h-[420px]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-sm border-b border-blue-100/60 dark:border-zinc-700/60 text-blue-700 dark:text-blue-300">
                    <tr className="text-left">
                      <th className="py-3 px-4 font-semibold">Código</th>
                      <th className="py-3 px-4 font-semibold">Descripción</th>
                      <th className="py-3 px-4 font-semibold">Marca</th>
                      {!hideStock && <th className="py-3 px-4 font-semibold">Stock</th>}
                      <th className="py-3 px-4 font-semibold w-32">Cantidad</th>
                      <th className="py-3 px-4 font-semibold w-14 text-center">Añadir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.length === 0 && emptyState}
                    {productos.map((producto, idx) => {
                      const lowStock = !hideStock && producto.stock <= 0;
                      return (
                        <tr
                          key={producto.codigo}
                          className={`group transition-colors ${
                            idx % 2 === 0
                              ? "bg-white/70 dark:bg-zinc-900/40"
                              : "bg-white/50 dark:bg-zinc-900/30"
                          } hover:bg-blue-50/70 dark:hover:bg-zinc-800/60`}
                        >
                          <td className="py-2.5 px-4 font-mono text-[12px] text-blue-800 dark:text-blue-200">
                            {producto.codigo}
                          </td>
                          <td className="py-2.5 px-4 text-zinc-800 dark:text-zinc-100 leading-tight">
                            {highlight(producto.descripcion)}
                          </td>
                          <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-300">
                            {producto.marca || <span className="italic text-gray-400">—</span>}
                          </td>
                          {!hideStock && (
                            <td className="py-2.5 px-4">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                                lowStock
                                  ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40"
                              }`}>
                                {producto.stock}
                              </span>
                            </td>
                          )}
                          <td className="py-2.5 px-4">
                            <NumberInput
                              min={1}
                              value={cantidades[producto.codigo]}
                              onValueChange={(value) => handleCantidadChange(producto.codigo, value)}
                              size="sm"
                              classNames={{
                                base: "max-w-[90px]",
                                inputWrapper: "bg-white/70 dark:bg-zinc-900/70 border border-blue-100/60 dark:border-zinc-700/60"
                              }}
                              isDisabled={lowStock}
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <Button
                              color="success"
                              isIconOnly
                              size="sm"
                              radius="sm"
                              variant="flat"
                              onPress={() => handleAgregarProducto(producto)}
                              isDisabled={lowStock}
                              className="opacity-90 hover:opacity-100"
                              aria-label="Agregar producto"
                            >
                              <IoMdAdd />
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

          <ModalFooter className="pt-2">
            <div className="flex w-full justify-between items-center">
              <span className="text-[11px] text-blue-600/70 dark:text-blue-300/60 font-medium">
                {isSearching ? 'Actualizando resultados…' : 'Listo'}
              </span>
              <Button
                color="default"
                variant="flat"
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