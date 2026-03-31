import React, { useEffect, useState, useMemo } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner, Chip, Input, ScrollShadow } from "@heroui/react";
import { getProductVariants, getProductAttributes } from "@/services/productos.services";
import { toast } from 'react-hot-toast';
import { Plus, Minus, ShoppingCart, Search } from "lucide-react";

const VariantSelectionModal = ({ isOpen, onClose, product, onConfirm, cart = [], mode = 'venta', almacen, id_sucursal }) => {
    const [variants, setVariants] = useState([]); 
    const [loading, setLoading] = useState(false);

    // Configured Attributes (e.g., ["Color", "Talla", "Material"])
    const [attributeKeys, setAttributeKeys] = useState([]);

    // Selection State: { "Color": "Rojo", "Talla": "M" }
    const [selections, setSelections] = useState({});
    
    // Single quantity selector for the matched variant
    const [selectedQty, setSelectedQty] = useState(1);

    const isIngreso = mode === 'ingreso';

    useEffect(() => {
        if (isOpen && product) {
            loadVariants();
            setSelections({});
            setSelectedQty(1);
        }
    }, [isOpen, product]);

    const loadVariants = async () => {
        setLoading(true);
        try {
            const data = await getProductVariants(product.codigo, isIngreso, almacen, id_sucursal);

            if (data && data.length > 0) {
                // Parse attributes_json if it's string
                const parsedVariants = data.map(v => ({
                    ...v,
                    attributes: typeof v.attributes_json === 'string' ? JSON.parse(v.attributes_json) : v.attributes_json
                })).filter(v => isIngreso || (v.attributes && Object.keys(v.attributes).length > 0));

                setVariants(parsedVariants);

                // Extract unique Attribute Keys from all variants
                const keys = new Set();
                parsedVariants.forEach(v => {
                    if (v.attributes) {
                        Object.keys(v.attributes).forEach(k => {
                            // Ignorar 'temporada' para evitar que cause fricción en el selector
                            if (k.toLowerCase() !== 'temporada') {
                                keys.add(k);
                            }
                        });
                    }
                });
                
                // Sort keys preference: Color, Talla, others
                const sortedKeys = Array.from(keys).sort((a, b) => {
                    if (a === 'Color') return -1;
                    if (b === 'Color') return 1;
                    if (a === 'Talla') return -1;
                    if (b === 'Talla') return 1;
                    return a.localeCompare(b);
                });
                setAttributeKeys(sortedKeys);
            } else {
                setVariants([]);
                setAttributeKeys([]);
            }
        } catch (error) {
            console.error("Error loading variants", error);
            toast.error("Error cargando variantes");
        } finally {
            setLoading(false);
        }
    };

    // --- Resolve Attribute Names & Color Map ---
    const [attrData, setAttrData] = useState({ names: {}, colors: {} });

    useEffect(() => {
        const fetchAttrMetadata = async () => {
            if (product?.id_producto || product?.codigo) {
                try {
                    const data = await getProductAttributes(product.id_producto || product.codigo);
                    const names = {};
                    const colors = {};

                    if (data) {
                        if (data.attributes) {
                            data.attributes.forEach(a => {
                                names[a.id_atributo] = a.nombre;
                            });
                        }
                        if (data.tonalidades) {
                            data.tonalidades.forEach(t => {
                                colors[t.nombre] = t.hex;
                            });
                        }
                    }
                    setAttrData({ names, colors });
                } catch (e) {
                    console.error("Error loading attr metadata", e);
                }
            }
        };
        if (isOpen) fetchAttrMetadata();
    }, [isOpen, product]);

    const getLabel = (key) => {
        return attrData.names[key] || key;
    };

    const visibleAttributeKeys = useMemo(() => {
        return attributeKeys.filter(key => getLabel(key).toLowerCase() !== 'temporada');
    }, [attributeKeys, attrData]);


    const handleSelectOption = (key, val) => {
        setSelections(prev => {
            const next = { ...prev };
            if (next[key] === val) {
                delete next[key];
            } else {
                next[key] = val;
            }
            return next;
        });
        setSelectedQty(1);
    };

    // Check if we have 1 unique variant exactly matching all selections
    const resolvedVariant = useMemo(() => {
        const matching = variants.filter(v => {
            return Object.entries(selections).every(([key, val]) => v.attributes && v.attributes[key] === val);
        });
        
        // If matched at least 1 and all VISIBLE attribute keys have a selection
        // Multiple variants can match if they only differ by an invisible attribute like 'temporada'
        if (matching.length >= 1 && Object.keys(selections).length === visibleAttributeKeys.length) {
            return matching[0];
        }
        return null;
    }, [variants, selections, visibleAttributeKeys]);

    const handleConfirmResolved = () => {
        if (!resolvedVariant) return;
        
        const resolvedAttributes = [];
        // Use visibleAttributeKeys so the hidden attributes don't show up in the cart rendering
        visibleAttributeKeys.forEach(k => {
            const label = getLabel(k);
            const val = resolvedVariant.attributes[k];
            let hex = null;
            if (label.toLowerCase() === 'color') hex = attrData.colors[val];
            resolvedAttributes.push({ label, value: val, hex });
        });

        const itemToAdd = {
            ...resolvedVariant,
            quantity: selectedQty,
            resolvedAttributes
        };

        onConfirm([itemToAdd]);
        onClose();
    };

    const handleFallbackAdd = (variant) => {
        const itemToAdd = {
            ...variant,
            quantity: 1,
            resolvedAttributes: []
        };
        onConfirm([itemToAdd]);
        onClose();
    };

    const renderConfigurator = () => {
        return visibleAttributeKeys.map(key => {
            const label = getLabel(key);
            
            // Find all possible values across the entire catalog for this key
            const allValues = new Set();
            variants.forEach(v => {
                if (v.attributes && v.attributes[key]) allValues.add(v.attributes[key]);
            });
            const options = Array.from(allValues).sort();

            return (
                <div key={key} className="flex flex-col gap-2 bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
                    <div className="flex flex-wrap gap-2.5">
                        {options.map(val => {
                            // Determine if valid based on OTHER selections
                            const otherSelections = { ...selections };
                            delete otherSelections[key];
                            
                            let isValid = false;
                            let maxStock = 0;
                            
                            for (const v of variants) {
                                const matchesOthers = Object.entries(otherSelections).every(([k, otherVal]) => v.attributes && v.attributes[k] === otherVal);
                                if (matchesOthers && v.attributes && v.attributes[key] === val) {
                                    isValid = true;
                                    let available = v.stock;
                                    if (!isIngreso && cart.length > 0) {
                                        const found = cart.find(c => c.id_sku === v.id_sku);
                                        if (found) available -= found.cantidad;
                                    }
                                    maxStock += available;
                                }
                            }

                            const isSelected = selections[key] === val;
                            const isColor = label.toLowerCase() === 'color';
                            const hex = isColor ? attrData.colors[val] : null;
                            const isDisabled = !isValid || (!isIngreso && maxStock <= 0);

                            return (
                                <Button
                                    key={val}
                                    size="md"
                                    color={isSelected ? "primary" : "default"}
                                    variant={isSelected ? "solid" : "flat"}
                                    className={`font-semibold transition-all px-5 ${isSelected ? 'shadow-md shadow-blue-500/30' : 'bg-white border-slate-200 dark:bg-zinc-800 dark:border-zinc-700'}`}
                                    isDisabled={isDisabled}
                                    onPress={() => handleSelectOption(key, val)}
                                    startContent={isColor && hex ? (
                                        <div className={`w-3.5 h-3.5 rounded-full shadow-sm border border-black/10 ${isDisabled ? 'opacity-50' : ''}`} style={{ backgroundColor: hex }} />
                                    ) : undefined}
                                >
                                    {val}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            classNames={{
                wrapper: "z-[10000]",
                backdrop: "z-[10000]"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 pb-2">
                            <h2 className="text-xl">Seleccionar Variante</h2>
                            <span className="text-sm font-normal text-slate-500">{product?.nombre || product?.descripcion}</span>
                        </ModalHeader>
                        
                        <ModalBody className="p-6 pt-2">
                            {loading ? (
                                <div className="flex justify-center p-12">
                                    <Spinner label="Cargando configuración..." />
                                </div>
                            ) : variants.length === 0 ? (
                                <div className="text-center p-8 text-slate-500 border border-dashed rounded-xl border-slate-200 dark:border-zinc-800">
                                    No hay variantes disponibles.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    {attributeKeys.length > 0 ? (
                                        <>
                                            <div className="flex flex-col gap-3">
                                                {renderConfigurator()}
                                            </div>

                                            {resolvedVariant ? (() => {
                                                let availableStock = resolvedVariant.stock;
                                                if (!isIngreso && cart.length > 0) {
                                                    const found = cart.find(c => c.id_sku === resolvedVariant.id_sku);
                                                    if (found) availableStock -= found.cantidad;
                                                }

                                                return (
                                                    <div className="mt-2 flex flex-col md:flex-row items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-500/20 rounded-2xl gap-4 shadow-sm animate-appearance-in">
                                                        <div className="flex flex-col">
                                                            <span className="text-blue-800 dark:text-blue-300 font-bold text-lg">Variante Lista</span>
                                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                                Disponibles: <span className="font-bold">{availableStock}</span>
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl p-1 shadow-sm">
                                                                <Button isIconOnly size="sm" variant="light" color="danger" 
                                                                    onPress={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                                                                    isDisabled={selectedQty <= 1}>
                                                                    <Minus size={18} />
                                                                </Button>
                                                                <span className="w-8 text-center font-bold text-lg">{selectedQty}</span>
                                                                <Button isIconOnly size="sm" variant="light" color="primary" 
                                                                    onPress={() => setSelectedQty(Math.min(availableStock, selectedQty + 1))} 
                                                                    isDisabled={!isIngreso && selectedQty >= availableStock}>
                                                                    <Plus size={18} />
                                                                </Button>
                                                            </div>
                                                            
                                                            <Button size="lg" color="primary" className="font-bold shadow-lg shadow-blue-500/30 px-6"
                                                                onPress={handleConfirmResolved}
                                                                isDisabled={!isIngreso && availableStock <= 0}
                                                                startContent={<ShoppingCart size={20}/>}
                                                            >
                                                                Añadir
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })() : (
                                                <div className="mt-2 text-center text-slate-400 p-6 border-2 border-dashed rounded-2xl border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10">
                                                    Selecciona una opción de cada categoría<br/>para continuar
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <ScrollShadow className="max-h-[400px]">
                                            <div className="flex flex-col gap-2">
                                                {variants.map(v => {
                                                    let availableStock = v.stock;
                                                    if (!isIngreso && cart.length > 0) {
                                                        const found = cart.find(c => c.id_sku === v.id_sku);
                                                        if (found) availableStock -= found.cantidad;
                                                    }
                                                    const isOutOfStock = !isIngreso && availableStock <= 0;

                                                    return (
                                                        <Button 
                                                            key={v.id_sku}
                                                            variant="flat"
                                                            color={isOutOfStock ? "default" : "primary"}
                                                            className={`justify-between h-auto py-3 px-4 font-medium ${isOutOfStock ? 'opacity-50' : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100'}`}
                                                            isDisabled={isOutOfStock}
                                                            onPress={() => handleFallbackAdd(v)}
                                                        >
                                                            <span className="text-left font-bold truncate max-w-[70%]">{v.nombre_sku || v.codigo_sku}</span>
                                                            <Chip size="sm" variant="flat" color={isOutOfStock ? "danger" : "success"}>
                                                                Stock: {availableStock}
                                                            </Chip>
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </ScrollShadow>
                                    )}
                                </div>
                            )}
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default VariantSelectionModal;
