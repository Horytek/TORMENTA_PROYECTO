import { Select, SelectItem, Button, Chip } from "@heroui/react";
import { FiFilter, FiX } from "react-icons/fi";
import { useState } from "react";

export default function FilterControls({
    roles,
    onFilterChange,
    activeFilters
}) {
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedConnection, setSelectedConnection] = useState("");

    const handleRoleChange = (value) => {
        setSelectedRole(value);
        onFilterChange({ ...activeFilters, role: value });
    };

    const handleStatusChange = (value) => {
        setSelectedStatus(value);
        onFilterChange({ ...activeFilters, status: value });
    };

    const handleConnectionChange = (value) => {
        setSelectedConnection(value);
        onFilterChange({ ...activeFilters, connection: value });
    };

    const clearFilters = () => {
        setSelectedRole("");
        setSelectedStatus("");
        setSelectedConnection("");
        onFilterChange({});
    };

    const hasActiveFilters = selectedRole || selectedStatus || selectedConnection;

    return (
        <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-blue-900/10 rounded-xl border border-gray-200 dark:border-blue-800/30">
            {/* Header & Dropdowns */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-1 md:mb-0">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <FiFilter className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold">Filtros Avanzados</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 flex-1 md:justify-end">
                    <Select
                        label="Rol"
                        placeholder="Seleccionar rol"
                        size="sm"
                        className="w-full md:w-40"
                        classNames={{
                            trigger: "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm",
                        }}
                        selectedKeys={selectedRole ? [selectedRole] : []}
                        onSelectionChange={(keys) => handleRoleChange(Array.from(keys)[0] || "")}
                    >
                        {roles.map((role) => (
                            <SelectItem key={role.id_rol} value={role.id_rol}>
                                {role.nom_rol}
                            </SelectItem>
                        ))}
                    </Select>

                    <Select
                        label="Estado"
                        placeholder="Todos"
                        size="sm"
                        className="w-full md:w-36"
                        classNames={{
                            trigger: "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm",
                        }}
                        selectedKeys={selectedStatus ? [selectedStatus] : []}
                        onSelectionChange={(keys) => handleStatusChange(Array.from(keys)[0] || "")}
                    >
                        <SelectItem key="1" value="1">Activo</SelectItem>
                        <SelectItem key="0" value="0">Inactivo</SelectItem>
                    </Select>

                    <Select
                        label="Conexión"
                        placeholder="Todos"
                        size="sm"
                        className="w-full md:w-36"
                        classNames={{
                            trigger: "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm",
                        }}
                        selectedKeys={selectedConnection ? [selectedConnection] : []}
                        onSelectionChange={(keys) => handleConnectionChange(Array.from(keys)[0] || "")}
                    >
                        <SelectItem key="1" value="1">Conectado</SelectItem>
                        <SelectItem key="0" value="0">Desconectado</SelectItem>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            startContent={<FiX />}
                            onClick={clearFilters}
                            className="h-10 md:h-12"
                        >
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200 dark:bg-blue-800/30 w-full" />

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                    Vistas rápidas:
                </span>
                <Chip
                    size="sm"
                    variant="flat"
                    className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                    onClick={() => clearFilters()}
                >
                    Todos
                </Chip>
                <Chip
                    size="sm"
                    variant="flat"
                    color="success"
                    className="cursor-pointer hover:opacity-80 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    onClick={() => {
                        setSelectedStatus("1");
                        onFilterChange({ status: "1" });
                    }}
                >
                    Solo Activos
                </Chip>
                <Chip
                    size="sm"
                    variant="flat"
                    color="danger"
                    className="cursor-pointer hover:opacity-80 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                    onClick={() => {
                        setSelectedStatus("0");
                        onFilterChange({ status: "0" });
                    }}
                >
                    Solo Inactivos
                </Chip>
                <Chip
                    size="sm"
                    variant="flat"
                    color="secondary"
                    className="cursor-pointer hover:opacity-80 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                    onClick={() => {
                        setSelectedConnection("1");
                        onFilterChange({ connection: "1" });
                    }}
                >
                    Conectados Ahora
                </Chip>
            </div>
        </div>
    );
}
