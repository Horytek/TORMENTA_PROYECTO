import React, { useState, useEffect } from "react";
import { getProductAttributes } from "../api/products";
import { Loader2, Palette, Ruler, Boxes, Info } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ViewVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  productName: string;
}

interface AttributeData {
  id_atributo: number;
  nombre: string;
  values: {
    id: number;
    id_valor?: number;
    valor: string;
    hex?: string;
  }[];
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
          // Normalize to expected shape
          const normalized = response.attributes.map((attr: any) => ({
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
      <DialogContent className="max-w-xl border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
            Variantes y Atributos
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-1 truncate">
            Producto: <span className="font-semibold text-slate-600 dark:text-slate-300">{productName}</span>
          </p>
        </DialogHeader>

        <div className="min-h-[200px] flex flex-col justify-center py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-xs text-slate-400">Cargando variantes...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center text-destructive p-4 gap-2">
              <Info className="h-8 w-8 text-destructive/70" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : attributes.length === 0 ? (
            <div className="flex flex-col items-center text-center text-slate-400 p-4 gap-2">
              <Boxes className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="text-sm">Este producto no cuenta con variantes o atributos configurados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {attributes.map((attr) => {
                const isColor = attr.nombre.toLowerCase().includes("color") || attr.nombre.toLowerCase().includes("tonalidad");
                const isSize = attr.nombre.toLowerCase().includes("talla") || attr.nombre.toLowerCase().includes("medida");

                return (
                  <div 
                    key={attr.id_atributo} 
                    className="p-4 rounded-xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30"
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                      {isColor ? (
                        <Palette className="h-4 w-4 text-pink-500" />
                      ) : isSize ? (
                        <Ruler className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Boxes className="h-4 w-4 text-purple-500" />
                      )}
                      <span>{attr.nombre}</span>
                      <span className="text-[10px] text-slate-400 normal-case font-normal ml-auto">
                        ({attr.values.length} {attr.values.length === 1 ? "valor" : "valores"})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((v) => (
                        <Badge 
                          key={v.id || v.id_valor || v.valor}
                          variant="secondary"
                          className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-white"
                        >
                          {isColor && v.hex && (
                            <span 
                              className="w-3 h-3 rounded-full border border-slate-300/40 mr-1.5 inline-block"
                              style={{ backgroundColor: v.hex }}
                            />
                          )}
                          <span>{v.valor}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 dark:border-zinc-900 pt-4">
          <Button onClick={onClose} variant="ghost" className="rounded-xl w-full sm:w-auto">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
