import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProductAttributes, getHistorialPrecioProducto, getProductVariants } from "../api/products";
import { Loader2, Palette, Ruler, Boxes, Info, History, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SwatchStrip } from "@/components/brand/Swatch";
import { SizeCurve } from "@/components/brand/SizeCurve";

interface ViewVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  productName: string;
  /** Punto de reorden configurado del producto; null/undefined = usa el umbral genérico (5). */
  stockMin?: number | null;
}

interface AttributeValue {
  id?: number;
  id_valor?: number;
  valor: string;
  hex?: string;
}

interface AttributeData {
  id_atributo: number;
  nombre: string;
  values: AttributeValue[];
}

export default function ViewVariantsModal({
  isOpen,
  onClose,
  productId,
  productName,
  stockMin,
}: ViewVariantsModalProps) {
  const umbralBajo = stockMin != null ? Number(stockMin) : 5;
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState<AttributeData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttributes = async () => {
      if (!productId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getProductAttributes(productId);
        if (response && response.attributes) {
          const normalized = response.attributes.map((attr) => ({
            id_atributo: attr.id_atributo,
            nombre: attr.nombre || "Atributo",
            values: attr.values || [],
          }));
          setAttributes(normalized);
        } else {
          setAttributes([]);
        }
      } catch (err) {
        console.error("Error loading product variants:", err);
        setError("Ocurrió un error al cargar las variantes del producto.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && productId) {
      fetchAttributes();
    }
  }, [isOpen, productId]);

  const { data: historialPrecio = [] } = useQuery({
    queryKey: ["historial-precio", productId],
    queryFn: () => getHistorialPrecioProducto(productId!),
    enabled: isOpen && !!productId,
  });

  const { data: skus = [] } = useQuery({
    queryKey: ["product-variants-skus", productId],
    queryFn: () => getProductVariants(productId!),
    enabled: isOpen && !!productId,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Variantes y atributos
          </DialogTitle>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            Producto: <span className="font-medium text-foreground">{productName}</span>
          </p>
        </DialogHeader>

        <div className="flex min-h-[200px] flex-col justify-center py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-xs text-muted-foreground">Cargando variantes…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center text-destructive">
              <Info className="h-8 w-8 text-destructive/70" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : attributes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center text-muted-foreground">
              <Boxes className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm">Este producto no cuenta con variantes o atributos configurados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {attributes.map((attr) => {
                const name = attr.nombre.toLowerCase();
                const isColor = name.includes("color") || name.includes("tonalidad");
                const isSize =
                  name.includes("talla") || name.includes("medida") || name.includes("tama");
                const hexes = attr.values.filter((v) => v.hex).map((v) => v.hex as string);

                return (
                  <div
                    key={attr.id_atributo}
                    className="rounded-lg border border-border bg-muted/40 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {isColor ? (
                        <Palette className="h-4 w-4 text-brand" />
                      ) : isSize ? (
                        <Ruler className="h-4 w-4 text-brand" />
                      ) : (
                        <Boxes className="h-4 w-4 text-brand" />
                      )}
                      <span>{attr.nombre}</span>
                      <span className="num ml-auto text-[10px] font-normal normal-case text-muted-foreground">
                        {attr.values.length} {attr.values.length === 1 ? "valor" : "valores"}
                      </span>
                    </div>

                    {/* Tonalidades: tira de swatches + nombres */}
                    {isColor ? (
                      <div className="space-y-3">
                        {hexes.length > 0 && <SwatchStrip colors={hexes} size="lg" max={12} />}
                        <div className="flex flex-wrap gap-1.5">
                          {attr.values.map((v) => (
                            <Badge
                              key={v.id ?? v.id_valor ?? v.valor}
                              variant="secondary"
                              className="gap-1.5 font-medium"
                            >
                              {v.hex && (
                                <span
                                  className="inline-block h-3 w-3 rounded-full ring-1 ring-black/10"
                                  style={{ backgroundColor: v.hex }}
                                />
                              )}
                              {v.valor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : isSize ? (
                      /* Tallas: curva */
                      <SizeCurve sizes={attr.values.map((v) => v.valor)} />
                    ) : (
                      /* Otros atributos: chips */
                      <div className="flex flex-wrap gap-1.5">
                        {attr.values.map((v) => (
                          <Badge
                            key={v.id ?? v.id_valor ?? v.valor}
                            variant="secondary"
                            className="font-medium"
                          >
                            {v.valor}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {skus.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Package className="h-3.5 w-3.5 text-brand" /> Stock por variante ({skus.length} {skus.length === 1 ? "variante" : "variantes"})
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-muted text-[10px] uppercase font-semibold text-muted-foreground backdrop-blur border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Variante</th>
                      <th className="px-3 py-2">Código / SKU</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {skus.map((sku) => {
                      const attrLabel =
                        Object.values(sku.attrs || {}).filter(Boolean).join(" / ") ||
                        sku.sku ||
                        `SKU #${sku.id_sku}`;
                      const stockNum = Number(sku.stock);
                      return (
                        <tr key={sku.id_sku} className="hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 font-medium text-foreground">{attrLabel}</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono text-[11px]">
                            {sku.cod_barras || sku.sku || "-"}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground font-medium">
                            {sku.precio != null ? `S/ ${Number(sku.precio).toFixed(2)}` : "-"}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            <span
                              className={
                                stockNum === 0
                                  ? "text-destructive"
                                  : stockNum <= umbralBajo
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }
                            >
                              {stockNum.toLocaleString()} disp.
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {historialPrecio.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <History className="h-3.5 w-3.5" /> Historial de precio
              </p>
              <ul className="space-y-1.5">
                {historialPrecio.map((h) => (
                  <li key={h.id_log} className="text-xs text-muted-foreground">
                    <span className="text-foreground">{h.descripcion}</span>
                    {" — "}
                    {new Date(h.fecha).toLocaleDateString("es-PE")}
                    {h.usuario ? ` · ${h.usuario}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-4">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
