import { useState, useEffect } from "react";
import { getProductAttributes } from "../api/products";
import { Loader2, Palette, Ruler, Boxes, Info } from "lucide-react";

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
}: ViewVariantsModalProps) {
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
