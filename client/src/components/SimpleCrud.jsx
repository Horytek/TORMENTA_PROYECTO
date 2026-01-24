import React, { useState, useEffect, useMemo } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Tooltip, Card, CardBody, Pagination } from "@heroui/react";
import { Plus, Edit, Trash, Search, ChevronDown } from "lucide-react";
import axios from "@/api/axios";
import { toast } from "react-hot-toast";
import Loader from "@/components/Loader";

// Shared style classes
const glassInputClasses = {
    inputWrapper: "bg-white dark:bg-zinc-800 shadow-none border border-slate-200 dark:border-zinc-700 rounded-xl h-10 group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-zinc-800 ring-0 transition-all duration-300",
    input: "text-slate-600 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500",
};

const SimpleCrud = ({
    title,
    subtitle,
    endpoint,
    itemName,
    columns = [
        { key: 'nombre', label: 'NOMBRE' }
    ],
    formFields = [
        { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ingrese nombre' }
    ]
}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [editingItem, setEditingItem] = useState(null);

    // Initial state based on formFields
    const initialFormState = useMemo(() =>
        formFields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}),
        [formFields]);

    const [formData, setFormData] = useState(initialFormState);

    // Pagination
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, [endpoint]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(endpoint);
            if (res.data.code === 1) {
                setData(res.data.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error(error);
            toast.error(`Error cargando ${itemName}s`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Basic validation
            for (const field of formFields) {
                if (field.required !== false && !formData[field.name]) {
                    toast.error(`El campo ${field.label} es requerido`);
                    return;
                }
            }

            if (editingItem) {
                const idKey = Object.keys(editingItem).find(k => k.startsWith('id_'));
                await axios.put(`${endpoint}/${editingItem[idKey]}`, formData);
                toast.success(`${itemName} actualizado`);
            } else {
                await axios.post(endpoint, formData);
                toast.success(`${itemName} creado`);
            }
            fetchData();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error guardando");
        }
    };

    const handleDelete = async (item) => {
        if (!confirm(`¿Eliminar este ${itemName}?`)) return;
        try {
            const idKey = Object.keys(item).find(k => k.startsWith('id_'));
            await axios.delete(`${endpoint}/${item[idKey]}`);
            toast.success("Eliminado");
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Error eliminando");
        }
    };

    const openModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            // Map item to form data
            const newFormData = { ...initialFormState };
            formFields.forEach(field => {
                newFormData[field.name] = item[field.name] || '';
            });
            setFormData(newFormData);
        } else {
            setFormData(initialFormState);
        }
        onOpen();
    };

    const filteredData = useMemo(() => {
        return data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(search.toLowerCase())
            )
        );
    }, [data, search]);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredData.slice(start, end);
    }, [page, filteredData]);

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {title}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        {subtitle}
                    </p>
                </div>
                <Button
                    className="bg-blue-600 text-white font-bold shadow-blue-500/30"
                    onPress={() => openModal()}
                    startContent={<Plus size={20} />}
                >
                    Nuevo {itemName}
                </Button>
            </div>

            {/* Content */}
            <div className="space-y-4">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                    <Input
                        placeholder="Buscar..."
                        value={search}
                        onValueChange={setSearch}
                        startContent={<Search size={18} className="text-slate-400" />}
                        classNames={glassInputClasses}
                        isClearable
                        onClear={() => setSearch("")}
                        className="w-full xl:max-w-xs"
                        size="sm"
                    />
                </div>

                <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
                    <CardBody className="p-0">
                        {loading ? (
                            <div className="p-10"><Loader /></div>
                        ) : (
                            <Table
                                aria-label={title}
                                removeWrapper
                                classNames={{
                                    th: "bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-xs h-12",
                                    td: "text-slate-700 dark:text-slate-200 p-4 border-b border-slate-100 dark:border-zinc-800 last:border-0",
                                }}
                            >
                                <TableHeader>
                                    {columns.map((col) => (
                                        <TableColumn key={col.key} align={col.align || "start"}>
                                            {col.label.toUpperCase()}
                                        </TableColumn>
                                    ))}
                                    <TableColumn align="end">ACCIONES</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent={
                                    <div className="text-center py-10 text-slate-400">
                                        <p>No hay registros encontrados</p>
                                    </div>
                                }>
                                    {items.map((item, idx) => {
                                        const idKey = Object.keys(item).find(k => k.startsWith('id_'));
                                        return (
                                            <TableRow key={item[idKey] || idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                {columns.map((col) => (
                                                    <TableCell key={col.key}>
                                                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                                                    </TableCell>
                                                ))}
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Tooltip content="Editar">
                                                            <span className="text-lg text-slate-400 hover:text-blue-500 cursor-pointer transition-colors" onClick={() => openModal(item)}>
                                                                <Edit size={18} />
                                                            </span>
                                                        </Tooltip>
                                                        <Tooltip content="Eliminar" color="danger">
                                                            <span className="text-lg text-slate-400 hover:text-rose-500 cursor-pointer transition-colors" onClick={() => handleDelete(item)}>
                                                                <Trash size={18} />
                                                            </span>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* Pagination */}
                {/* Footer with Pagination */}
                {filteredData.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                        <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            <span>{filteredData.length} registros</span>
                            <div className="relative">
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="appearance-none bg-slate-100 dark:bg-zinc-800 border-none rounded-lg py-1.5 pl-4 pr-8 text-slate-700 dark:text-slate-200 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-small"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        <Pagination
                            showControls
                            color="primary"
                            page={page}
                            total={Math.ceil(filteredData.length / rowsPerPage)}
                            onChange={setPage}
                            classNames={{
                                wrapper: "gap-1 overflow-visible h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 px-1 flex items-center shadow-none",
                                item: "w-8 h-8 text-small bg-transparent rounded-lg text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm font-medium transition-all",
                                cursor: "bg-blue-600 shadow-lg shadow-blue-500/30 text-white font-bold rounded-lg",
                                prev: "bg-transparent hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-slate-500 dark:text-slate-400",
                                next: "bg-transparent hover:bg-white dark:hover:bg-zinc-700 rounded-lg text-slate-500 dark:text-slate-400",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-slate-800 dark:text-white">
                                {editingItem ? 'Editar' : 'Nuevo'} {itemName}
                            </ModalHeader>
                            <ModalBody>
                                {formFields.map((field) => (
                                    <div key={field.name} className="space-y-1">
                                        {field.type === 'color' ? (
                                            <div className="flex items-center gap-4 border border-slate-300 dark:border-zinc-700 rounded-xl p-3 bg-slate-50 dark:bg-zinc-800/50">
                                                <div className="flex-1">
                                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-1">{field.label}</label>
                                                    <input
                                                        type="text"
                                                        value={formData[field.name]}
                                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                                        placeholder="#000000"
                                                        className="w-full bg-transparent outline-none text-slate-800 dark:text-white font-mono"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="color"
                                                        value={formData[field.name] || '#000000'}
                                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                                        className="w-10 h-10 p-0 rounded-lg cursor-pointer border-0"
                                                        style={{ backgroundColor: 'transparent' }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <Input
                                                key={field.name}
                                                type={field.type || "text"}
                                                label={field.label}
                                                placeholder={field.placeholder}
                                                value={formData[field.name]}
                                                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                                variant="bordered"
                                                labelPlacement="outside"
                                                autoFocus={field.autoFocus}
                                                classNames={{
                                                    inputWrapper: "bg-slate-50 dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700"
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="light" onPress={onClose} className="font-medium">
                                    Cancelar
                                </Button>
                                <Button color="primary" onPress={handleSave} className="font-bold shadow-blue-500/30">
                                    Guardar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

export default SimpleCrud;
