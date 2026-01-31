import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Tooltip } from "@heroui/react";
import { getProductStockDetails } from "@/services/kardex.services";
import { Package, Info } from "lucide-react";

export default function StockDetailModal({ isOpen, onClose, product, almacenId, attrMetadataMap }) {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState([]);

    useEffect(() => {
        if (isOpen && product) {
            setLoading(true);
            getProductStockDetails(product.codigo, almacenId)
                .then((res) => {
                    if (res.success) {
                        setDetails(res.data || []);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, product, almacenId]);

    // --- LOGIC FOR MATRIX VIEW ---
    const getMatrixData = () => {
        if (!details.length) return null;

        // 1. Detect Standard Attributes (Color, Talla/Size) using Metadata or Fallback (Case insensitive)
        const getColorKey = (attrs) => Object.keys(attrs).find(k => k.toLowerCase().includes('color') || k === '1');
        const getSizeKey = (attrs) => Object.keys(attrs).find(k => k.toLowerCase().includes('talla') || k.toLowerCase().includes('size') || k === '2');

        // Check if ALL items have Color and/or Size (to decide if Matrix is viable)
        // Ideally we need at least one of them to pivot. If only one, it's a list. If both, Matrix.

        let colorKey = null;
        let sizeKey = null;

        // Verify first item to guess keys
        if (details.length > 0) {
            let sampleAttrs = details[0].attributes;
            try {
                if (typeof sampleAttrs === 'string') sampleAttrs = JSON.parse(sampleAttrs);
            } catch { }

            if (sampleAttrs) {
                colorKey = getColorKey(sampleAttrs);
                sizeKey = getSizeKey(sampleAttrs);
            }
        }

        if (colorKey && sizeKey) {
            // Matrix Viable
            return processMatrix(colorKey, sizeKey, details);
        }

        return null; // Fallback to list
    };

    const processMatrix = (colorKey, sizeKey, data) => {
        const sizes = new Set();
        const colors = new Set();
        const matrix = {}; // { [size]: { [color]: { stock, sku } } }

        data.forEach(item => {
            let attrs = item.attributes;
            try { if (typeof attrs === 'string') attrs = JSON.parse(item.attributes); } catch { }

            if (!attrs) return;

            const colorVal = attrs[colorKey];
            const sizeVal = attrs[sizeKey];

            if (colorVal) colors.add(colorVal);
            if (sizeVal) sizes.add(sizeVal);

            if (!matrix[sizeVal]) matrix[sizeVal] = {};
            matrix[sizeVal][colorVal] = item;
        });

        // Sort Colors/Sizes safely
        const sortedColors = Array.from(colors).sort();
        // Try strict numerical sort for sizes if possible (S, M, L mapping could be added later)
        const sortedSizes = Array.from(sizes).sort((a, b) => {
            // Basic numeric sort attempt
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        });

        return { sortedColors, sortedSizes, matrix };
    };

    const matrixData = getMatrixData();


    // --- OLD FORMAT (Fallback) ---
    const formatAttributes = (attrs) => {
        let attributes = attrs;
        if (typeof attributes === 'string') {
            try { attributes = JSON.parse(attributes); } catch { }
        }
        if (!attributes || Object.keys(attributes).length === 0) return "Estándar";

        const prodCode = product?.codigo;
        const meta = (attrMetadataMap && attrMetadataMap[prodCode]) || { names: {} };

        const keys = Object.keys(attributes).sort((a, b) => {
            const la = meta.names[a] || a;
            const lb = meta.names[b] || b;
            if (la === 'Color') return -1;
            if (lb === 'Color') return 1;
            return la.localeCompare(lb);
        });

        return keys.map(k => {
            const label = meta.names[k] || k;
            const val = attributes[k];
            return `${label}: ${val}`;
        }).join(", ");
    };

    const renderMatrix = (data) => {
        const { sortedColors, sortedSizes, matrix } = data;

        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border-b-2 border-slate-100 text-left text-xs text-slate-500 font-semibold bg-slate-50">
                                Talla \ Color
                            </th>
                            {sortedColors.map(color => (
                                <th key={color} className="p-2 border-b-2 border-slate-100 text-center text-xs text-slate-500 font-semibold bg-slate-50">
                                    {color}
                                </th>
                            ))}
                            <th className="p-2 border-b-2 border-slate-100 text-center text-xs text-slate-500 font-semibold bg-slate-50">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSizes.map(size => {
                            let totalSize = 0;
                            return (
                                <tr key={size} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-2 border-b border-slate-100 font-medium text-sm text-slate-700 bg-slate-50/30">
                                        {size}
                                    </td>
                                    {sortedColors.map(color => {
                                        const item = matrix[size]?.[color];
                                        const stock = item ? item.stock : 0;
                                        totalSize += Number(stock);
                                        return (
                                            <td key={color} className="p-2 border-b border-slate-100 text-center">
                                                {item ? (
                                                    <Tooltip content={
                                                        <div className="px-1 py-2">
                                                            <div className="text-tiny font-bold">SKU: {item.sku_label}</div>
                                                            <div className="text-tiny">Stock: {item.stock}</div>
                                                        </div>
                                                    }>
                                                        <Chip
                                                            size="sm"
                                                            variant="flat"
                                                            color={stock > 0 ? "success" : "default"}
                                                            className={stock === 0 ? "opacity-30" : "font-bold"}
                                                        >
                                                            {stock}
                                                        </Chip>
                                                    </Tooltip>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 border-b border-slate-100 text-center font-bold text-slate-600">
                                        {totalSize}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 border-b border-slate-100 pb-4">
                            <span className="text-lg font-bold text-slate-800">{product?.descripcion}</span>
                            <div className="flex items-center gap-2 text-sm text-slate-500 font-normal">
                                <Package size={16} />
                                <span>{product?.marca}</span>
                                <span className="mx-1">•</span>
                                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{product?.codigo}</span>
                            </div>
                        </ModalHeader>
                        <ModalBody className="py-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center p-8 gap-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <p className="text-sm text-slate-400">Cargando inventario...</p>
                                </div>
                            ) : (
                                <>
                                    {matrixData ? (
                                        renderMatrix(matrixData)
                                    ) : (
                                        <Table aria-label="Detalle de Variantes" shadow="none" classNames={{ wrapper: "p-0", th: "bg-slate-50" }}>
                                            <TableHeader>
                                                <TableColumn>VARIANTE</TableColumn>
                                                <TableColumn>SKU</TableColumn>
                                                <TableColumn align="center">STOCK</TableColumn>
                                            </TableHeader>
                                            <TableBody emptyContent="No hay variantes registradas.">
                                                {details.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>

                                                            {(() => {
                                                                let attributes = item.attributes;
                                                                try { if (typeof attributes === 'string') attributes = JSON.parse(attributes); } catch { }

                                                                if (!attributes || Object.keys(attributes).length === 0) {
                                                                    return <span className="text-slate-400 italic text-sm">Estándar</span>;
                                                                }

                                                                const prodCode = product?.codigo;
                                                                const meta = (attrMetadataMap && attrMetadataMap[prodCode]) || { names: {}, colors: {} };

                                                                const keys = Object.keys(attributes).sort((a, b) => {
                                                                    const la = (meta.names[a] || (a === '1' ? 'Color' : a === '2' ? 'Talla' : a)).toLowerCase();
                                                                    const lb = (meta.names[b] || (b === '1' ? 'Color' : b === '2' ? 'Talla' : b)).toLowerCase();
                                                                    if (la.includes('color')) return -1;
                                                                    if (lb.includes('color')) return 1;
                                                                    if (la.includes('talla') || la.includes('size')) return -1;
                                                                    if (lb.includes('talla') || lb.includes('size')) return 1;
                                                                    return la.localeCompare(lb);
                                                                });

                                                                return (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {keys.map((k) => {
                                                                            let label = meta.names[k];
                                                                            if (!label) {
                                                                                if (k === '1') label = 'Color';
                                                                                else if (k === '2') label = 'Talla';
                                                                                else label = k;
                                                                            }

                                                                            const value = attributes[k];
                                                                            const isColor = label.toLowerCase().includes('color');
                                                                            const hex = isColor ? (meta.colors?.[value] || null) : null;

                                                                            if (isColor) {
                                                                                return (
                                                                                    <Chip
                                                                                        key={k}
                                                                                        startContent={hex ? <span className="w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: hex }}></span> : null}
                                                                                        variant="flat"
                                                                                        size="sm"
                                                                                        className="bg-slate-100 text-slate-700 border border-slate-200 h-6"
                                                                                    >
                                                                                        <span className="font-semibold text-slate-500 mr-1">{label}:</span> {value}
                                                                                    </Chip>
                                                                                );
                                                                            }

                                                                            return (
                                                                                <Chip key={k} size="sm" variant="bordered" className="border-slate-200 text-slate-600 h-6 bg-white">
                                                                                    <span className="font-semibold text-slate-400 mr-1">{label}:</span> {value}
                                                                                </Chip>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{item.sku_label}</code>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip size="sm" variant="flat" color={item.stock > 0 ? "success" : "danger"}>
                                                                {item.stock}
                                                            </Chip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </>
                            )}
                        </ModalBody>
                        <ModalFooter className="border-t border-slate-100 pt-4">
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
