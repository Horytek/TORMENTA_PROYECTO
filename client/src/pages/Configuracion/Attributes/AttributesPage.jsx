import React, { useEffect, useState } from 'react';
import {
    Card, CardBody, Button, Input, Tab, Tabs, Chip, Modal, ModalContent,
    ModalHeader, ModalBody, ModalFooter, Select, SelectItem, useDisclosure,
    Listbox, ListboxItem, ScrollShadow, Divider, CardHeader
} from "@heroui/react";
import { Plus, Trash2, Edit2, Settings, Search, Check, Tag, Layers, Calendar, Hash, CheckSquare, ListChecks } from "lucide-react";

import { getAttributes, createAttribute, updateAttribute, getAttributeValues, createAttributeValue, deleteAttributeValue, getCategoryAttributes, linkCategoryAttributes } from "@/services/attributes.services";
import { getCategorias } from "@/services/categoria.services";
import { toast } from 'react-hot-toast';

export default function AttributesPage() {
    const [activeTab, setActiveTab] = useState("atributos");
    const [attributes, setAttributes] = useState([]);
    const [categories, setCategories] = useState([]);

    // Modal State
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [modalMode, setModalMode] = useState("create_attr"); // create_attr, edit_attr, manage_values
    const [selectedAttr, setSelectedAttr] = useState(null);
    const [formData, setFormData] = useState({});

    // Values Management State
    const [attrValues, setAttrValues] = useState([]);
    const [newValue, setNewValue] = useState("");

    // Template Management State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryAttributes, setCategoryAttributes] = useState([]); // IDs
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadAttributes();
        loadCategories();
    }, []);

    const loadAttributes = async () => {
        const data = await getAttributes();
        setAttributes(data);
    };

    const loadCategories = async () => {
        const data = await getCategorias();
        if (data === null) {
            toast.error("Error al cargar categorías");
            return;
        }
        setCategories(data);
    };

    const handleCreateAttribute = async () => {
        if (!formData.nombre) return toast.error("Nombre requerido");
        const success = await createAttribute(formData);
        if (success) {
            toast.success("Atributo creado");
            loadAttributes();
            onOpenChange(false);
        } else {
            toast.error("Error creando atributo");
        }
    };

    const handleUpdateAttribute = async () => {
        if (!formData.nombre) return toast.error("Nombre requerido");
        const success = await updateAttribute(selectedAttr.id_atributo, formData);
        if (success) {
            toast.success("Atributo actualizado");
            loadAttributes();
            onOpenChange(false);
        } else {
            toast.error("Error actualizando");
        }
    };

    // Values Logic
    const openValuesModal = async (attr) => {
        setSelectedAttr(attr);
        setModalMode("manage_values");
        setAttrValues([]);
        const vals = await getAttributeValues(attr.id_atributo);
        setAttrValues(vals);
        onOpen();
    };

    const handleAddValue = async () => {
        if (!newValue.trim()) return;
        const success = await createAttributeValue(selectedAttr.id_atributo, { valor: newValue });
        if (success) {
            toast.success("Valor agregado");
            setNewValue("");
            const vals = await getAttributeValues(selectedAttr.id_atributo);
            setAttrValues(vals);
        } else {
            toast.error("Error o duplicado");
        }
    };

    const handleDeleteValue = async (id_valor) => {
        const success = await deleteAttributeValue(id_valor);
        if (success) {
            toast.success("Eliminado");
            const vals = await getAttributeValues(selectedAttr.id_atributo);
            setAttrValues(vals);
        } else {
            toast.error("Error al eliminar");
        }
    };

    // Templates Logic (Tab 3)
    const handleCategorySelect = async (id) => {
        setSelectedCategory(id);
        setLoadingTemplate(true);
        const linked = await getCategoryAttributes(id);
        setCategoryAttributes(linked.map(l => String(l.id_atributo)));
        setLoadingTemplate(false);
    };

    const toggleAttributeLink = (idAttr) => {
        const id = String(idAttr);
        setCategoryAttributes(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    const saveTemplate = async () => {
        if (!selectedCategory) return;
        setLoadingTemplate(true);
        const success = await linkCategoryAttributes({
            id_categoria: selectedCategory,
            attribute_ids: categoryAttributes
        });
        setLoadingTemplate(false);
        if (success) toast.success("Plantilla guardada correctamente");
        else toast.error("Error guardando plantilla");
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'COLOR': return <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500" />;
            case 'BUTTON': return <div className="w-4 h-4 border-2 border-slate-400 rounded" />;
            case 'MULTI_SELECT': return <ListChecks size={16} className="text-slate-500" />;
            case 'CHECKBOX': return <CheckSquare size={16} className="text-slate-500" />;
            case 'DATE': return <Calendar size={16} className="text-slate-500" />;
            case 'NUMBER': return <Hash size={16} className="text-slate-500" />;
            default: return <div className="w-4 h-4 rounded bg-slate-300" />;
        }
    };

    // Renders
    const renderAttributesTab = () => (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Catálogo de Atributos</h3>
                    <p className="text-sm text-slate-500">Define las características globales (Talla, Color, Material) disponibles para tus productos.</p>
                </div>
                <Button
                    color="primary"
                    className="shadow-lg shadow-blue-500/30 font-semibold"
                    onPress={() => { setModalMode("create_attr"); setFormData({}); onOpen(); }}
                    startContent={<Plus size={18} />}
                >
                    Nuevo Atributo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {attributes.map(attr => (
                    <Card key={attr.id_atributo} className="border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-900 group">
                        <CardHeader className="flex justify-between items-start pb-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-primary transition-colors">{attr.nombre}</h4>
                                    <Chip size="sm" variant="flat" color="secondary" className="mt-1 h-5 text-[10px] uppercase font-bold">
                                        {attr.tipo_input}
                                    </Chip>
                                </div>
                            </div>
                            <DropdownActions attr={attr} onEdit={() => { setSelectedAttr(attr); setFormData(attr); setModalMode("edit_attr"); onOpen(); }} onValues={() => openValuesModal(attr)} />
                        </CardHeader>
                        <CardBody className="pt-4">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/50 min-h-[80px] flex flex-col justify-center items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Vista Previa</span>
                                <div className="flex gap-1 opacity-60">
                                    {getIconForType(attr.tipo_input)}
                                    <div className="w-12 h-4 rounded bg-slate-200 dark:bg-zinc-700" />
                                </div>
                            </div>
                            <Button
                                className="mt-4 w-full font-medium"
                                color="primary"
                                variant="light"
                                onPress={() => openValuesModal(attr)}
                                startContent={<Settings size={16} />}
                            >
                                Configurar Valores
                            </Button>
                        </CardBody>
                    </Card>
                ))}

                {/* Empty State / Add New Card */}
                <Card
                    isPressable
                    onPress={() => { setModalMode("create_attr"); setFormData({}); onOpen(); }}
                    className="border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-transparent shadow-none hover:border-primary hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all flex items-center justify-center p-6 h-full min-h-[200px]"
                >
                    <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-primary transition-colors">
                        <div className="p-4 rounded-full bg-slate-100 dark:bg-zinc-800 group-hover:bg-primary/10 transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="font-semibold">Crear nuevo atributo</span>
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderTemplatesTab = () => (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
            {/* Sidebar: Categories */}
            <Card className="w-full lg:w-80 h-full shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col">
                <CardHeader className="pb-2 px-4 pt-4">
                    <h4 className="font-bold text-lg">Categorías</h4>
                </CardHeader>
                <div className="px-4 pb-2">
                    <Input
                        placeholder="Buscar categoría..."
                        startContent={<Search size={14} className="text-slate-400" />}
                        size="sm"
                        variant="faded"
                        className="mb-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <ScrollShadow className="flex-1 px-2 pb-2">
                    <div className="space-y-1">
                        {categories.filter(c => (c.nom_categoria || "").toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                            <button
                                key={c.id_categoria}
                                onClick={() => handleCategorySelect(c.id_categoria)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${String(selectedCategory) === String(c.id_categoria)
                                    ? "bg-primary text-white shadow-md shadow-primary/30 font-medium"
                                    : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Layers size={16} className={String(selectedCategory) === String(c.id_categoria) ? "text-white" : "text-slate-400"} />
                                    <span>{c.nom_categoria}</span>
                                </div>
                                {String(selectedCategory) === String(c.id_categoria) && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </ScrollShadow>
            </Card>

            {/* Content: Attributes Grid */}
            <Card className="flex-1 h-full shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col bg-slate-50/50 dark:bg-zinc-900/30">
                {selectedCategory ? (
                    <>
                        <CardHeader className="flex justify-between items-center px-6 py-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
                            <div>
                                <h4 className="font-bold text-xl text-slate-800 dark:text-white">
                                    {categories.find(c => String(c.id_categoria) === String(selectedCategory))?.nom_categoria}
                                </h4>
                                <p className="text-sm text-slate-500">Selecciona los atributos que estarán disponibles para esta categoría.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="flat" onPress={() => setCategoryAttributes([])}>Limpiar</Button>
                                <Button color="primary" onPress={saveTemplate} isLoading={loadingTemplate} startContent={<Check size={16} />}>
                                    Guardar Cambios
                                </Button>
                            </div>
                        </CardHeader>
                        <ScrollShadow className="p-6 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {attributes.map(attr => {
                                    const isSelected = categoryAttributes.includes(String(attr.id_atributo));
                                    return (
                                        <div
                                            key={attr.id_atributo}
                                            className={`relative p-4 rounded-xl cursor-pointer transition-all border-2 group ${isSelected
                                                ? 'border-primary bg-white dark:bg-zinc-800 shadow-lg shadow-primary/10'
                                                : 'border-transparent bg-white dark:bg-zinc-900 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700'
                                                }`}
                                            onClick={() => toggleAttributeLink(attr.id_atributo)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>
                                                    <Tag size={18} />
                                                </div>
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isSelected ? 'bg-primary border-primary text-white scale-110' : 'bg-transparent border-slate-300'
                                                    }`}>
                                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                                </div>
                                            </div>
                                            <h5 className={`font-bold transition-colors ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {attr.nombre}
                                            </h5>
                                            <p className="text-xs text-slate-400 mt-1 uppercase font-medium tracking-wider">{attr.tipo_input}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollShadow>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Layers size={32} className="opacity-50" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300">Selecciona una categoría</h3>
                        <p className="text-sm max-w-xs text-center mt-2">Elige una categoría de la lista izquierda para configurar sus atributos disponibles.</p>
                    </div>
                )}
            </Card>
        </div>
    );

    return (
        <div className="p-6 h-full flex flex-col gap-6 max-w-[1920px] mx-auto w-full">
            <Tabs
                aria-label="Opciones"
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
                color="primary"
                variant="underlined"
                classNames={{
                    tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                    cursor: "w-full bg-primary",
                    tab: "max-w-fit px-0 h-12",
                    tabContent: "group-data-[selected=true]:text-primary font-medium text-base"
                }}
            >
                <Tab key="atributos" title={
                    <div className="flex items-center space-x-2">
                        <Settings size={18} />
                        <span>Atributos Globales</span>
                    </div>
                } />
                <Tab key="plantillas" title={
                    <div className="flex items-center space-x-2">
                        <Layers size={18} />
                        <span>Plantillas por Categoría</span>
                    </div>
                } />
            </Tabs>

            <div className="flex-1 min-h-0">
                {activeTab === "atributos" && renderAttributesTab()}
                {activeTab === "plantillas" && renderTemplatesTab()}
            </div>

            {/* Modal for Create/Edit/Values */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size={modalMode === "manage_values" ? "2xl" : "md"} backdrop="blur">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800 p-6">
                                {modalMode === "create_attr" && "Crear Nuevo Atributo"}
                                {modalMode === "edit_attr" && "Editar Atributo"}
                                {modalMode === "manage_values" && (
                                    <div className="flex items-center gap-2">
                                        <Settings size={20} className="text-primary" />
                                        <span>Valores para <span className="text-primary">{selectedAttr?.nombre}</span></span>
                                    </div>
                                )}
                            </ModalHeader>
                            <ModalBody className="p-6">
                                {modalMode === "manage_values" ? (
                                    <div className="space-y-6">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newValue}
                                                onChange={(e) => setNewValue(e.target.value)}
                                                placeholder="Escribe un valor y presiona Enter..."
                                                variant="faded"
                                                size="lg"
                                                startContent={<Tag size={16} className="text-slate-400" />}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                                            />
                                            <Button isIconOnly color="primary" size="lg" onPress={handleAddValue}>
                                                <Plus />
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valores Actuales</span>
                                            <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 dark:bg-zinc-900/50">
                                                {attrValues.length === 0 && (
                                                    <div className="w-full text-center py-8 text-slate-400">
                                                        No hay valores registrados. Agrega uno arriba.
                                                    </div>
                                                )}
                                                {attrValues.map(val => (
                                                    <Chip
                                                        key={val.id_valor}
                                                        onClose={() => handleDeleteValue(val.id_valor)}
                                                        variant="flat"
                                                        color="primary"
                                                        classNames={{
                                                            base: "pl-3 param-chip hover:bg-primary-100 transition-colors cursor-default",
                                                            content: "font-medium"
                                                        }}
                                                    >
                                                        {val.valor}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <Input
                                            label="Nombre del Atributo"
                                            labelPlacement="outside"
                                            placeholder="Ej: Material, Talla, Color"
                                            value={formData.nombre || ""}
                                            variant="faded"
                                            size="lg"
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            description="El nombre visible del atributo."
                                            startContent={<Tag size={18} className="text-slate-400" />}
                                        />
                                        <Select
                                            label="Tipo de Selección"
                                            labelPlacement="outside"
                                            placeholder="Selecciona cómo se mostrará"
                                            selectedKeys={formData.tipo_input ? [formData.tipo_input] : ["SELECT"]}
                                            variant="faded"
                                            size="lg"
                                            onChange={(e) => setFormData({ ...formData, tipo_input: e.target.value })}
                                            description="Define la apariencia en el formulario de producto."
                                            startContent={formData.tipo_input ? getIconForType(formData.tipo_input) : <Settings size={18} className="text-slate-400" />}
                                        >
                                            <SelectItem key="SELECT" value="SELECT" startContent={<div className="w-4 h-4 bg-slate-400 rounded" />}>Selección Única (Dropdown)</SelectItem>
                                            <SelectItem key="MULTI_SELECT" value="MULTI_SELECT" startContent={<ListChecks size={16} />}>Selección Múltiple (Tags)</SelectItem>
                                            <SelectItem key="COLOR" value="COLOR" startContent={<div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-500 to-pink-500" />}>Selector de Color</SelectItem>
                                            <SelectItem key="BUTTON" value="BUTTON" startContent={<div className="w-4 h-4 border border-slate-400 rounded" />}>Botones (Tallas)</SelectItem>
                                            <SelectItem key="CHECKBOX" value="CHECKBOX" startContent={<CheckSquare size={16} />}>Casilla de Verificación (Sí/No)</SelectItem>
                                            <SelectItem key="TEXT" value="TEXT" startContent={<div className="w-4 h-4 font-bold text-[10px] flex items-center justify-center border border-slate-400 rounded">Tx</div>}>Texto Libre</SelectItem>
                                            <SelectItem key="NUMBER" value="NUMBER" startContent={<Hash size={16} />}>Numérico (Dimensiones/Peso)</SelectItem>
                                            <SelectItem key="DATE" value="DATE" startContent={<Calendar size={16} />}>Fecha</SelectItem>
                                        </Select>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                                {modalMode !== "manage_values" && (
                                    <Button className="font-semibold shadow-lg shadow-blue-500/30" color="primary" onPress={modalMode === "create_attr" ? handleCreateAttribute : handleUpdateAttribute}>
                                        {modalMode === "create_attr" ? "Crear Atributo" : "Guardar Cambios"}
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

// Subcomponent for cleaner code
const DropdownActions = ({ attr, onEdit, onValues }) => {
    // You could move the Dropdown logic here if you want to keep the main render cleaner
    // For now I put the buttons directly in the main map for simplicity, but if you want the 3-dot menu:
    // Implementation would go here.
    return (
        <div className="flex gap-1 z-10">
            <Button isIconOnly size="sm" variant="light" className="text-slate-400 hover:text-slate-600" onPress={onEdit}>
                <Edit2 size={16} />
            </Button>
        </div>
    )
}
