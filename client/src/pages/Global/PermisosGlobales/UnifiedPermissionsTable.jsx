
import React, { useMemo, useState } from 'react';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Checkbox, Spinner, Button, Tooltip, Input, Chip, Card, CardBody
} from "@heroui/react";
import {
    FaFolder, FaFileAlt, FaSearch, FaEye, FaEdit, FaBolt,
    FaCheckDouble, FaTrashAlt, FaBan, FaCog
} from "react-icons/fa";

const ACTIONS_CONFIG = [
    { key: 'ver', label: 'Ver', color: 'primary' },
    { key: 'crear', label: 'Crear', color: 'success' },
    { key: 'editar', label: 'Editar', color: 'warning' },
    { key: 'eliminar', label: 'Eliminar', color: 'danger' },
    { key: 'desactivar', label: 'Desactivar', color: 'default' },
    { key: 'generar', label: 'Generar', color: 'secondary' }
];

export const UnifiedPermissionsTable = ({ data, loading, isSaving = false, onToggle, onSave, onConfigure }) => {
    const [searchTerm, setSearchTerm] = useState("");

    // --- Logic Helpers ---

    const applyPreset = (item, preset) => {
        const presets = {
            'readonly': ['ver'],
            'editor': ['ver', 'crear', 'editar'],
            'full': ['ver', 'crear', 'editar', 'eliminar', 'desactivar', 'generar'],
            'none': []
        };

        const targetActions = presets[preset] || [];

        ACTIONS_CONFIG.forEach(action => {
            if (item.availableActions.includes(action.key)) {
                const shouldBeChecked = targetActions.includes(action.key);
                if (!!item.permissions[action.key] !== shouldBeChecked) {
                    onToggle(item.uniqueId, action.key, shouldBeChecked);
                }
            }
        });
    };

    // --- Memoized Data Processing ---

    const filteredItems = useMemo(() => {
        const items = [];
        const lowerSearch = searchTerm.toLowerCase();

        const traverse = (nodes, level = 0, parentMatches = false) => {
            nodes.forEach(node => {
                const matches = node.name.toLowerCase().includes(lowerSearch);
                const showRow = matches || parentMatches || searchTerm === "";

                if (showRow) {
                    items.push({
                        ...node,
                        level
                    });
                }

                if (node.children) {
                    traverse(node.children, level + 1, matches || parentMatches);
                }
            });
        };
        traverse(data);
        return items;
    }, [data, searchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Spinner size="lg" color="primary" />
                <p className="text-slate-500 font-medium">Cargando estructura...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-10">
            {/* --- Controls Bar --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <div className="w-full md:w-96">
                    <Input
                        placeholder="Buscar módulo..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        startContent={<FaSearch className="text-slate-400" />}
                        radius="lg"
                        variant="flat"
                        classNames={{
                            inputWrapper: "bg-white dark:bg-zinc-800 shadow-sm"
                        }}
                    />
                </div>

                <div className="flex gap-3">
                    <Button
                        color="primary"
                        onPress={onSave}
                        isLoading={isSaving}
                        isDisabled={isSaving}
                        className="shadow-lg shadow-blue-500/30 font-semibold px-8"
                        size="md"
                        radius="lg"
                        startContent={!isSaving && <FaCheckDouble />}
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            {/* --- Hints / Legend --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 shadow-none">
                    <CardBody className="flex flex-row items-center gap-3 p-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600">
                            <FaEye />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Solo Lectura</p>
                            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Activa solo "Ver"</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 shadow-none">
                    <CardBody className="flex flex-row items-center gap-3 p-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600">
                            <FaBolt />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Control Total</p>
                            <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70">Activa todas las acciones</p>
                        </div>
                    </CardBody>
                </Card>

                <Card className="bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700/50 shadow-none">
                    <CardBody className="flex flex-row items-center gap-3 p-3">
                        <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-500">
                            <FaCog />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Configurar Acciones</p>
                            <p className="text-[10px] text-slate-500/70 dark:text-slate-400/70">Activa permisos extra</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* --- Table --- */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                <Table
                    aria-label="Tabla de Permisos"
                    isStriped
                    removeWrapper
                    layout="fixed"
                    classNames={{
                        th: "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider py-3 text-center first:text-left first:pl-8 h-10",
                        td: "py-1.5 border-b border-slate-100 dark:border-zinc-800/50 h-12"
                    }}
                >
                    <TableHeader>
                        <TableColumn width={320} className="pl-6">Módulo / Recurso</TableColumn>
                        <TableColumn width={160}>Acciones Rápidas</TableColumn>
                        {ACTIONS_CONFIG.map(action => (
                            <TableColumn key={action.key}>{action.label}</TableColumn>
                        ))}
                    </TableHeader>
                    <TableBody items={filteredItems} emptyContent="No se encontraron módulos.">
                        {(item) => (
                            <TableRow key={item.uniqueId}>
                                {/* Name Column */}
                                <TableCell>
                                    <div
                                        style={{ paddingLeft: `${item.level * 28}px` }}
                                        className="flex items-center gap-3 relative"
                                    >
                                        {/* Connector Lines */}
                                        {item.level > 0 && (
                                            <div className="absolute w-px h-[200%] bg-slate-200 dark:bg-zinc-700 -top-full"
                                                style={{ left: `${(item.level * 28) - 14}px` }}
                                            />
                                        )}
                                        {item.level > 0 && (
                                            <div className="absolute w-3 h-px bg-slate-200 dark:bg-zinc-700 top-1/2"
                                                style={{ left: `${(item.level * 28) - 14}px` }}
                                            />
                                        )}

                                        {/* Icon */}
                                        <div className={`
                                            flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md shadow-sm
                                            ${item.type === 'modulo'
                                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}
                                        `}>
                                            {item.type === 'modulo' ? <FaFolder size={12} /> : <FaFileAlt size={10} />}
                                        </div>

                                        {/* Text */}
                                        <div className="flex flex-col">
                                            <span className={`
                                                ${item.type === 'modulo'
                                                    ? 'font-bold text-slate-800 dark:text-slate-100 text-sm'
                                                    : 'font-medium text-slate-600 dark:text-slate-300 text-xs'}
                                            `}>
                                                {item.name}
                                            </span>
                                        </div>

                                        {/* Config Button (Only for admins/devs if passed) */}
                                        {onConfigure && (
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="ml-auto text-slate-400 hover:text-blue-600 h-6 w-6 min-w-6"
                                                onPress={() => onConfigure(item)}
                                            >
                                                <FaCog size={12} />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Quick Actions Column */}
                                <TableCell>
                                    <div className="flex justify-center gap-1 group-hover:opacity-100 transition-opacity">
                                        <Tooltip content="Sin Acceso" delay={0} closeDelay={0}>
                                            <Button isIconOnly size="sm" variant="light" color="default" onPress={() => applyPreset(item, 'none')} className="opacity-50 hover:opacity-100 h-7 w-7 min-w-7"><FaBan size={10} /></Button>
                                        </Tooltip>
                                        <Tooltip content="Solo Lectura" delay={0} closeDelay={0}>
                                            <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => applyPreset(item, 'readonly')} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 h-7 w-7 min-w-7"><FaEye size={12} /></Button>
                                        </Tooltip>
                                        <Tooltip content="Control Total" delay={0} closeDelay={0}>
                                            <Button isIconOnly size="sm" variant="flat" color="secondary" onPress={() => applyPreset(item, 'full')} className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 h-7 w-7 min-w-7"><FaBolt size={12} /></Button>
                                        </Tooltip>
                                    </div>
                                </TableCell>

                                {/* Checkboxes Columns */}
                                {ACTIONS_CONFIG.map(action => {
                                    const isAvailable = item.availableActions.includes(action.key);
                                    const isChecked = !!item.permissions[action.key];

                                    return (
                                        <TableCell key={action.key}>
                                            <div className="flex justify-center">
                                                {isAvailable ? (
                                                    <Checkbox
                                                        isSelected={isChecked}
                                                        color={action.color}
                                                        onValueChange={(val) => onToggle(item.uniqueId, action.key, val)}
                                                        radius="full"
                                                        size="sm" // Smaller checkbox
                                                        classNames={{
                                                            wrapper: `w-5 h-5 ${isChecked ? "" : "bg-slate-100 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700"}`
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-slate-200 dark:text-zinc-800 text-lg">·</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
