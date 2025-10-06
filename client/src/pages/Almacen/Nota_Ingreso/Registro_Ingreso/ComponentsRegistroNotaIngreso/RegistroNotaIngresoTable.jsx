import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Tooltip,
  Input,
  ScrollShadow
} from "@heroui/react";
import { FaTrash, FaBroom } from 'react-icons/fa';
import { FiBox } from 'react-icons/fi';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';

const RegistroTablaIngreso = ({
  ingresos,
  setProductosSeleccionados,
  editable = true
}) => {
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [isModalOpenEliminarTodos, setIsModalOpenEliminarTodos] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  // Métricas
  const totalProductos = ingresos.length;
  const totalUnidades = useMemo(
    () => ingresos.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0),
    [ingresos]
  );

  const openModalEliminar = (producto) => {
    setProductoAEliminar(producto);
    setIsModalOpenEliminar(true);
  };

  const closeModalEliminar = () => {
    setIsModalOpenEliminar(false);
    setProductoAEliminar(null);
  };

  const handleConfirmEliminar = () => {
    if (productoAEliminar) {
      setProductosSeleccionados(prev => prev.filter(p => p.codigo !== productoAEliminar.codigo));
    }
    closeModalEliminar();
  };

  const openModalEliminarTodos = () => setIsModalOpenEliminarTodos(true);
  const closeModalEliminarTodos = () => setIsModalOpenEliminarTodos(false);
  const handleConfirmEliminarTodos = () => {
    setProductosSeleccionados([]);
    closeModalEliminarTodos();
  };

  const actualizarCantidad = useCallback((codigo, nueva) => {
    setProductosSeleccionados(prev =>
      prev.map(p =>
        p.codigo === codigo
          ? { ...p, cantidad: nueva < 1 ? 1 : nueva }
          : p
      )
    );
  }, [setProductosSeleccionados]);

  const renderEmpty = (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-zinc-800 flex items-center justify-center border border-blue-100 dark:border-zinc-700">
        <FiBox className="text-blue-500 dark:text-blue-300 text-2xl" />
      </div>
      <p className="text-sm font-medium text-blue-700 dark:text-blue-200">Sin productos añadidos</p>
      <span className="text-xs text-blue-600/70 dark:text-blue-300/60">
        Usa el botón “Productos” para agregar ítems a la nota.
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Barra superior métricas */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/85 dark:bg-zinc-900/70 backdrop-blur-sm border border-blue-100/60 dark:border-zinc-700/60 rounded-xl px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Chip size="sm" variant="flat" color="primary" className="text-[11px]">
            Productos: {totalProductos}
          </Chip>
          <Chip size="sm" variant="flat" color="secondary" className="text-[11px]">
            Unidades: {totalUnidades}
          </Chip>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Eliminar todos" delay={500}>
            <Button
              size="sm"
              variant="flat"
              color="danger"
              startContent={<FaBroom className="text-[14px]" />}
              isDisabled={!ingresos.length}
              onPress={openModalEliminarTodos}
            >
              Limpiar
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-blue-100/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
        <ScrollShadow className="max-h-[360px]" hideScrollBar>
          <Table
            aria-label="Productos seleccionados para la nota"
            removeWrapper
            className="min-w-full"
            classNames={{
              th: "bg-blue-50/80 dark:bg-zinc-800/80 text-blue-800 dark:text-blue-200 text-[11px] font-semibold uppercase tracking-wide",
              td: "text-[13px]"
            }}
          >
            <TableHeader>
              <TableColumn className="text-center">Código</TableColumn>
              <TableColumn className="text-center min-w-[220px]">Descripción</TableColumn>
              <TableColumn className="text-center">Marca</TableColumn>
              <TableColumn className="text-center w-32">Cantidad</TableColumn>
              <TableColumn className="text-center w-20">Acción</TableColumn>
            </TableHeader>
            <TableBody emptyContent={renderEmpty}>
              {ingresos.map((p, idx) => (
                <TableRow
                  key={p.codigo}
                  className={
                    idx % 2 === 0
                      ? "bg-white/60 dark:bg-zinc-900/40 hover:bg-blue-50/60 dark:hover:bg-zinc-800/60 transition-colors"
                      : "bg-white/40 dark:bg-zinc-900/30 hover:bg-blue-50/60 dark:hover:bg-zinc-800/60 transition-colors"
                  }
                >
                  <TableCell className="text-center font-mono text-[12px] text-blue-900 dark:text-blue-100">
                    {p.codigo}
                  </TableCell>
                  <TableCell className="text-center text-zinc-700 dark:text-zinc-100">
                    {p.descripcion}
                  </TableCell>
                  <TableCell className="text-center text-zinc-600 dark:text-zinc-300">
                    {p.marca || <span className="italic text-gray-400">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {editable ? (
                      <Input
                        size="sm"
                        type="number"
                        min={1}
                        value={String(p.cantidad)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          actualizarCantidad(p.codigo, isNaN(val) ? 1 : val);
                        }}
                        classNames={{
                          inputWrapper: "bg-white/70 dark:bg-zinc-900/60 h-9",
                          input: "text-center"
                        }}
                      />
                    ) : (
                      <span className="font-semibold">{p.cantidad}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Tooltip content="Eliminar" delay={400}>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => openModalEliminar(p)}
                        aria-label={`Eliminar producto ${p.descripcion}`}
                      >
                        <FaTrash className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollShadow>
      </div>

      {/* Modales confirmación */}
      {isModalOpenEliminar && (
        <ConfirmationModal
          message={`¿Eliminar "${productoAEliminar?.descripcion}" de la lista?`}
            onClose={closeModalEliminar}
          isOpen={isModalOpenEliminar}
          onConfirm={handleConfirmEliminar}
        />
      )}
      {isModalOpenEliminarTodos && (
        <ConfirmationModal
          message="¿Eliminar todos los productos de la nota?"
          onClose={closeModalEliminarTodos}
          isOpen={isModalOpenEliminarTodos}
          onConfirm={handleConfirmEliminarTodos}
        />
      )}
    </div>
  );
};

RegistroTablaIngreso.propTypes = {
  ingresos: PropTypes.arrayOf(PropTypes.shape({
    codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    descripcion: PropTypes.string.isRequired,
    marca: PropTypes.string,
    cantidad: PropTypes.number.isRequired,
    stock: PropTypes.number
  })).isRequired,
  setProductosSeleccionados: PropTypes.func.isRequired,
  editable: PropTypes.bool
};

export default RegistroTablaIngreso;