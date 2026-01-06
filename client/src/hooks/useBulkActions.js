import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useBulkActions = ({
    onDelete,
    onActivate,
    onDeactivate,
    itemName = "elementos"
}) => {
    const [selectedKeys, setSelectedKeys] = useState(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal states
    const [actionType, setActionType] = useState(null); // 'delete', 'activate', 'deactivate'
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Helpers to get IDs from Selection
    const getSelectedIds = useCallback((allData) => {
        if (selectedKeys === "all") {
            const idField = allData.length > 0 &&
                (allData[0].id_cliente ? 'id_cliente' :
                    allData[0].id_usuario ? 'id_usuario' :
                        allData[0].id_sucursal ? 'id_sucursal' :
                            allData[0].id_proveedor ? 'id_proveedor' :
                                allData[0].id_empleado ? 'id_empleado' :
                                    allData[0].id_producto ? 'id_producto' :
                                        allData[0].id_marca ? 'id_marca' :
                                            allData[0].id_categoria ? 'id_categoria' :
                                                allData[0].id_subcategoria ? 'id_subcategoria' : 'id');

            return allData.map(item => item[idField] || item.id);
        }
        return Array.from(selectedKeys);
    }, [selectedKeys]);

    const handleOpenConfirm = (type) => {
        if (selectedKeys.size === 0 && selectedKeys !== "all") return;
        setActionType(type);
        setIsConfirmOpen(true);
    };

    const handleConfirm = async (allData = []) => {
        if (isProcessing) return;

        setIsProcessing(true);
        const ids = getSelectedIds(allData);
        let success = false;
        let message = "";

        try {
            // Derive selected items from allData
            // Try to find the items that correspond to the IDs
            // Note: getSelectedIds returns IDs. We need to find the full objects.
            // But we don't know the ID field name for sure here unless we re-derive it or assume.
            // Actually, we can just filter allData.
            let selectedItems = [];
            if (ids.length > 0 && allData.length > 0) {
                const idField = getSelectedIds.idField ||
                    (allData[0].id_cliente ? 'id_cliente' :
                        allData[0].id_usuario ? 'id_usuario' :
                            allData[0].id_sucursal ? 'id_sucursal' :
                                allData[0].id_proveedor ? 'id_proveedor' :
                                    allData[0].id_empleado ? 'id_empleado' :
                                        allData[0].id_producto ? 'id_producto' :
                                            allData[0].id_marca ? 'id_marca' :
                                                allData[0].id_categoria ? 'id_categoria' :
                                                    allData[0].id_subcategoria ? 'id_subcategoria' : 'id');

                selectedItems = allData.filter(item => ids.includes(item[idField] || item.id));
            }

            if (actionType === 'delete' && onDelete) {
                const result = await onDelete(ids, selectedItems);
                success = result?.success ?? result;
            } else if (actionType === 'activate' && onActivate) {
                const result = await onActivate(ids, selectedItems);
                success = result?.success ?? result;
            } else if (actionType === 'deactivate' && onDeactivate) {
                const result = await onDeactivate(ids, selectedItems);
                success = result?.success ?? result;
            }

            if (success) {
                toast.success(`Acción masiva completada correctamente.`);
                setSelectedKeys(new Set());
            } else {
                toast.error(`Hubo un error al procesar la acción masiva.`);
            }
        } catch (error) {
            console.error("Bulk action error:", error);
            toast.error("Error inesperado en acción masiva.");
        } finally {
            setIsProcessing(false);
            setIsConfirmOpen(false);
            setActionType(null);
        }
        return success;
    };

    const getConfirmMessage = () => {
        const count = selectedKeys === "all" ? "todos los" : selectedKeys.size;
        switch (actionType) {
            case 'delete': return `¿Eliminar ${count} ${itemName}?`;
            case 'activate': return `¿Activar ${count} ${itemName}?`;
            case 'deactivate': return `¿Desactivar ${count} ${itemName}?`;
            default: return "¿Confirmar acción?";
        }
    };

    return {
        selectedKeys,
        setSelectedKeys,
        isProcessing,
        isConfirmOpen,
        actionType,
        openConfirm: handleOpenConfirm,
        closeConfirm: () => setIsConfirmOpen(false),
        executeAction: handleConfirm,
        confirmMessage: getConfirmMessage()
    };
};
