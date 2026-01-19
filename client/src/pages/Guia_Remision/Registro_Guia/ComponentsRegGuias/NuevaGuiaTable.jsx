import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FaTrash } from 'react-icons/fa6';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Button,
  Chip
} from '@heroui/react';
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

const EMPTY_MSG = "No hay productos añadidos";

const columns = [
  { key: 'codigo', label: 'CÓDIGO', width: 110 },
  { key: 'descripcion', label: 'DESCRIPCIÓN' },
  { key: 'marca', label: 'MARCA', width: 130 },
  { key: 'cantidad', label: 'CANT.', width: 70 },
  { key: 'acciones', label: 'ACCIÓN', width: 70 }
];

const NuevaTablaGuia = ({ guias = [], setProductosSeleccionados }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const filas = useMemo(() => Array.isArray(guias)
    ? guias.map((p, i) => ({
      id: p.codigo ?? `row-${i}`,
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
      setProductosSeleccionados(prev => prev.filter(x => x.codigo !== productoAEliminar.codigo));
    cerrarEliminar();
  }, [productoAEliminar, setProductosSeleccionados, cerrarEliminar]);

  const renderCell = useCallback((item, key) => {
    switch (key) {
      case 'codigo':
        return <span className="font-mono text-[11px] text-blue-700 dark:text-blue-200">{item.codigo}</span>;
      case 'descripcion':
        return <span className="text-[12px] text-slate-700 dark:text-slate-100 leading-snug line-clamp-2">{item.descripcion}</span>;
      case 'marca':
        return <span className="text-[12px] text-slate-500 dark:text-slate-300">{item.marca}</span>;
      case 'cantidad':
        return <Chip size="sm" variant="flat" color="primary" className="text-[11px]">{item.cantidad}</Chip>;
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
  }, [abrirEliminar]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-zinc-800/30 border-b border-slate-100 dark:border-zinc-800">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Productos seleccionados</span>
        <div className="flex gap-2">
          <Chip size="sm" variant="flat" classNames={{ base: "h-5 bg-slate-200/50 dark:bg-zinc-700/50", content: "text-[10px] font-semibold text-slate-600 dark:text-slate-300" }}>{filas.length} ÍTEMS</Chip>
          <Chip size="sm" variant="flat" classNames={{ base: "h-5 bg-indigo-50 dark:bg-indigo-900/20", content: "text-[10px] font-semibold text-indigo-600 dark:text-indigo-400" }}>{totalUnidades} UNID.</Chip>
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