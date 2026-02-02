import { useState, useEffect, useMemo } from "react";
import UnidadesForm from "./UnidadesForm";
import { FaPlus } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip, Chip, Pagination } from "@heroui/react";
import BarraSearch from "@/components/Search/Search";
import { ActionButton, ButtonEdit, ButtonDelete } from "@/components/Buttons/Buttons";
import { getUnidades, deleteUnidad } from "@/services/unidades.services";
import { usePermisos } from "@/routes";

function Unidades() {
    const [unidades, setUnidades] = useState([]);
    const [filteredUnidades, setFilteredUnidades] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUnidad, setEditingUnidad] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const pages = Math.ceil(filteredUnidades.length / rowsPerPage);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredUnidades.slice(start, end);
    }, [page, filteredUnidades]);

    const loadUnidades = async () => {
        setIsLoading(true);
        const data = await getUnidades();
        setUnidades(data || []);
        setFilteredUnidades(data || []);
        setIsLoading(false);
    };

    useEffect(() => {
        loadUnidades();
    }, []);

    useEffect(() => {
        const lower = searchTerm.toLowerCase();
        setFilteredUnidades(unidades.filter(u =>
            u.codigo_sunat?.toLowerCase().includes(lower) ||
            u.descripcion?.toLowerCase().includes(lower)
        ));
        setPage(1); // Reset to page 1 on search
    }, [searchTerm, unidades]);

    const handleAdd = () => {
        setEditingUnidad(null);
        setIsFormOpen(true);
    };

    const handleEdit = (unidad) => {
        setEditingUnidad(unidad);
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("¿Estás seguro de eliminar esta unidad?")) {
            try {
                await deleteUnidad(id);
                toast.success("Unidad eliminada");
                loadUnidades();
            } catch (e) {
                toast.error("No se pudo eliminar");
            }
        }
    };

    const onSuccess = () => {
        setIsFormOpen(false);
        loadUnidades();
    };

    // Columns
    const columns = [
        { name: "CÓDIGO SUNAT", uid: "codigo_sunat" },
        { name: "DESCRIPCIÓN", uid: "descripcion" },
        { name: "ESTADO", uid: "estado" },
        { name: "ACCIONES", uid: "actions" },
    ];

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <BarraSearch
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar unidad (KGM, NIU...)"
                    isClearable={true}
                    onClear={() => setSearchTerm("")}
                    className="h-10 text-sm w-full md:w-72 dark:bg-gray-800 dark:text-white"
                />
                <ActionButton
                    color="primary"
                    endContent={<FaPlus size={18} />}
                    onClick={handleAdd}
                    className="h-10 px-4 font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200"
                >
                    Agregar unidad
                </ActionButton>
            </div>

            <Table
                aria-label="Tabla de Unidades"
                bottomContent={
                    filteredUnidades.length > 0 ? (
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={pages}
                                onChange={(page) => setPage(page)}
                            />
                        </div>
                    ) : null
                }
                classNames={{
                    wrapper: "bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-zinc-800 rounded-xl",
                    th: "bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 font-semibold",
                    td: "dark:text-slate-300"
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={items} emptyContent={"No hay unidades registradas"}>
                    {(item) => (
                        <TableRow key={item.id_unidad}>
                            {(columnKey) => (
                                <TableCell>
                                    {columnKey === "actions" ? (
                                        <div className="relative flex items-center gap-2 justify-center">
                                            <Tooltip content="Editar">
                                                <span className="cursor-pointer active:opacity-50">
                                                    <ButtonEdit onPress={() => handleEdit(item)} />
                                                </span>
                                            </Tooltip>
                                            <Tooltip color="danger" content="Eliminar">
                                                <span className="cursor-pointer active:opacity-50">
                                                    <ButtonDelete onPress={() => handleDelete(item.id_unidad)} />
                                                </span>
                                            </Tooltip>
                                        </div>
                                    ) : columnKey === "estado" ? (
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color={item.estado === 1 ? "success" : "danger"}
                                            className="capitalize"
                                        >
                                            {item.estado === 1 ? "Activo" : "Inactivo"}
                                        </Chip>
                                    ) : (
                                        item[columnKey]
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {isFormOpen && (
                <UnidadesForm
                    modalTitle={editingUnidad ? "Editar Unidad" : "Nueva Unidad"}
                    isVisible={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialData={editingUnidad}
                    onSuccess={onSuccess}
                />
            )}
        </div>
    );
}

export default Unidades;
