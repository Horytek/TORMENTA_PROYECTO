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
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';

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
    <div className="w-full rounded-xl border border-blue-100 dark:border-zinc-700 overflow-hidden">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-50/40 dark:bg-zinc-800/40">
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-200">Productos seleccionados</span>
        <div className="flex gap-2">
          <Chip size="sm" variant="flat" color="primary" className="text-[10px]">{filas.length} ítems</Chip>
          <Chip size="sm" variant="flat" color="secondary" className="text-[10px]">{totalUnidades} unid.</Chip>
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
          th: "bg-blue-50/70 dark:bg-zinc-800/60 first:pl-4 last:pr-4 text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300",
          tr: "hover:bg-blue-50/50 dark:hover:bg-zinc-800/50 transition-colors",
          td: "py-2.5 px-3 first:pl-4 last:pr-4 align-middle text-[12px]"
        }}
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
            <div className="py-10 text-blue-500/80 dark:text-blue-300 text-[12px]">
              {EMPTY_MSG}
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
        <div className="flex justify-end gap-6 px-4 py-2 text-[11px] text-blue-700 dark:text-blue-300 border-t border-blue-100 dark:border-zinc-700 bg-transparent">
          <span>Total ítems: <strong>{filas.length}</strong></span>
          <span>Total unidades: <strong>{totalUnidades}</strong></span>
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