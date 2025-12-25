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
  NumberInput,
  Chip,
  Tooltip,
  Spinner
} from '@heroui/react';
import { ScrollShadow } from '@heroui/react';
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
          backdrop: "bg-black/30 backdrop-blur-sm",
          base: "bg-white dark:bg-zinc-900 border border-blue-100/50 dark:border-zinc-700/60",
          header: "border-b border-blue-100/60 dark:border-zinc-700/60",
          footer: "border-t border-blue-100/60 dark:border-zinc-700/60"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-100">
              Buscar producto
            </h2>
            <div className="flex gap-2">
              <Chip size="sm" variant="flat" color="primary" className="text-[10px]">
                {productos.length} total
              </Chip>
              {filteredProductos.length !== productos.length && (
                <Chip size="sm" variant="flat" color="secondary" className="text-[10px]">
                  {filteredProductos.length} filtrados
                </Chip>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="pt-4">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-3 mb-2">
              <Input
                ref={firstInputRef}
                size="sm"
                startContent={<FaSearch className="w-4 h-4 text-blue-400" />}
                placeholder="Descripción"
                aria-label="Buscar por descripción"
                onChange={(e) => handleDescripcionChange(e.target.value)}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "bg-white dark:bg-zinc-800"
                }}
              />
              <Input
                size="sm"
                startContent={<FaBarcode className="w-4 h-4 text-blue-400" />}
                placeholder="Código de barras"
                aria-label="Buscar por código de barras"
                onChange={(e) => handleCodigoChange(e.target.value)}
                classNames={{
                  input: "text-sm",
                  inputWrapper: "bg-white dark:bg-zinc-800"
                }}
              />
              <Button
                size="sm"
                color="success"
                onPress={openNuevoProducto}
                className="w-full md:w-auto font-medium"
                startContent={<IoMdAdd className="text-base" />}
              >
                Nuevo
              </Button>
            </div>

            {/* Tabla */}
            <div className="rounded-lg border border-blue-100/70 dark:border-zinc-700/60 overflow-hidden">
              <ScrollShadow hideScrollBar className="max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50/80 dark:bg-zinc-800/70 text-[11px] uppercase tracking-wide text-blue-600 dark:text-blue-300">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold">Código</th>
                      <th className="py-2 px-3 text-left font-semibold">Descripción</th>
                      <th className="py-2 px-3 text-left font-semibold">Marca</th>
                      <th className="py-2 px-3 text-left font-semibold">Stock</th>
                      <th className="py-2 px-3 text-center font-semibold">Cantidad</th>
                      <th className="py-2 px-3 text-center font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100/60 dark:divide-zinc-700/60">
                    {listStatus === 'loading' && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center">
                          <Spinner size="sm" color="primary" />
                          <span className="ml-2 text-blue-600 dark:text-blue-300 text-xs">Cargando...</span>
                        </td>
                      </tr>
                    )}

                    {listStatus === 'empty' && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-blue-500 dark:text-blue-300 text-xs font-medium">
                          {EMPTY_MSG}
                        </td>
                      </tr>
                    )}

                    {listStatus === 'no-matches' && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-blue-500 dark:text-blue-300 text-xs font-medium">
                          {NO_MATCHES_MSG}
                        </td>
                      </tr>
                    )}

                    {listStatus === 'ok' && filteredProductos.map(prod => (
                      <tr
                        key={prod.codigo}
                        className="hover:bg-blue-50/60 dark:hover:bg-zinc-800/60 transition-colors"
                      >
                        <td className="py-2 px-3 font-mono text-[11px] text-blue-800 dark:text-blue-200">
                          {prod.codigo}
                        </td>
                        <td className="py-2 px-3 text-blue-900 dark:text-blue-100">
                          <span className="line-clamp-2 leading-snug">{prod.descripcion}</span>
                        </td>
                        <td className="py-2 px-3 text-blue-600 dark:text-blue-300">
                          {prod.marca || '—'}
                        </td>
                        <td className="py-2 px-3">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={prod.stock > 0 ? "primary" : "danger"}
                            className="text-[10px] font-medium"
                          >
                            {prod.stock}
                          </Chip>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <NumberInput
                            size="sm"
                            min={1}
                            value={cantidades[prod.codigo] ?? 1}
                            aria-label={`Cantidad para ${prod.descripcion}`}
                            onValueChange={(val) => updateCantidad(prod.codigo, val)}
                            className="inline-flex w-[90px]"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Tooltip content="Agregar" color="success" size="sm">
                            <Button
                              isIconOnly
                              size="sm"
                              color="success"
                              variant="flat"
                              onPress={() => handleAgregarProducto(prod)}
                              aria-label={`Agregar ${prod.descripcion}`}
                            >
                              <IoMdAdd />
                            </Button>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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