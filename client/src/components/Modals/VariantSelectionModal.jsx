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
            // Determine if stock is explicitly managed locally
            const isStockManaged = !isIngreso && !!(almacen || id_sucursal);
            const shouldIncludeZero = isIngreso || !isStockManaged;

            const data = await getProductVariants(product.codigo, shouldIncludeZero, almacen, id_sucursal);

            if (data && data.length > 0) {
                // Parse attributes_json if it's string
                const parsedVariants = data.map(v => ({
                    ...v,
                    attributes: typeof v.attributes_json === 'string' ? JSON.parse(v.attributes_json) : v.attributes_json
                })).filter(v => shouldIncludeZero || (v.attributes && Object.keys(v.attributes).length > 0));

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
        const name = attrData.names[key] || key;
        return name.toUpperCase();
    };

    const visibleAttributeLabels = useMemo(() => {
        const labels = new Set();
        attributeKeys.forEach(key => {
            const label = getLabel(key);
            if (label !== 'TEMPORADA') {
                labels.add(label);
            }
        });
        // Sort Color, Talla, then alphabetical
        return Array.from(labels).sort((a, b) => {
            if (a === 'COLOR') return -1;
            if (b === 'COLOR') return 1;
            if (a === 'TALLA') return -1;
            if (b === 'TALLA') return 1;
            return a.localeCompare(b);
        });
    }, [attributeKeys, attrData]);

    const handleSelectOption = (label, val) => {
        setSelections(prev => {
            const next = { ...prev };
            if (next[label] === val) {
                delete next[label];
            } else {
                next[label] = val;
            }
            return next;
        });
        setSelectedQty(1);
    };

    // Check if we have 1 unique variant exactly matching all selections
    const resolvedVariant = useMemo(() => {
        const matching = variants.filter(v => {
            return Object.entries(selections).every(([label, val]) => {
                if (!v.attributes) return false;
                // Match if ANY key in v.attributes has this label AND matches the value
                return Object.entries(v.attributes).some(([k, vVal]) => getLabel(k) === label && vVal === val);
            });
        });
        
        // If matched at least 1 and all VISIBLE attribute keys have a selection
        // Multiple variants can match if they only differ by an invisible attribute like 'temporada'
        if (matching.length >= 1 && Object.keys(selections).length === visibleAttributeLabels.length) {
            return matching[0];
        }
        return null;
    }, [variants, selections, visibleAttributeLabels, attrData]);

    const handleConfirmResolved = () => {
        if (!resolvedVariant) return;
        
        let availableStock = resolvedVariant.stock;
        const isStockManaged = !isIngreso && !!(almacen || id_sucursal);
        if (isStockManaged && cart.length > 0) {
            const found = cart.find(c => c.id_sku === resolvedVariant.id_sku);
            if (found) availableStock -= found.cantidad;
        }
        
        if (isStockManaged && availableStock <= 0) return; // Prevent enter key if out of stock

        const resolvedAttributes = [];
        // Map over the normalized labels
        visibleAttributeLabels.forEach(label => {
            // Find the original key in this variant that matches the label
            const matchedKey = Object.keys(resolvedVariant.attributes || {}).find(k => getLabel(k) === label);
            if (matchedKey) {
                const val = resolvedVariant.attributes[matchedKey];
                let hex = attrData.colors[val] || null;
                resolvedAttributes.push({ label, value: val, hex });
            }
        });

        const itemToAdd = {
            ...resolvedVariant,
            quantity: parseInt(selectedQty, 10) || 1,
            resolvedAttributes
        };

        onConfirm([itemToAdd]);
        onClose();
    };

    // Listen for Enter key to quick-add when resolved
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && isOpen && resolvedVariant) {
                e.preventDefault();
                handleConfirmResolved();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, resolvedVariant, selectedQty, cart, isIngreso, almacen, id_sucursal]);

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
        return visibleAttributeLabels.map(label => {
            // Find all possible values across the entire catalog for this label
            const allValues = new Set();
            variants.forEach(v => {
                if (v.attributes) {
                    Object.entries(v.attributes).forEach(([k, vVal]) => {
                        if (getLabel(k) === label) allValues.add(vVal);
                    });
                }
            });
            const options = Array.from(allValues).sort();

            return (
                <div key={label} className="flex flex-col gap-2 bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
                    <div className="flex flex-wrap gap-2.5">
                        {options.map(val => {
                            // Determine if valid based on OTHER selections
                            const otherSelections = { ...selections };
                            delete otherSelections[label];
                            
                            let isValid = false;
                            let maxStock = 0;
                            
                            for (const v of variants) {
                                // Match other selections
                                const matchesOthers = Object.entries(otherSelections).every(([otherLabel, otherVal]) => {
                                    return v.attributes && Object.entries(v.attributes).some(([k, vVal]) => getLabel(k) === otherLabel && vVal === otherVal);
                                });

                                // Check if this variant has our specific option
                                const hasOurOption = v.attributes && Object.entries(v.attributes).some(([k, vVal]) => getLabel(k) === label && vVal === val);

                                if (matchesOthers && hasOurOption) {
                                    isValid = true;
                                    let available = v.stock;
                                    if (!isIngreso && cart.length > 0) {
                                        const found = cart.find(c => c.id_sku === v.id_sku);
                                        if (found) available -= found.cantidad;
                                    }
                                    maxStock += available;
                                }
                            }

                            const isSelected = selections[label] === val;
                            const hex = attrData.colors[val] || null;
                            const hasColorIndicator = !!hex;
                            
                            // Only enforce stock if it's explicitly linked to a warehouse/sucursal and not an entry
                            const isStockManaged = !isIngreso && !!(almacen || id_sucursal);
                            const isDisabled = !isValid || (isStockManaged && maxStock <= 0);

                            return (
                                <Button
                                    key={val}
                                    size="md"
                                    color={isSelected ? "primary" : "default"}
                                    variant={isSelected ? "solid" : "flat"}
                                    className={`font-semibold transition-all px-5 ${isSelected ? 'shadow-md shadow-blue-500/30' : 'bg-white border-slate-200 dark:bg-zinc-800 dark:border-zinc-700'}`}
                                    isDisabled={isDisabled}
                                    onPress={() => handleSelectOption(label, val)}
                                    startContent={hasColorIndicator ? (
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
                                                const isStockManaged = !isIngreso && !!(almacen || id_sucursal);
                                                
                                                if (isStockManaged && cart.length > 0) {
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
                                                                    onPress={() => setSelectedQty(Math.max(1, (parseInt(selectedQty) || 0) - 1))}
                                                                    isDisabled={selectedQty === '' || selectedQty <= 1}>
                                                                    <Minus size={18} />
                                                                </Button>
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={selectedQty}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                                        if (val === '') {
                                                                            setSelectedQty('');
                                                                            return;
                                                                        }
                                                                        let n = parseInt(val, 10);
                                                                        if (isStockManaged && availableStock > 0 && n > availableStock) n = availableStock;
                                                                        setSelectedQty(n);
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (selectedQty === '' || parseInt(selectedQty, 10) < 1) {
                                                                            setSelectedQty(1);
                                                                        }
                                                                    }}
                                                                    onFocus={(e) => e.target.select()}
                                                                    className="w-12 text-center font-bold text-lg bg-transparent border-none outline-none focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-blue-500/50 rounded transition-all"
                                                                />
                                                                <Button isIconOnly size="sm" variant="light" color="primary" 
                                                                    onPress={() => setSelectedQty(isStockManaged ? Math.min(availableStock, (parseInt(selectedQty) || 0) + 1) : (parseInt(selectedQty) || 0) + 1)} 
                                                                    isDisabled={isStockManaged && selectedQty >= availableStock}>
                                                                    <Plus size={18} />
                                                                </Button>
                                                            </div>
                                                            
                                                            <Button size="lg" color="primary" className="font-bold shadow-lg shadow-blue-500/30 px-6"
                                                                onPress={handleConfirmResolved}
                                                                isDisabled={isStockManaged && availableStock <= 0}
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
                                                    const isStockManaged = !isIngreso && !!(almacen || id_sucursal);
                                                    
                                                    if (isStockManaged && cart.length > 0) {
                                                        const found = cart.find(c => c.id_sku === v.id_sku);
                                                        if (found) availableStock -= found.cantidad;
                                                    }
                                                    const isOutOfStock = isStockManaged && availableStock <= 0;

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
