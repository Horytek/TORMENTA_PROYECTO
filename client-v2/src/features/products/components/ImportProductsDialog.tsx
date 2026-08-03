import { useState } from "react";
import * as XLSX from "xlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { importExcelProducts } from "../api/products";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Nombres de marca/subcategoría, no IDs: antes había que conocer de memoria
// el id_marca/id_subcategoria numérico interno. El backend los resuelve por
// nombre (case-insensitive) contra el catálogo del tenant.
const COLUMNAS_PLANTILLA = ["descripcion", "marca", "subcategoria", "undm", "precio", "cod_barras"];

interface FilaImportacion {
  descripcion?: string;
  marca?: string;
  subcategoria?: string;
  undm?: string;
  precio?: number | string;
  cod_barras?: string;
}

const descargarPlantilla = () => {
  const ws = XLSX.utils.json_to_sheet([
    { descripcion: "Camiseta Algodón", marca: "Genérica", subcategoria: "Polos", undm: "NIU", precio: 35.9, cod_barras: "" },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.writeFile(wb, "plantilla_productos.xlsx");
};

export default function ImportProductsDialog({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [filas, setFilas] = useState<FilaImportacion[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => importExcelProducts(filas as Record<string, unknown>[]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const reset = () => {
    setFilas([]);
    setNombreArchivo("");
    setErrorArchivo(null);
    mutation.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setErrorArchivo(null);
    mutation.reset();
    setNombreArchivo(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<FilaImportacion>(sheet, { defval: "" });
      if (rows.length === 0) {
        setErrorArchivo("El archivo no tiene filas.");
        return;
      }
      if (rows.length > 500) {
        setErrorArchivo("Máximo 500 filas por importación.");
        return;
      }
      setFilas(rows);
    } catch {
      setErrorArchivo("No se pudo leer el archivo. Verifica que sea un .xlsx o .csv válido.");
    }
  };

  const filasSinDescripcion = filas.filter((f) => !f.descripcion || !f.marca || !f.subcategoria || !f.undm || !f.precio).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar productos desde Excel</DialogTitle>
          <DialogDescription>
            Sube un archivo .xlsx o .csv con las columnas: {COLUMNAS_PLANTILLA.join(", ")}.
            La marca y subcategoría deben existir ya en el sistema (se buscan por nombre, sin importar mayúsculas).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={descargarPlantilla}>
            <Download className="h-3.5 w-3.5" />
            Descargar plantilla
          </Button>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center hover:bg-muted/40">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {nombreArchivo || "Haz clic para elegir un archivo .xlsx o .csv"}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>

          {errorArchivo && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> {errorArchivo}
            </p>
          )}

          {filas.length > 0 && !mutation.isSuccess && (
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{filas.length}</span> filas leídas
                {filasSinDescripcion > 0 && (
                  <span className="text-destructive"> — {filasSinDescripcion} con datos incompletos (se omitirán)</span>
                )}
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground">
                    <tr>{COLUMNAS_PLANTILLA.map((c) => <th key={c} className="px-2 py-1.5">{c}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filas.slice(0, 8).map((f, i) => (
                      <tr key={i}>
                        {COLUMNAS_PLANTILLA.map((c) => (
                          <td key={c} className="px-2 py-1.5 text-foreground">{String((f as Record<string, unknown>)[c] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filas.length > 8 && <p className="text-xs text-muted-foreground">…y {filas.length - 8} filas más.</p>}
            </div>
          )}

          {mutation.isSuccess && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> {mutation.data.inserted} productos importados
              </p>
              {mutation.data.errors && mutation.data.errors.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                  {mutation.data.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          {mutation.isError && (
            <p className="text-sm text-destructive">No se pudo importar el archivo. Intenta de nuevo.</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose}>
            {mutation.isSuccess ? "Cerrar" : "Cancelar"}
          </Button>
          {!mutation.isSuccess && (
            <Button
              type="button"
              disabled={filas.length === 0 || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="gap-2"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar {filas.length > 0 ? `(${filas.length})` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
