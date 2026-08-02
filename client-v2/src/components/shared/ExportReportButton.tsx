import { Download, FileSpreadsheet, FileText, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { exportReportToCSV, exportReportToExcel, exportReportToPDF } from "@/lib/reportExporter";

interface ExportReportButtonProps {
  filename: string;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  disabled?: boolean;
}

/** Botón "Exportar" con los 3 formatos — mismos datos, un solo lugar para generarlos. */
export function ExportReportButton({ filename, title, headers, rows, disabled }: ExportReportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" disabled={disabled || rows.length === 0}>
          <Download className="h-3.5 w-3.5" /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportReportToCSV(filename, headers, rows)}>
          <Table className="mr-2 h-3.5 w-3.5" /> CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportReportToExcel(filename, title, headers, rows)}>
          <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportReportToPDF(filename, title, headers, rows)}>
          <FileText className="mr-2 h-3.5 w-3.5" /> PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
