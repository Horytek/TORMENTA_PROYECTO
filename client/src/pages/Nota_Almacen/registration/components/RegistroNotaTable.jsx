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
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const RegistroNotaTable = ({
    productos,
    setProductosSeleccionados,
    editable = true
}) => {
    const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
    const [isModalOpenEliminarTodos, setIsModalOpenEliminarTodos] = useState(false);
    const [productoAEliminar, setProductoAEliminar] = useState(null);

    // Métricas
    const totalProductos = productos.length;
    const totalUnidades = useMemo(
        () => productos.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0),
        [productos]
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
            <p className="text-sm font-medium text-blue-700 dark:text-blue-200">Sin productos seleccionados</p>
            <span className="text-xs text-blue-600/70 dark:text-blue-300/60">
                Añada ítems a la lista para procesar la nota.
            </span>
        </div>
    );

    return (
        <div className="space-y-0">
            {/* Barra superior métricas */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20">
                <div className="flex flex-wrap gap-2">
                    <Chip size="sm" variant="flat" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-bold h-7">
                        Items: {totalProductos}
                    </Chip>
                    <Chip size="sm" variant="flat" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 font-bold h-7">
                        Unidades: {totalUnidades}
                    </Chip>
                </div>
                <div className="flex gap-2">
                    <Tooltip content="Eliminar todo" delay={500}>
                        <Button
                            size="sm"
                            variant="flat"
                            className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 font-bold"
                            startContent={<FaBroom className="text-[14px]" />}
                            isDisabled={!productos.length}
                            onPress={openModalEliminarTodos}
                        >
                            Limpiar
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-zinc-900">
                <ScrollShadow className="max-h-[500px]" hideScrollBar>
                    <Table
                        aria-label="Productos de la nota"
                        removeWrapper
                        className="min-w-full"
                        classNames={{
                            th: "bg-blue-50/50 dark:bg-zinc-800/80 text-blue-800 dark:text-blue-300 text-[11px] font-bold uppercase tracking-wider h-10 first:pl-6 last:pr-6",
                            td: "text-[13px] py-3 first:pl-6 last:pr-6 border-b border-slate-50 dark:border-zinc-800/50",
                            tr: "hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                        }}
                    >
                        <TableHeader>
                            <TableColumn className="text-left w-32">CÓDIGO</TableColumn>
                            <TableColumn className="text-left min-w-[220px]">DESCRIPCIÓN</TableColumn>
                            <TableColumn className="text-center w-32">MARCA</TableColumn>
                            <TableColumn className="text-center w-32">CANTIDAD</TableColumn>
                            <TableColumn className="text-center w-20">ACCIÓN</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent={renderEmpty}>
                            {productos.map((p, idx) => (
                                <TableRow key={`${p.codigo}-${idx}`}>
                                    <TableCell className="text-left font-bold text-slate-700 dark:text-slate-200">
                                        {p.codigo}
                                    </TableCell>
                                    <TableCell className="text-left text-slate-600 dark:text-slate-300 font-medium">
                                        {p.descripcion}
                                    </TableCell>
                                    <TableCell className="text-center text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                                        {p.marca || '-'}
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
                                                    inputWrapper: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 h-8 shadow-sm",
                                                    input: "text-center font-bold text-slate-700 dark:text-white"
                                                }}
                                            />
                                        ) : (
                                            <span className="font-bold text-slate-700 dark:text-white">{p.cantidad}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Tooltip content="Eliminar item" delay={400}>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="text-slate-400 hover:text-red-500"
                                                onPress={() => openModalEliminar(p)}
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
                    message={`¿Eliminar "${productoAEliminar?.descripcion}"?`}
                    onClose={closeModalEliminar}
                    isOpen={isModalOpenEliminar}
                    onConfirm={handleConfirmEliminar}
                />
            )}
            {isModalOpenEliminarTodos && (
                <ConfirmationModal
                    message="¿Eliminar todos los productos de la lista?"
                    onClose={closeModalEliminarTodos}
                    isOpen={isModalOpenEliminarTodos}
                    onConfirm={handleConfirmEliminarTodos}
                />
            )}
        </div>
    );
};

RegistroNotaTable.propTypes = {
    productos: PropTypes.array.isRequired,
    setProductosSeleccionados: PropTypes.func.isRequired,
    editable: PropTypes.bool
};

export default RegistroNotaTable;
