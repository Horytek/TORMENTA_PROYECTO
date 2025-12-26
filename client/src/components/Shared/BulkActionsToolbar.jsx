import { Button, Tooltip } from "@heroui/react";
import { FaCheck, FaBan, FaTrash, FaTimes } from "react-icons/fa";

export default function BulkActionsToolbar({
    selectedCount,
    onActivate,
    onDeactivate,
    onDelete,
    onClearSelection
}) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
            <div className="bg-white dark:bg-zinc-800 shadow-2xl rounded-full px-6 py-3 border border-blue-100 dark:border-zinc-700 flex items-center gap-6">
                <div className="flex items-center gap-3 border-r border-gray-200 dark:border-zinc-700 pr-4">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {selectedCount}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Seleccionados
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Tooltip content="Activar seleccionados">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="success"
                            onClick={onActivate}
                            className="rounded-full"
                        >
                            <FaCheck />
                        </Button>
                    </Tooltip>

                    <Tooltip content="Desactivar seleccionados">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="warning"
                            onClick={onDeactivate}
                            className="rounded-full"
                        >
                            <FaBan />
                        </Button>
                    </Tooltip>

                    <Tooltip content="Eliminar seleccionados">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="danger"
                            onClick={onDelete}
                            className="rounded-full"
                        >
                            <FaTrash />
                        </Button>
                    </Tooltip>
                </div>

                <div className="border-l border-gray-200 dark:border-zinc-700 pl-4">
                    <Button
                        size="sm"
                        variant="light"
                        color="default"
                        onClick={onClearSelection}
                        startContent={<FaTimes />}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    );
}
