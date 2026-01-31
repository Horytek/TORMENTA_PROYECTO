import React, { useEffect, useState, useMemo } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner, Chip, Input, ScrollShadow } from "@heroui/react";
import { getProductVariants, getProductAttributes } from "@/services/productos.services";
import { toast } from 'react-hot-toast';

const VariantSelectionModal = ({ isOpen, onClose, product, onConfirm, cart = [], mode = 'venta', almacen, id_sucursal }) => {
    const [variants, setVariants] = useState([]); // List of SKUs
    const [loading, setLoading] = useState(false);

    // Configured Attributes (e.g., ["Color", "Talla", "Material"])
    const [attributeKeys, setAttributeKeys] = useState([]);

    // Selection State: { "Color": "Rojo", "Talla": "M" }
    const [selections, setSelections] = useState({});

    // Quantities map: { skuId: quantity }
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        if (isOpen && product) {
            loadVariants();
            setSelections({});
            setQuantities({});
        }
    }, [isOpen, product]);

    const loadVariants = async () => {
        setLoading(true);
        try {
            // Fetch SKUs (SPU/SKU Architecture)
            // Even for 'ingreso', we might want to see existing SKUs or generate new ones?
            // For now, let's assume 'ingreso' might need different logic if creating BRAND NEW variants.
            // But if we stick to the plan, we select existing or configured variants.
            // The getProductVariants endpoint returns existing SKUs. 
            // If we need to create new SKUs (legacy flow generated them on the fly), that's a different beast.
            // For Migration Phase 4, we focus on LISTING existing SKUs derived from migration.

            const data = await getProductVariants(product.codigo, mode === 'ingreso', almacen, id_sucursal);

            if (data && data.length > 0) {
                // Parse attributes_json if it's string
                const parsedVariants = data.map(v => ({
                    ...v,
                    attributes: typeof v.attributes_json === 'string' ? JSON.parse(v.attributes_json) : v.attributes_json
                })).filter(v => mode !== 'venta' || (v.attributes && Object.keys(v.attributes).length > 0));

                setVariants(parsedVariants);

                // Extract unique Attribute Keys from all variants
                const keys = new Set();
                parsedVariants.forEach(v => {
                    if (v.attributes) {
                        Object.keys(v.attributes).forEach(k => keys.add(k));
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

                // Pre-select first options if simple? No, force user selection for clarity.
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
                        // Map legacy tonalidades to colors
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

    // --- Filtering Logic ---
    // ... (Filtering logic remains identical, omitted here for brevity if replace_file_content allows partial updates, but I will include it to be safe or just skip if not modifying. Actually I need to modify renderAttributes which uses this state)

    // ... (Helper functions handleQuantityChange, handleConfirm remain same)

    const handleQuantityChange = (skuId, val, variantStock) => {
        let newQty = parseInt(val);
        if (isNaN(newQty)) newQty = 0;

        // Clamping logic
        if (!isIngreso && typeof variantStock !== 'undefined') {
            if (newQty > variantStock) {
                toast.error(`Solo quedan ${variantStock} unidades disponibles`);
                newQty = variantStock;
            }
        }

        if (newQty < 0) newQty = 0;

        setQuantities(prev => ({ ...prev, [skuId]: newQty }));
    };

    const handleConfirm = () => {
        const itemsToAdd = [];
        variants.forEach(v => {
            const qty = quantities[v.id_sku];
            if (qty > 0) {
                // Resolve attributes to human readable format with Hex and Sort
                const resolved = [];
                if (v.attributes) {
                    const keys = Object.keys(v.attributes);
                    // Sort keys same as main sort (Color, Talla, others)
                    keys.sort((a, b) => {
                        const la = getLabel(a);
                        const lb = getLabel(b);
                        if (la === 'Color') return -1;
                        if (lb === 'Color') return 1;
                        if (la === 'Talla') return -1;
                        if (lb === 'Talla') return 1;
                        return la.localeCompare(lb);
                    });

                    keys.forEach(k => {
                        const label = getLabel(k);
                        const val = v.attributes[k];
                        let hex = null;
                        if (label.toLowerCase() === 'color') {
                            hex = attrData.colors[val];
                        }
                        resolved.push({ label, value: val, hex });
                    });
                }

                itemsToAdd.push({
                    ...v,
                    quantity: qty,
                    resolvedAttributes: resolved
                });
            }
        });

        if (itemsToAdd.length === 0) return;
        onConfirm(itemsToAdd);
        onClose();
    };

    const isIngreso = mode === 'ingreso';
    const totalSelected = Object.values(quantities).reduce((a, b) => a + (b || 0), 0);

    // Helpers to render attribute badges
    const renderAttributes = (attributes) => {
        if (!attributes) return null;
        return attributeKeys.map(key => {
            const label = getLabel(key);
            const value = attributes[key];
            const isColor = label.toLowerCase() === 'color';
            const hex = isColor ? attrData.colors[value] : null;

            return (
                <div key={key} className="flex flex-col min-w-[60px]">
                    <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">{label}</span>
                    {isColor && hex ? (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-5 h-5 rounded-full border border-slate-200 shadow-sm"
                                style={{ backgroundColor: hex }}
                                title={value}
                            />
                            <span className="font-medium text-sm truncate max-w-[80px]">{value}</span>
                        </div>
                    ) : (
                        <span className="font-medium text-sm truncate max-w-[100px]" title={value}>{value}</span>
                    )}
                </div>
            );
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="3xl"
            classNames={{
                wrapper: "z-[10000]",
                backdrop: "z-[10000]"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Seleccionar Variantes
                            <span className="text-sm font-normal text-slate-500">{product?.nombre || product?.descripcion}</span>
                        </ModalHeader>
                        <ModalBody className="p-6">
                            {loading ? (
                                <div className="flex justify-center p-8">
                                    <Spinner label="Cargando variantes..." />
                                </div>
                            ) : variants.length === 0 ? (
                                <div className="text-center p-4 text-slate-500">
                                    No hay variantes disponibles.
                                </div>
                            ) : (
                                <ScrollShadow className="max-h-[500px]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                                        {variants.map((variant) => {
                                            const skuId = variant.id_sku;
                                            let availableStock = variant.stock;
                                            let qtyInCart = 0;
                                            const qtySelected = quantities[skuId] || '';

                                            if (!isIngreso && cart.length > 0) {
                                                const inCartItem = cart.find(item => item.id_sku === skuId);
                                                qtyInCart = inCartItem ? inCartItem.cantidad : 0;
                                                availableStock = variant.stock - qtyInCart;
                                            }

                                            const isOutOfStock = !isIngreso && availableStock <= 0;

                                            return (
                                                <div
                                                    key={skuId}
                                                    className={`
                                                    border rounded-xl p-4 transition-all relative
                                                    ${qtySelected > 0
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 ring-1 ring-blue-500/20'
                                                            : isOutOfStock
                                                                ? 'border-slate-100 bg-slate-50 opacity-60'
                                                                : 'border-slate-200 dark:border-zinc-800'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex flex-col gap-3">
                                                        {/* Header: Attributes and Stock */}
                                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                                            <div className="flex flex-wrap gap-x-4 gap-y-2 max-w-[70%]">
                                                                {renderAttributes(variant.attributes)}
                                                            </div>
                                                            <div className="flex flex-col items-end shrink-0">
                                                                <Chip size="sm" color={isIngreso ? "primary" : availableStock > 0 ? "success" : "danger"} variant="flat" className="h-5 text-[10px]">
                                                                    Stock: {variant.stock}
                                                                </Chip>
                                                            </div>
                                                        </div>

                                                        {/* Redundant SKU Code Removed */}
                                                        {/* 
                                                        {variant.nombre_sku && (
                                                            <div className="text-[10px] text-slate-400 truncate">
                                                                {variant.nombre_sku}
                                                            </div>
                                                        )}
                                                        */}

                                                        <div className="flex items-center gap-2 mt-1">

                                                            <Input
                                                                type="number"
                                                                size="sm"
                                                                label="Cant."
                                                                labelPlacement="outside-left"
                                                                placeholder="0"
                                                                min={0}
                                                                max={!isIngreso ? availableStock : 9999}
                                                                value={qtySelected}
                                                                onValueChange={(val) => handleQuantityChange(skuId, val, availableStock)}
                                                                isDisabled={isOutOfStock}
                                                                classNames={{
                                                                    input: "text-center font-bold",
                                                                    inputWrapper: "h-8"
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollShadow>
                            )}
                        </ModalBody>
                        <ModalFooter className="justify-between">
                            <div className="text-sm text-slate-500 font-medium">
                                Total unidades: <span className="text-slate-900 dark:text-white font-bold">{totalSelected}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={handleConfirm}
                                    isDisabled={totalSelected === 0}
                                    className="font-bold shadow-lg shadow-blue-500/20"
                                >
                                    Confirmar Selección
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default VariantSelectionModal;
