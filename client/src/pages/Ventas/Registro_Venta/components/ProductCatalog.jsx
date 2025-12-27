import React from 'react';
import { Input, Card, CardBody, Button, Chip, ScrollShadow } from "@heroui/react";
import { Search, ShoppingCart, Package } from "lucide-react";

const ProductCatalog = ({ pos }) => {
    const {
        productos,
        addToCart,
        globalFilter,
        setGlobalFilter,
        selectedCategory,
        setSelectedCategory
    } = pos;

    // Filter Logic
    const filteredProducts = React.useMemo(() => {
        return productos.filter(p => {
            const matchText = p.nombre.toLowerCase().includes(globalFilter.toLowerCase()) ||
                p.codigo.toLowerCase().includes(globalFilter.toLowerCase());
            const matchCat = selectedCategory ? p.categoria === selectedCategory : true;
            return matchText && matchCat;
        });
    }, [productos, globalFilter, selectedCategory]);

    // Extract Categories
    const categories = React.useMemo(() => {
        return [...new Set(productos.map(p => p.categoria))].filter(Boolean).sort();
    }, [productos]);

    return (
        <Card className="flex-1 h-full shadow-sm border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden flex flex-col">
            {/* Header: Search & Filters */}
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 space-y-3">
                <Input
                    placeholder="Buscar producto (F2)..."
                    value={globalFilter}
                    onValueChange={setGlobalFilter}
                    startContent={<Search className="w-5 h-5 text-slate-400" />}
                    size="lg"
                    classNames={{
                        inputWrapper: "bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 shadow-none",
                        input: "font-medium"
                    }}
                    autoFocus
                />

                <ScrollShadow orientation="horizontal" className="pb-1">
                    <div className="flex gap-2">
                        <Chip
                            variant={selectedCategory === null ? "solid" : "bordered"}
                            color={selectedCategory === null ? "primary" : "default"}
                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                            onClick={() => setSelectedCategory(null)}
                        >
                            Todos
                        </Chip>
                        {categories.map(cat => (
                            <Chip
                                key={cat}
                                variant={selectedCategory === cat ? "solid" : "bordered"}
                                color={selectedCategory === cat ? "primary" : "default"}
                                className="cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                onClick={() => setSelectedCategory(cat)}
                            >
                                {cat}
                            </Chip>
                        ))}
                    </div>
                </ScrollShadow>
            </div>

            {/* Body: Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-zinc-950/50">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.codigo}
                                product={product}
                                onAdd={() => addToCart(product)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Package className="w-12 h-12 mb-2 opacity-50" />
                        <p>No se encontraron productos</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

const ProductCard = ({ product, onAdd }) => {
    const hasStock = product.stock > 0;

    return (
        <Card
            isPressable={hasStock}
            onPress={hasStock ? onAdd : undefined}
            className={`border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all
        ${!hasStock ? 'opacity-60 bg-slate-100' : 'bg-white dark:bg-zinc-900'}
      `}
        >
            <CardBody className="p-3 flex flex-col gap-2 h-full justify-between">
                <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="text-xs font-mono text-slate-400 truncate">{product.codigo}</span>
                        <Chip
                            size="sm"
                            variant="flat"
                            color={product.stock > 10 ? "success" : product.stock > 0 ? "warning" : "danger"}
                            classNames={{ content: "font-bold text-[10px] px-1" }}
                            className="h-5 min-h-0"
                        >
                            Qty: {product.stock}
                        </Chip>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                        {product.nombre}
                    </h4>
                </div>

                <div className="mt-auto">
                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400">Precio unit.</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                S/ {parseFloat(product.precio).toFixed(2)}
                            </span>
                        </div>
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                                ${hasStock
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                    : 'bg-slate-100 text-slate-300 dark:bg-zinc-800 dark:text-zinc-600'}`}
                        >
                            <ShoppingCart size={16} />
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

export default ProductCatalog;
