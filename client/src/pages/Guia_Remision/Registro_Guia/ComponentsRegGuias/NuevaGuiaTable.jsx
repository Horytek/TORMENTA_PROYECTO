import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaTrash, FaBroom } from 'react-icons/fa6';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Button,
  Chip,
  Input
} from '@heroui/react';
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { toast } from 'react-hot-toast';

const EMPTY_MSG = "No hay productos añadidos";

const columns = [
  { key: 'codigo', label: 'CÓDIGO', width: 110 },
  { key: 'descripcion', label: 'DESCRIPCIÓN' },
  { key: 'variant', label: 'VARIANTES', width: 100 },
  { key: 'marca', label: 'MARCA', width: 130 },
  { key: 'cantidad', label: 'CANT.', width: 110 },
  { key: 'acciones', label: 'ACCIÓN', width: 70 }
];

const NuevaTablaGuia = ({ guias = [], setProductosSeleccionados }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  const filas = useMemo(() => Array.isArray(guias)
    ? guias.map((p, i) => ({
      id: p.uniqueKey ?? `row-${i}`,
      codigo: p.codigo ?? '-',
      descripcion: p.descripcion ?? p.nombre ?? '—',
      marca: p.marca ?? p.nombre_marca ?? '—',
      cantidad: p.cantidad ?? 0,
      raw: p
    }))
    : [], [guias]);

  const totalUnidades = useMemo(
    () => filas.reduce((acc, f) => acc + (Number(f.cantidad) || 0), 0),
    [filas]
  );

  const abrirEliminar = useCallback(p => { setProductoAEliminar(p); setShowDelete(true); }, []);
  const cerrarEliminar = useCallback(() => { setProductoAEliminar(null); setShowDelete(false); }, []);
  const confirmarEliminar = useCallback(() => {
    if (productoAEliminar)
      setProductosSeleccionados(prev => prev.filter(x => x.uniqueKey !== productoAEliminar.uniqueKey));
    cerrarEliminar();
  }, [productoAEliminar, setProductosSeleccionados, cerrarEliminar]);

  const abrirEliminarTodos = useCallback(() => setShowDeleteAll(true), []);
  const cerrarEliminarTodos = useCallback(() => setShowDeleteAll(false), []);
  const confirmarEliminarTodos = useCallback(() => {
    setProductosSeleccionados([]);
    cerrarEliminarTodos();
  }, [setProductosSeleccionados, cerrarEliminarTodos]);

  const actualizarCantidad = useCallback((uniqueKey, nueva) => {
    setProductosSeleccionados(prev => {
      const item = prev.find(p => p.uniqueKey === uniqueKey);
      if (!item) return prev;

      const stockMax = Number(item.stock_disponible ?? item.stock ?? 0);
      let next = Number(nueva);
      if (!Number.isFinite(next)) next = 1;
      if (next < 1) next = 1;

      if (stockMax > 0 && next > stockMax) {
        toast.error(`Stock insuficiente. Máximo: ${stockMax}`);
        next = stockMax;
      }

      return prev.map(p => (p.uniqueKey === uniqueKey ? { ...p, cantidad: next } : p));
    });
  }, [setProductosSeleccionados]);

  const renderCell = useCallback((item, key) => {
    switch (key) {
      case 'codigo':
        return <span className="font-mono text-[11px] text-blue-700 dark:text-blue-200">{item.codigo}</span>;
      case 'variant':
        return (
          <div className="flex flex-col gap-0.5">
            {item.raw.resolvedAttributes && Array.isArray(item.raw.resolvedAttributes) ? (
              <div className="flex flex-wrap gap-1">
                {item.raw.resolvedAttributes.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded-full border border-slate-200 dark:border-zinc-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400">{attr.label}</span>
                    {attr.hex ? (
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: attr.hex }}></span>
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{attr.value}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{attr.value}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (item.raw.resolvedAttributes && !Array.isArray(item.raw.resolvedAttributes)) ? (
              <div className="flex flex-wrap gap-1">
                {Object.entries(item.raw.resolvedAttributes).map(([key, val]) => (
                  <span key={key} className="text-[10px] text-slate-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                    <span className="font-bold">{key}:</span> {val}
                  </span>
                ))}
              </div>
            ) : item.raw.sku_label ? (
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 rounded px-1 w-fit">{item.raw.sku_label}</span>
            ) : (
              <>
                {item.raw.nombre_talla && <span className="text-[11px] font-bold text-slate-600 bg-slate-100 rounded px-1 w-fit">{item.raw.nombre_talla}</span>}
                {item.raw.nombre_tonalidad && <span className="text-[10px] text-slate-500">{item.raw.nombre_tonalidad}</span>}
                {!item.raw.nombre_talla && !item.raw.nombre_tonalidad && <span className="text-slate-300">-</span>}
              </>
            )}
          </div>
        );
      case 'descripcion':
        return <span className="text-[12px] text-slate-700 dark:text-slate-100 leading-snug line-clamp-2">{item.descripcion}</span>;
      case 'marca':
        return <span className="text-[12px] text-slate-500 dark:text-slate-300">{item.marca}</span>;
      case 'cantidad':
        return (
          <Input
            size="sm"
            type="number"
            min={1}
            max={Number(item.raw.stock_disponible ?? item.raw.stock ?? 0) || undefined}
            value={String(item.cantidad ?? 1)}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              actualizarCantidad(item.raw.uniqueKey, Number.isNaN(val) ? 1 : val);
            }}
            classNames={{
              inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 h-8 shadow-sm",
              input: "text-center font-bold text-slate-700 dark:text-white"
            }}
          />
        );
      case 'acciones':
        return (
          <Tooltip content="Eliminar" color="danger" size="sm">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => abrirEliminar(item.raw)}
              aria-label="Eliminar"
            >
              <FaTrash className="w-3.5 h-3.5" />
            </Button>
          </Tooltip>
        );
      default: return null;
    }
  }, [abrirEliminar, actualizarCantidad]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-zinc-800/30 border-b border-slate-100 dark:border-zinc-800">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Productos seleccionados</span>
        <div className="flex gap-2 items-center">
          <Chip size="sm" variant="flat" classNames={{ base: "h-5 bg-slate-200/50 dark:bg-zinc-700/50", content: "text-[10px] font-semibold text-slate-600 dark:text-slate-300" }}>{filas.length} ÍTEMS</Chip>
          <Chip size="sm" variant="flat" classNames={{ base: "h-5 bg-indigo-50 dark:bg-indigo-900/20", content: "text-[10px] font-semibold text-indigo-600 dark:text-indigo-400" }}>{totalUnidades} UNID.</Chip>
          <Tooltip content="Limpiar" color="danger" size="sm">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="h-7 w-7 min-w-7 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
              isDisabled={!filas.length}
              onPress={abrirEliminarTodos}
              aria-label="Limpiar"
            >
              <FaBroom className="w-3.5 h-3.5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Tabla (sin capas extra ni bg-white duplicado) */}
      <Table
        aria-label="Tabla productos guía"
        removeWrapper
        selectionMode="none"
        classNames={{
          base: "bg-transparent",
          table: "bg-transparent",
          thead: "bg-transparent",
          th: "bg-white dark:bg-zinc-900/50 text-slate-500 font-semibold text-[10px] uppercase tracking-wider h-8 border-b border-slate-100 dark:border-zinc-800",
          tr: "hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors border-b border-slate-50 dark:border-zinc-800/50 last:border-0",
          td: "py-2 px-4 align-middle text-[12px]"
        }}
        radius="none"
        shadow="none"
        isCompact
      >
        <TableHeader columns={columns}>
          {(col) => (
            <TableColumn key={col.key} width={col.width} className="whitespace-nowrap">
              {col.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <p className="text-sm font-medium">{EMPTY_MSG}</p>
            </div>
          }
          items={filas}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(colKey) => <TableCell>{renderCell(item, colKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Footer solo si hay filas */}
      {filas.length > 0 && (
        <div className="flex justify-end gap-6 px-4 py-3 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-zinc-800/20 border-t border-slate-100 dark:border-zinc-800">
          <span>Total ítems: <strong className="text-slate-800 dark:text-white">{filas.length}</strong></span>
          <span>Total unidades: <strong className="text-indigo-600 dark:text-indigo-400">{totalUnidades}</strong></span>
        </div>
      )}

      {showDelete && (
        <ConfirmationModal
          isOpen={showDelete}
          onClose={cerrarEliminar}
          onConfirm={confirmarEliminar}
          title="Confirmación"
          message="¿Eliminar producto?"
        />
      )}

      {showDeleteAll && (
        <ConfirmationModal
          isOpen={showDeleteAll}
          onClose={cerrarEliminarTodos}
          onConfirm={confirmarEliminarTodos}
          title="Confirmación"
          message="¿Eliminar todos los productos de la lista?"
        />
      )}
    </div>
  );
};

NuevaTablaGuia.propTypes = {
  guias: PropTypes.arrayOf(PropTypes.shape({
    codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    descripcion: PropTypes.string,
    marca: PropTypes.string,
    cantidad: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })),
  setProductosSeleccionados: PropTypes.func.isRequired
};

export default React.memo(NuevaTablaGuia);