import { useState, useEffect, useCallback } from "react";
import { MdOutlineLocalPrintshop } from "react-icons/md";
import { Button, Select, SelectItem, DateRangePicker } from "@heroui/react";
import { useAlmacenesKardex } from '@/hooks/useKardex';
import { parseDate } from "@internationalized/date";
import { startOfWeek, endOfWeek } from "date-fns";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { useUserStore } from "@/store/useStore";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function HeaderHistorico({ productoData, onDateChange, transactions, previousTransactions, dateRange }) {
  const { almacenes } = useAlmacenesKardex();
  const nombre = useUserStore(state => state.nombre);
  const almacenGlobal = useUserStore((state) => state.almacen);
  const setAlmacenGlobal = useUserStore((state) => state.setAlmacen);
  const navigate = useNavigate();

  // Calcular el rango de la semana actual (lunes a domingo) según la fecha actual
  function getCurrentWeekRange() {
    const today = new Date();
    // Lunes como primer día de la semana
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    return {
      start: weekStart,
      end: weekEnd,
    };
  }

  // Inicializar el rango de fechas al rango de la semana actual
  const initialWeekRange = getCurrentWeekRange();

  const [selectedAlmacen, setSelectedAlmacen] = useState(almacenGlobal || "");
  const [selectedDates, setSelectedDates] = useState({
    startDate: initialWeekRange.start,
    endDate: initialWeekRange.end,
  });

  const [value, setValue] = useState({
    start: parseDate(initialWeekRange.start.toISOString().slice(0, 10)),
    end: parseDate(initialWeekRange.end.toISOString().slice(0, 10)),
  });

  const [empresaData, setEmpresaData] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const data = await getEmpresaDataByUser(nombre);
        setEmpresaData(data);
        if (data?.logotipo && !data.logotipo.startsWith('data:image')) {
          const response = await fetch(data.logotipo);
          const blob = await response.blob();
          const reader = new window.FileReader();
          reader.onloadend = () => setLogoBase64(reader.result);
          reader.readAsDataURL(blob);
        } else {
          setLogoBase64(data?.logotipo || null);
        }
      } catch (error) {
        setEmpresaData(null);
        setLogoBase64(null);
      }
    };
    fetchEmpresa();
  }, []);

  useEffect(() => {
    if (almacenGlobal) {
      setSelectedAlmacen(almacenGlobal);
    }
    const formattedStartDate = selectedDates.startDate.toISOString().split("T")[0];
    const formattedEndDate = selectedDates.endDate.toISOString().split("T")[0];
    onDateChange(formattedStartDate, formattedEndDate, almacenGlobal || "");
  }, [onDateChange, selectedDates.startDate, selectedDates.endDate, almacenGlobal]);

  useEffect(() => {
    if (selectedAlmacen && selectedDates.startDate && selectedDates.endDate) {
      const formattedStartDate = selectedDates.startDate.toISOString().split("T")[0];
      const formattedEndDate = selectedDates.endDate.toISOString().split("T")[0];
      onDateChange(formattedStartDate, formattedEndDate, selectedAlmacen);
      setAlmacenGlobal(selectedAlmacen); // Actualiza el almacén global en Zustand
    }
  }, [selectedAlmacen, selectedDates.startDate, selectedDates.endDate, onDateChange, setAlmacenGlobal]);

  const handleAlmacenChange = useCallback((selectedId) => {
    setSelectedAlmacen(selectedId);
    setAlmacenGlobal(selectedId); // Actualiza el almacén global en Zustand
  }, [setAlmacenGlobal]);

  // ADAPTADO: Usa datos de empresa dinámicos
  const generatePDFKardex = async (productoData, transactions = [], previousTransactions = [], dateRange = {}) => {
    try {
      const jspdfModule = await import(/* @vite-ignore */ 'jspdf');
      await import(/* @vite-ignore */ 'jspdf-autotable');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let cursorY = 14;

      // Logo
      try { if (logoBase64) doc.addImage(logoBase64, 'PNG', 12, cursorY - 2, 28, 28); } catch { }

      // Encabezado empresa (respetando espacio derecho)
      const xText = logoBase64 ? 46 : 16;
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(empresaData?.nombreComercial || 'TORMENTA JEANS', xText, cursorY);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      cursorY += 6;
      const boxW = 72;
      const boxX = pageWidth - boxW - 16;
      const infoMaxWidth = Math.max(80, boxX - xText - 8);

      const direccionLines = doc.splitTextToSize(`Central: ${empresaData?.direccion || ''}`, infoMaxWidth);
      direccionLines.forEach(line => { doc.text(line, xText, cursorY); cursorY += 4; });
      const ubicLines = doc.splitTextToSize(`${empresaData?.distrito || ''} - ${empresaData?.provincia || ''} - ${empresaData?.departamento || ''}`, infoMaxWidth);
      ubicLines.forEach(line => { doc.text(line, xText, cursorY); cursorY += 4; });
      doc.text(`TELF: ${empresaData?.telefono || ''}`, xText, cursorY); cursorY += 4;
      doc.text(`EMAIL: ${empresaData?.email || ''}`, xText, cursorY); cursorY += 8;

      // Recuadro derecho (RUC / título)
      doc.setDrawColor(80); doc.setLineWidth(0.25);
      doc.rect(boxX, 12, boxW, 36);
      doc.setFontSize(10.5); doc.setFont('helvetica', 'bold');
      doc.text(`RUC ${empresaData?.ruc || '20610588981'}`, boxX + boxW / 2, 18, { align: 'center' });
      doc.setFillColor(191, 219, 254); doc.rect(boxX, 24, boxW, 11, 'F');
      doc.setFontSize(10.5);
      doc.text('HISTÓRICO', boxX + boxW / 2, 30, { align: 'center' });

      // Producto / resumen
      cursorY += 4;
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      const prodLabel = productoData?.[0];
      if (prodLabel) {
        doc.text(`Producto: ${prodLabel.descripcion}`, 15, cursorY);
        cursorY += 5;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text(`Marca: ${prodLabel.marca}   COD: ${prodLabel.codigo}   Stock: ${prodLabel.stock}`, 15, cursorY);
        cursorY += 8;
      }

      // Tabla transacciones
      const rows = (transactions || []).map(item => [
        item.fecha ? new Date(item.fecha).toLocaleDateString() : '',
        item.documento || '',
        item.nombre || '',
        item.entra != null ? String(item.entra) : '0',
        item.sale != null ? String(item.sale) : '0',
        item.stock != null ? String(item.stock) : '',
        item.precio != null ? String(item.precio) : '',
        (item.glosa || '').replace(/\r?\n/g, ' ')
      ]);

      doc.autoTable({
        head: [['Fecha', 'Documento', 'Nombre', 'Entra', 'Sale', 'Stock', 'Precio', 'Glosa']],
        body: rows,
        startY: cursorY,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [191, 219, 254], textColor: [15, 23, 42], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 36 },
          2: { cellWidth: 46 },
          3: { cellWidth: 18, halign: 'right' },
          4: { cellWidth: 18, halign: 'right' },
          5: { cellWidth: 18, halign: 'right' },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 46 }
        },
        tableWidth: 'auto'
      });

      // Footer / paginación
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(120);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      }

      doc.save(`kardex_movimientos.pdf`);
      // feedback
      console.info('PDF generado: kardex_movimientos.pdf');
    } catch (err) {
      console.error('Error generando PDF con jsPDF:', err);
      alert('Error al generar PDF (ver consola)');
    }
  };

  const handleGeneratePDFKardex = () => {
    generatePDFKardex(productoData, transactions, previousTransactions, dateRange);
  };

  const handleDateChange = (newValue) => {
    if (newValue.start && newValue.end) {
      const newStartDate = new Date(newValue.start.year, newValue.start.month - 1, newValue.start.day);
      const newEndDate = new Date(newValue.end.year, newValue.end.month - 1, newValue.end.day);
      setValue(newValue);
      setSelectedDates({
        startDate: newStartDate,
        endDate: newEndDate,
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Top Header: Title & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Button
            isIconOnly
            variant="flat"
            onPress={() => navigate(-1)}
            className="bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-200"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              Historial del Producto
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Analiza el movimiento y trazabilidad del inventario
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            onPress={handleGeneratePDFKardex}
            color="danger"
            variant="flat"
            startContent={<MdOutlineLocalPrintshop className="text-lg" />}
            className="font-medium"
          >
            Exportar PDF
          </Button>
          <Select
            selectedKeys={[selectedAlmacen]}
            onSelectionChange={(keys) => handleAlmacenChange([...keys][0])}
            disabled={almacenes.length === 0}
            className="w-full sm:w-60"
            variant="flat"
            labelPlacement="outside"
            classNames={{
              trigger: "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm h-10",
              value: "text-slate-900 dark:text-zinc-100 font-medium",
            }}
            aria-label="Seleccionar almacén"
          >
            {almacenes.map((almacen) => (
              <SelectItem key={almacen.id} value={almacen.id} textValue={almacen.almacen}>
                {almacen.almacen}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* 2. Product Info & Date Filter Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Product Details */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border border-blue-100 dark:border-zinc-700/50">
            {productoData.length > 0 ? productoData[0].descripcion.charAt(0) : "P"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">
              {productoData.length > 0 ? productoData[0].descripcion : "Producto no encontrado"}
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1 text-sm text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-wider uppercase text-slate-400">Código:</span>
                <span className="font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-300 font-medium">
                  {productoData.length > 0 ? productoData[0].codigo : "---"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-wider uppercase text-slate-400">Stock:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{productoData.length > 0 ? productoData[0].stock : "0"} UND</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-wider uppercase text-slate-400">Marca:</span>
                <span className="font-medium text-slate-700 dark:text-zinc-300">{productoData.length > 0 ? productoData[0].marca : "---"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-100 dark:border-zinc-800">
          <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400 whitespace-nowrap">Rango de fechas:</span>
          <DateRangePicker
            className="w-full sm:w-64"
            variant="flat"
            size="sm"
            classNames={{
              inputWrapper: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm",
            }}
            value={value}
            onChange={handleDateChange}
            aria-label="Seleccionar rango de fechas"
          />
        </div>
      </div>
    </div>
  );
}

export default HeaderHistorico;