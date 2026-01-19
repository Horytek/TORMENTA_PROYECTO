import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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

const EMPTY_MSG = "No hay productos cargados";
const NO_MATCHES_MSG = "No hay coincidencias con el filtro actual";

const ModalBuscarProducto = ({
  isOpen,
  onClose,
  productos,
  agregarProducto,
  loading = false
}) => {
  // UI / filtros
  const [cantidades, setCantidades] = useState({});
  const [searchDescripcion, setSearchDescripcion] = useState('');
  const [searchCodigo, setSearchCodigo] = useState('');
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  // Debounce refs
  const descTimerRef = useRef(null);
  const codTimerRef = useRef(null);
  const firstInputRef = useRef(null);

  // Inicializa cantidades al abrir
  useEffect(() => {
    if (isOpen) {
      const base = {};
      productos.forEach(p => { base[p.codigo] = 1; });
      setCantidades(base);
      setInternalLoading(false);
      // Focus en primer input tras animación
      setTimeout(() => {
        try { firstInputRef.current?.focus(); } catch { }
      }, 60);
    } else {
      setSearchDescripcion('');
      setSearchCodigo('');
    }
  }, [isOpen, productos]);

  // Handlers con debounce
  const handleDescripcionChange = (val) => {
    clearTimeout(descTimerRef.current);
    descTimerRef.current = setTimeout(() => setSearchDescripcion(val), 300);
  };
  const handleCodigoChange = (val) => {
    clearTimeout(codTimerRef.current);
    codTimerRef.current = setTimeout(() => setSearchCodigo(val), 300);
  };

  // Filtro memoizado
  const filteredProductos = useMemo(() => {
    const desc = searchDescripcion.trim().toLowerCase();
    const cod = searchCodigo.trim().toLowerCase();
    if (!desc && !cod) return productos;
    return productos.filter(p => {
      const d = (p.descripcion || '').toLowerCase();
      const cb = (p.codbarras || '').toLowerCase();
      const matchDesc = !desc || d.includes(desc);
      const matchCod = !cod || cb.includes(cod);
      return matchDesc && matchCod;
    });
  }, [productos, searchDescripcion, searchCodigo]);

  // Cantidad
  const updateCantidad = useCallback((codigo, value) => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0) {
      setCantidades(prev => ({ ...prev, [codigo]: n }));
    }
  }, []);

  // Agregar
  const handleAgregarProducto = useCallback((producto) => {
    const solicitada = cantidades[producto.codigo] || 1;
    if (solicitada > producto.stock) {
      toast.error(`Cantidad (${solicitada}) excede stock (${producto.stock}).`);
      return;
    }
    agregarProducto(producto, solicitada);
  }, [cantidades, agregarProducto]);

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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        backdrop="blur"
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-sm",
          base: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl",
          header: "border-b border-slate-100 dark:border-zinc-800 py-4",
          footer: "border-t border-slate-100 dark:border-zinc-800 py-3",
          closeButton: "hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center gap-4 bg-slate-50/50 dark:bg-zinc-800/10">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                Buscar producto
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Busca y agrega productos a la guía de remisión
              </p>
            </div>
            <div className="flex gap-2 mr-6">
              <Chip size="sm" variant="flat" color="primary" className="font-semibold text-[10px] h-6">
                {productos.length} TOTAL
              </Chip>
              {filteredProductos.length !== productos.length && (
                <Chip size="sm" variant="dot" color="secondary" className="font-semibold text-[10px] h-6 border-none">
                  {filteredProductos.length} FILTRADOS
                </Chip>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="p-6">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-3 mb-4">
              <Input
                ref={firstInputRef}
                size="md"
                variant="faded"
                radius="lg"
                startContent={<FaSearch className="w-4 h-4 text-slate-400" />}
                placeholder="Buscar por descripción..."
                aria-label="Buscar por descripción"
                onChange={(e) => handleDescripcionChange(e.target.value)}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                }}
              />
              <Input
                size="md"
                variant="faded"
                radius="lg"
                startContent={<FaBarcode className="w-4 h-4 text-slate-400" />}
                placeholder="Código de barras..."
                aria-label="Buscar por código de barras"
                onChange={(e) => handleCodigoChange(e.target.value)}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                }}
              />
              <Button
                size="md"
                color="primary"
                onPress={openNuevoProducto}
                className="w-full md:w-auto font-medium shadow-sm"
                startContent={<IoMdAdd className="text-lg" />}
                radius="lg"
              >
                Nuevo
              </Button>
            </div>

            {/* Tabla */}
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
              <ScrollShadow className="h-[400px] w-full" hideScrollBar>
                <Table
                  aria-label="Tabla de búsqueda de productos"
                  removeWrapper
                  radius="none"
                  classNames={{
                    base: "min-w-full",
                    table: "min-w-full",
                    thead: "sticky top-0 z-20 bg-slate-50 dark:bg-zinc-800",
                    th: "bg-slate-50 dark:bg-zinc-800/50 text-slate-500 font-semibold text-[10px] uppercase tracking-wider h-8 border-b border-slate-100 dark:border-zinc-800",
                    td: "py-2 px-4 border-b border-slate-50 dark:border-zinc-800/50",
                    tr: "hover:bg-slate-50/60 dark:hover:bg-zinc-800/50 transition-colors"
                  }}
                  shadow="none"
                  isCompact
                >
                  <TableHeader>
                    <TableColumn className="w-24">CÓDIGO</TableColumn>
                    <TableColumn>DESCRIPCIÓN</TableColumn>
                    <TableColumn className="w-32">MARCA</TableColumn>
                    <TableColumn className="text-center w-24">STOCK</TableColumn>
                    <TableColumn className="text-center w-32">CANTIDAD</TableColumn>
                    <TableColumn className="text-center w-20">ACCIÓN</TableColumn>
                  </TableHeader>
                  <TableBody
                    items={filteredProductos}
                    emptyContent={
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                        <FaSearch className="text-4xl mb-3 opacity-20" />
                        <p className="text-sm font-medium text-slate-500">
                          {listStatus === 'empty' ? EMPTY_MSG : NO_MATCHES_MSG}
                        </p>
                      </div>
                    }
                    isLoading={listStatus === 'loading'}
                    loadingContent={<Spinner label="Cargando productos..." />}
                  >
                    {(item) => (
                      <TableRow key={item.codigo}>
                        <TableCell>
                          <span className="font-mono text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {item.codigo}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {item.descripcion}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">
                            {item.marca || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${item.stock > 10 ? "bg-emerald-500" : item.stock > 0 ? "bg-amber-500" : "bg-rose-500"}`} />
                            <span className={`text-[11px] font-bold ${item.stock > 0 ? "text-slate-600 dark:text-slate-300" : "text-rose-500"}`}>
                              {item.stock}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Input
                              type="number"
                              size="sm"
                              variant="flat"
                              min={1}
                              value={cantidades[item.codigo] ?? 1}
                              onValueChange={(val) => updateCantidad(item.codigo, val)}
                              className="w-16"
                              classNames={{
                                input: "text-center font-bold text-slate-700 dark:text-white text-[12px]",
                                inputWrapper: "h-7 min-h-7 bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-md"
                              }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Tooltip content="Agregar a la guía" color="success" size="sm" closeDelay={0}>
                              <Button
                                isIconOnly
                                size="sm"
                                className="w-7 h-7 min-w-7 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-md transition-colors"
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
          </ModalBody>


          <ModalFooter>
            <Button size="sm" color="default" variant="flat" onPress={onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {showNuevoProducto && (
        <ProductosForm
          modalTitle="Nuevo Producto"
          onClose={closeNuevoProducto}
        />
      )}
    </>
  );
};

ModalBuscarProducto.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  productos: PropTypes.array.isRequired,
  agregarProducto: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default ModalBuscarProducto;